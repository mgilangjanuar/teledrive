import { AES } from 'crypto-js'
import { Request, Response } from 'express'
import { sign, verify } from 'jsonwebtoken'
import { serializeError } from 'serialize-error'
import { Api, Logger, TelegramClient } from 'telegram'
import { LogLevel } from 'telegram/extensions/Logger'
import { generateRandomBytes } from 'telegram/Helpers'
import { computeCheck } from 'telegram/Password'
import { StringSession } from 'telegram/sessions'
import { prisma } from '../../model'
import { Redis } from '../../service/Cache'
import { API_JWT_SECRET, CONNECTION_RETRIES, COOKIE_AGE, FILES_JWT_SECRET, TG_CREDS } from '../../utils/Constant'
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
    const { phoneCodeHash, timeout } = await req.tg.invoke(new Api.auth.SendCode({
      ...TG_CREDS,
      phoneNumber,
      settings: new Api.CodeSettings({
        allowFlashcall: true,
        currentNumber: true,
        allowAppHash: true,
      })
    }))
    const session = req.tg.session.save()
    const accessToken = sign({ session }, API_JWT_SECRET, { expiresIn: '3h' })
    return res.cookie('authorization', `Bearer ${accessToken}`)
      .send({ phoneCodeHash, timeout, accessToken })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async reSendCode(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCodeHash } = req.body
    if (!phoneNumber || !phoneCodeHash) {
      throw { status: 400, body: { error: 'Phone number and phone code hash are required' } }
    }

    await req.tg.connect()
    const { phoneCodeHash: newPhoneCodeHash, timeout } = await req.tg.invoke(new Api.auth.ResendCode({
      phoneNumber, phoneCodeHash }))
    const session = req.tg.session.save()
    const accessToken = sign({ session }, API_JWT_SECRET, { expiresIn: '3h' })
    return res.cookie('authorization', `Bearer ${accessToken}`)
      .send({ phoneCodeHash: newPhoneCodeHash, timeout, accessToken })
  }

  @Endpoint.POST({ middlewares: [TGSessionAuth] })
  public async login(req: Request, res: Response): Promise<any> {
    const { phoneNumber, phoneCode, phoneCodeHash, password, invitationCode } = req.body
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

    let user = await prisma.users.findFirst({ where: { tg_id: userAuth.id.toString() } })
    const config = await prisma.config.findFirst()
    const username = userAuth.username || userAuth.phone || phoneNumber
    if (!user) {
      if (config?.disable_signup) {
        throw { status: 403, body: { error: 'Signup is disabled' } }
      }

      if (config?.invitation_code && config?.invitation_code !== invitationCode) {
        throw { status: 403, body: { error: 'Invalid invitation code' } }
      }

      user = await prisma.users.create({
        data: {
          username,
          plan: 'premium',
          name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
          tg_id: userAuth.id.toString()
        }
      })
    }
    await prisma.users.update({
      data: {
        username,
        plan: 'premium'
      },
      where: { id: user.id }
    })

    const session = req.tg.session.save()
    const auth = {
      session,
      accessToken: sign({ session }, API_JWT_SECRET, { expiresIn: '15h' }),
      refreshToken: sign({ session }, API_JWT_SECRET, { expiresIn: '1y' }),
      expiredAfter: Date.now() + COOKIE_AGE
    }

    res
      .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
      .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
      .send({ user, ...auth })

    // sync all shared files in background, if any
    prisma.files.findMany({
      where: {
        AND: [
          { user_id: user.id },
          {
            NOT: { signed_key: null }
          }
        ]
      }
    }).then(files => files?.map(file => {
      const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), FILES_JWT_SECRET).toString()
      prisma.files.update({
        data: { signed_key: signedKey },
        where: { id: file.id }
      })
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
      data = verify(refreshToken, API_JWT_SECRET) as { session: string }
    } catch (error) {
      throw { status: 400, body: { error: 'Refresh token is invalid' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, {
        connectionRetries: CONNECTION_RETRIES,
        useWSS: false,
        ...process.env.ENV === 'production' ? { baseLogger: new Logger(LogLevel.NONE) } : {}
      })
    } catch (error) {
      throw { status: 400, body: { error: 'Invalid key' } }
    }

    try {
      await req.tg.connect()
      const userAuth = await req.tg.getMe()
      const user = await prisma.users.findFirst({ where: { tg_id: userAuth['id'].toString() } })
      if (!user) {
        throw { status: 404, body: { error: 'User not found' } }
      }
      await prisma.users.update({
        data: {
          username: req.userAuth?.username || req.userAuth?.phone || user.username,
          plan: 'premium'
        },
        where: { id: user.id }
      })

      const session = req.tg.session.save()
      const auth = {
        session,
        accessToken: sign({ session }, API_JWT_SECRET, { expiresIn: '15h' }),
        refreshToken: sign({ session }, API_JWT_SECRET, { expiresIn: '100y' }),
        expiredAfter: Date.now() + COOKIE_AGE
      }
      return res
        .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
        .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
        .send({ user, ...auth })
    } catch (error) {
      throw { status: 400, body: { error: error.message || 'Something error', details: serializeError(error) } }
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
      session,
      accessToken: sign({ session }, API_JWT_SECRET, { expiresIn: '15h' }),
      refreshToken: sign({ session }, API_JWT_SECRET, { expiresIn: '100y' }),
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
    const { password, session: sessionString, invitationCode } = req.body

    // handle the 2fa password in the second call
    if (password && sessionString) {
      req.tg = new TelegramClient(new StringSession(sessionString), TG_CREDS.apiId, TG_CREDS.apiHash, {
        connectionRetries: CONNECTION_RETRIES,
        useWSS: false,
        ...process.env.ENV === 'production' ? { baseLogger: new Logger(LogLevel.NONE) } : {}
      })
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

      let user = await prisma.users.findFirst({ where: { tg_id: userAuth.id.toString() } })
      const config = await prisma.config.findFirst()
      if (!user) {
        if (config?.disable_signup) {
          throw { status: 403, body: { error: 'Signup is disabled' } }
        }

        if (config?.invitation_code && config?.invitation_code !== invitationCode) {
          throw { status: 403, body: { error: 'Invalid invitation code' } }
        }

        const username = userAuth.username || userAuth.phone
        user = await prisma.users.create({
          data: {
            username,
            plan: 'premium',
            name: `${userAuth.firstName || ''} ${userAuth.lastName || ''}`.trim() || username,
            tg_id: userAuth.id.toString()
          }
        })
      }

      await prisma.users.update({
        data: {
          username: userAuth.username || userAuth.phone,
          plan: 'premium'
        },
        where: { id: user.id }
      })


      const session = req.tg.session.save()
      const auth = {
        session,
        accessToken: sign({ session }, API_JWT_SECRET, { expiresIn: '15h' }),
        refreshToken: sign({ session }, API_JWT_SECRET, { expiresIn: '1y' }),
        expiredAfter: Date.now() + COOKIE_AGE
      }

      res
        .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
        .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
        .send({ user, ...auth })

      // sync all shared files in background, if any
      prisma.files.findMany({
        where: {
          AND: [
            { user_id: user.id },
            {
              NOT: { signed_key: null }
            }
          ]
        }
      }).then(files => files?.map(file => {
        const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), FILES_JWT_SECRET).toString()
        prisma.files.update({
          data: { signed_key: signedKey },
          where: { id: file.id }
        })
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
          session,
          accessToken: sign({ session }, API_JWT_SECRET, { expiresIn: '15h' }),
          refreshToken: sign({ session }, API_JWT_SECRET, { expiresIn: '1y' }),
          expiredAfter: Date.now() + COOKIE_AGE
        }
        res
          .cookie('authorization', `Bearer ${auth.accessToken}`, { maxAge: COOKIE_AGE, expires: new Date(auth.expiredAfter) })
          .cookie('refreshToken', auth.refreshToken, { maxAge: 3.154e+10, expires: new Date(Date.now() + 3.154e+10) })
          .send({ ...data, ...auth })

        if (data.user?.id) {
          // sync all shared files in background, if any
          prisma.files.findMany({
            where: {
              AND: [
                { user_id: data.user.id },
                {
                  NOT: { signed_key: null }
                }
              ]
            }
          }).then(files => files?.map(file => {
            const signedKey = AES.encrypt(JSON.stringify({ file: { id: file.id }, session: req.tg.session.save() }), FILES_JWT_SECRET).toString()
            prisma.files.update({
              data: { signed_key: signedKey },
              where: { id: file.id }
            })
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
          let user = await prisma.users.findFirst({ where: { tg_id: userAuth.id.toString() } })
          const config = await prisma.config.findFirst()
          if (!user) {
            if (config?.disable_signup) {
              throw { status: 403, body: { error: 'Signup is disabled' } }
            }

            if (config?.invitation_code && config?.invitation_code !== invitationCode) {
              throw { status: 403, body: { error: 'Invalid invitation code' } }
            }

            const username = userAuth['username'] || userAuth['phone']
            user = await prisma.users.create({
              data: {
                username,
                plan: 'premium',
                name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
                tg_id: userAuth.id.toString()
              }
            })
          }
          await prisma.users.update({
            data: {
              username: userAuth['username'] || userAuth['phone'],
              plan: 'premium'
            },
            where: { id: user.id }
          })
          return buildResponse({ user })
        }
        return buildResponse({ data, result })

        // handle if success
      } else if (data instanceof Api.auth.LoginTokenSuccess && data.authorization instanceof Api.auth.Authorization) {
        const userAuth = data.authorization.user
        let user = await prisma.users.findFirst({ where: { tg_id: userAuth.id.toString() } })
        const config = await prisma.config.findFirst()
        if (!user) {
          if (config?.disable_signup) {
            throw { status: 403, body: { error: 'Signup is disabled' } }
          }

          if (config?.invitation_code && config?.invitation_code !== invitationCode) {
            throw { status: 403, body: { error: 'Invalid invitation code' } }
          }

          const username = userAuth['username'] || userAuth['phone']
          user = await prisma.users.create({
            data: {
              username,
              plan: 'premium',
              name: `${userAuth['firstName'] || ''} ${userAuth['lastName'] || ''}`.trim() || username,
              tg_id: userAuth.id.toString()
            }
          })
        }
        await prisma.users.update({
          data: {
            username: userAuth['username'] || userAuth['phone'],
            plan: 'premium'
          },
          where: { id: user.id }
        })
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
    const success = req.query.destroySession === '1' ? await req.tg.invoke(new Api.auth.LogOut()) : true
    await Redis.connect().del(`auth:${req.authKey}`)
    return res.clearCookie('authorization').clearCookie('refreshToken').send({ success })
  }
}