import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import { Api, TelegramClient } from 'telegram'
import { generateRandomBytes } from 'telegram/Helpers'
import { computeCheck } from 'telegram/Password'
import { StringSession } from 'telegram/sessions'
import { getRepository } from 'typeorm'
import { Users } from '../../model//entities/Users'
import { Files } from '../../model/entities/Files'
import { Waitings } from '../../model/entities/Waitings'
import { COOKIE_AGE, TG_CREDS } from '../../utils/Constant'
import { Endpoint } from '../base/Endpoint'
import { TGClient } from '../middlewares/TGClient'
import { TGSessionAuth } from '../middlewares/TGSessionAuth'

@Endpoint.API()
export class Auth {

  @Endpoint.POST({ middlewares: [TGClient] })
  public async sendCode(req: Request, res: Response): Promise<any> {
    const { token: id, phoneNumber } = req.body
    if (!id || !phoneNumber) {
      throw { status: 400, body: { error: 'Token and phone number are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'The invitation code is invalid' } }
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
    const { token: id, phoneNumber, phoneCodeHash } = req.body
    if (!id || !phoneNumber || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Token, phone number, and phone code hash are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'The invitation code is invalid' } }
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
    const { token: id, phoneNumber, phoneCode, phoneCodeHash, password } = req.body
    if ((!id || (!phoneNumber || !phoneCode || !phoneCodeHash)) && !password) {
      if (!password) {
        throw { status: 400, body: { error: 'Token and password are required' } }
      }
      throw { status: 400, body: { error: 'Token, phone number, phone code, and phone code hash are required' } }
    }

    const waiting = await Waitings.findOne({ id })
    if (!waiting) {
      throw { status: 400, body: { error: 'The invitation code is invalid' } }
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
    let user = await Users.findOne({ tg_id: userAuth.id })
    const check = await Users.createQueryBuilder('users')
      .where('(tg_id = :tg_id and email != :email) or (tg_id != :tg_id and email = :email)', {
        tg_id: userAuth.id,
        email: waiting.email
      }).getOne()
    console.log('LANSAS', check)
    if (check) {
      await req.tg.invoke(new Api.auth.LogOut())
      throw { status: 400, body: { error: 'The invitation code is invalid' } }
    }

    if (!user) {
      const username = userAuth.username || userAuth.phone || phoneNumber
      user = await getRepository<Users>(Users).save({
        username,
        name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
        email: waiting.email,
        tg_id: userAuth.id
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
        const signedKey = sign({ file: { id: file.id }, session }, process.env.FILES_JWT_SECRET)
        Files.update(file.id, { signed_key: Buffer.from(signedKey).toString('base64') })
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
      throw { status: 401, body: { error: 'Refresh token is invalid' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: 5 })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }

    await req.tg.connect()
    const userAuth = await req.tg.getMe()
    const user = await Users.findOne({ tg_id: userAuth['id'] })
    if (!user) {
      throw { status: 401, body: { error: 'User not found' } }
    }

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
  }

  /**
   * Experimental
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
    return res.cookie('authorization', `Bearer ${req.tg.session.save()}`).send({ token: Buffer.from(data['token']).toString('base64') })
  }

  /**
   * Experimental
   * @param req
   * @param res
   * @returns
   */
  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async qrCodeSignIn(req: Request, res: Response): Promise<any> {
    const { token } = req.body
    if (!token) {
      throw { status: 400, body: { error: 'Token is required' } }
    }
    await req.tg.connect()
    const data = await req.tg.invoke(new Api.auth.AcceptLoginToken({
      token: Buffer.from(token, 'base64')
    }))
    return res.cookie('authorization', `Bearer ${req.tg.session.save()}`).send({ data })
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
    const data = await req.tg.invoke(new Api.auth.LogOut())
    return res.clearCookie('authorization').clearCookie('refreshToken').send({ success: data })
  }
}