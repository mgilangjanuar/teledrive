import { Api, TelegramClient } from '@mgilangjanuar/telegram'
import { generateRandomBytes } from '@mgilangjanuar/telegram/Helpers'
import { computeCheck } from '@mgilangjanuar/telegram/Password'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import { AES } from 'crypto-js'
import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import { serializeError } from 'serialize-error'
import { getRepository } from 'typeorm'
import { Users } from '../../model//entities/Users'
import { Files } from '../../model/entities/Files'
import { CONNECTION_RETRIES, COOKIE_AGE, TG_CREDS } from '../../utils/Constant'
import { Endpoint } from '../base/Endpoint'
import { TGClient } from '../middlewares/TGClient'
import { TGSessionAuth } from '../middlewares/TGSessionAuth'

@Endpoint.API()
export class Auth {

  @Endpoint.POST({ middlewares: [TGClient] })
  public async sendCode(req: Request, res: Response): Promise<any> {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      throw { status: 400, body: { error: 'Phone number is required' } }
    }

    await req.tg.connect()
    const { phoneCodeHash } = await req.tg.invoke(new Api.auth.SendCode({
      ...TG_CREDS,
      phoneNumber,
      settings: new Api.CodeSettings({
        allowFlashcall: true,
        currentNumber: true,
        allowAppHash: true,
      })
    }))
    const session = req.tg.session.save()
    const accessToken = sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '3h' })
    return res.cookie('authorization', `Bearer ${accessToken}`)
      .send({ phoneCodeHash, accessToken })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async reSendCode(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCodeHash } = req.body
    if (!phoneNumber || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Phone number and phone code hash are required' } }
    }

    await req.tg.connect()
    const { phoneCodeHash: newPhoneCodeHash } = await req.tg.invoke(new Api.auth.ResendCode({
      phoneNumber, phoneCodeHash }))
    const session = req.tg.session.save()
    const accessToken = sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '3h' })
    return res.cookie('authorization', `Bearer ${accessToken}`)
      .send({ phoneCodeHash: newPhoneCodeHash, accessToken })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async login(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCode, phoneCodeHash, password } = req.body
    if ((!phoneNumber || !phoneCode || !phoneCodeHash) && !password) {
      if (!password) {
        throw { status: 400, body: { error: 'Password is required' } }
      }
      throw { status: 400, body: { error: 'Phone number, phone code, and phone code hash are required' } }
    }

    await req.tg.connect()
    let signIn: any
    if (password) {
      const data = await req.tg.invoke(new Api.account.GetPassword())
      data.newAlgo['salt1'] = Buffer.concat([data.newAlgo['salt1'], generateRandomBytes(32)])
      signIn = await req.tg.invoke(new Api.auth.CheckPassword({ password: await computeCheck(data, password) }))
    } else {
      signIn = await req.tg.invoke(new Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }))
    }
    const userAuth = signIn['user']
    if (!userAuth) {
      throw { status: 400, body: { error: 'User not found/authorized' } }
    }

    let user = await Users.findOne({ tg_id: userAuth.id.toString() })

    if (!user) {
      const username = userAuth.username || userAuth.phone || phoneNumber
      user = await getRepository<Users>(Users).save({
        username,
        name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
        tg_id: userAuth.id.toString()
      }, { reload: true })
    }

    const session = req.tg.session.save()
    const auth = {
      accessToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '15h' }),
      refreshToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '1y' }),
      expiredAfter: Date.now() + COOKIE_AGE
    }

    res
      .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
      .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
      .send({ user, ...auth })

    // sync all shared files in background, if any
    Files.createQueryBuilder('files')
      .where('user_id = :user_id and signed_key is not null', { user_id: user.id })
      .getMany()
      .then(files => files?.map(file => {
        const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), process.env.FILES_JWT_SECRET).toString()
        Files.update(file.id, { signed_key: signedKey })
      }))
  }

  @Endpoint.POST()
  public async refreshToken(req: Request, res: Response): Promise<any> {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken
    if (!refreshToken) {
      throw { status: 400, body: { error: 'Refresh token is required' } }
    }

    let data: { session: string }
    try {
      data = verify(refreshToken, process.env.API_JWT_SECRET) as { session: string }
    } catch (error) {
      throw { status: 400, body: { error: 'Refresh token is invalid' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: 5 })
    } catch (error) {
      throw { status: 400, body: { error: 'Invalid key' } }
    }

    await req.tg.connect()
    const userAuth = await req.tg.getMe()
    const user = await Users.findOne({ tg_id: userAuth['id'].toString() })
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    try {
      const session = req.tg.session.save()
      const auth = {
        accessToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '15h' }),
        refreshToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '100y' }),
        expiredAfter: Date.now() + COOKIE_AGE
      }
      return res
        .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
        .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
        .send({ user, ...auth })
    } catch (error) {
      throw { status: 500, body: { error: error.message || 'Something error', details: serializeError(error) } }
    }
  }

  /**
   * Initialize export login token to be a param for URL tg://login?token={{token}}
   * @param req
   * @param res
   * @returns
   */
  @Endpoint.GET({ middlewares: [TGClient] })
  public async qrCode(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.invoke(new Api.auth.ExportLoginToken({
      ...TG_CREDS,
      exceptIds: []
    }))

    const session = req.tg.session.save()
    const auth = {
      accessToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '15h' }),
      refreshToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '100y' }),
      expiredAfter: Date.now() + COOKIE_AGE
    }
    return res
      .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
      .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
      .send({ loginToken: Buffer.from(data['token'], 'utf8').toString('base64url'), accessToken: auth.accessToken })
  }

  /**
   * Sign in process with QR Code https://core.telegram.org/api/qr-login
   * @param req
   * @param res
   * @returns
   */
  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async qrCodeSignIn(req: Request, res: Response): Promise<any> {
    const { password, session: sessionString } = req.body

    // handle the 2fa password in the second call
    if (password && sessionString) {
      req.tg = new TelegramClient(new StringSession(sessionString), TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: CONNECTION_RETRIES, useWSS: false })
      await req.tg.connect()

      const passwordData = await req.tg.invoke(new Api.account.GetPassword())

      passwordData.newAlgo['salt1'] = Buffer.concat([passwordData.newAlgo['salt1'], generateRandomBytes(32)])
      const signIn = await req.tg.invoke(new Api.auth.CheckPassword({
        password: await computeCheck(passwordData, password)
      }))
      const userAuth = signIn['user']
      if (!userAuth) {
        throw { status: 400, body: { error: 'User not found/authorized' } }
      }

      let user = await Users.findOne({ tg_id: userAuth.id.toString() })
      if (!user) {
        const username = userAuth.username || userAuth.phone
        user = await getRepository<Users>(Users).save({
          username,
          name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
          tg_id: userAuth.id.toString()
        }, { reload: true })
      }

      const session = req.tg.session.save()
      const auth = {
        accessToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '15h' }),
        refreshToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '1y' }),
        expiredAfter: Date.now() + COOKIE_AGE
      }

      res
        .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
        .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
        .send({ user, ...auth })

      // sync all shared files in background, if any
      Files.createQueryBuilder('files')
        .where('user_id = :user_id and signed_key is not null', { user_id: user.id })
        .getMany()
        .then(files => files?.map(file => {
          const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), process.env.FILES_JWT_SECRET).toString()
          Files.update(file.id, { signed_key: signedKey })
        }))
      return
    }

    // handle the second call for export login token, result case: success, need to migrate to other dc, or 2fa
    await req.tg.connect()
    try {
      const data = await req.tg.invoke(new Api.auth.ExportLoginToken({
        ...TG_CREDS,
        exceptIds: []
      }))

      // build response with user data and auth data
      const buildResponse = (data: Record<string, any> & { user?: { id: string } })=> {
        const session = req.tg.session.save()
        const auth = {
          accessToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '15h' }),
          refreshToken: sign({ session }, process.env.API_JWT_SECRET, { expiresIn: '1y' }),
          expiredAfter: Date.now() + COOKIE_AGE
        }
        res
          .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
          .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
          .send({ ...data, ...auth })

        if (data.user?.id) {
          // sync all shared files in background, if any
          Files.createQueryBuilder('files')
            .where('user_id = :user_id and signed_key is not null', { user_id: data.user.id })
            .getMany()
            .then(files => files?.map(file => {
              const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), process.env.FILES_JWT_SECRET).toString()
              Files.update(file.id, { signed_key: signedKey })
            }))
        }
        return
      }

      // handle to switch dc
      if (data instanceof Api.auth.LoginTokenMigrateTo) {
        await req.tg._switchDC(data.dcId)
        const result = await req.tg.invoke(new Api.auth.ImportLoginToken({
          token: data.token
        }))

        // result import login token success
        if (result instanceof Api.auth.LoginTokenSuccess && result.authorization instanceof Api.auth.Authorization) {
          const userAuth = result.authorization.user
          let user = await Users.findOne({ tg_id: userAuth.id.toString() })
          if (!user) {
            const username = userAuth['username'] || userAuth['phone']
            user = await getRepository<Users>(Users).save({
              username,
              name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
              tg_id: userAuth.id.toString()
            }, { reload: true })
          }
          return buildResponse({ user })
        }
        return buildResponse({ data, result })

        // handle if success
      } else if (data instanceof Api.auth.LoginTokenSuccess && data.authorization instanceof Api.auth.Authorization) {
        const userAuth = data.authorization.user
        let user = await Users.findOne({ tg_id: userAuth.id.toString() })
        if (!user) {
          const username = userAuth['username'] || userAuth['phone']
          user = await getRepository<Users>(Users).save({
            username,
            name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
            tg_id: userAuth.id.toString()
          }, { reload: true })
        }
        return buildResponse({ user })
      }

      // data instanceof auth.LoginToken
      return buildResponse({
        loginToken: Buffer.from(data['token'], 'utf8').toString('base64url')
      })
    } catch (error) {
      // handle if need 2fa password
      if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        error.session = req.tg.session.save()
      }
      throw error
    }
  }

  @Endpoint.GET({ middlewares: [TGSessionAuth] })
  public async me(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const data = await req.tg.getMe()
    return res.send({ user: data })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async logout(req: Request, res: Response): Promise<any> {
    await req.tg.connect()
    const success = await req.tg.invoke(new Api.auth.LogOut())
    return res.clearCookie('authorization').clearCookie('refreshToken').send({ success })
  }
}