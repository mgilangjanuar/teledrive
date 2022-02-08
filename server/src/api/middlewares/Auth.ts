import { Logger, TelegramClient } from '@mgilangjanuar/telegram'
import { LogLevel } from '@mgilangjanuar/telegram/extensions/Logger'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import { NextFunction, Request, Response } from 'express'
import { verify } from 'jsonwebtoken'
import { Users } from '../../model/entities/Users'
import { Redis } from '../../service/Cache'
import { CONNECTION_RETRIES, TG_CREDS } from '../../utils/Constant'

export async function Auth(req: Request, _: Response, next: NextFunction): Promise<any> {
  const authkey = (req.headers.authorization || req.cookies.authorization)?.replace(/^Bearer\ /gi, '')
  if (!authkey) {
    throw { status: 401, body: { error: 'Auth key is required' } }
  }

  let data: { session: string }
  try {
    data = verify(authkey, process.env.API_JWT_SECRET) as { session: string }
  } catch (error) {
    throw { status: 401, body: { error: 'Access token is invalid' } }
  }

  try {
    const session = new StringSession(data.session)
    req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, {
      connectionRetries: CONNECTION_RETRIES,
      useWSS: false,
      baseLogger: new Logger(LogLevel.NONE)
    })
  } catch (error) {
    throw { status: 401, body: { error: 'Invalid key' } }
  }
  await req.tg.connect()
  req.authKey = authkey

  const [userAuth, user] = await Redis.connect().getFromCacheFirst(`auth:${authkey}`, async () => {
    let userAuth: any
    try {
      userAuth = await req.tg.getMe()
    } catch (error) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await req.tg.connect()
        userAuth = await req.tg.getMe()
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await req.tg.connect()
        userAuth = await req.tg.getMe()
      }
    }

    const user = await Users.findOne({ tg_id: userAuth['id'].toString() })
    if (!user) {
      throw { status: 401, body: { error: 'User not found' } }
    }
    return [userAuth, user]
  }, 54000)

  req.user = user
  req.userAuth = userAuth

  return next()
}

export async function AuthMaybe(req: Request, _: Response, next: NextFunction): Promise<any> {
  const authkey = (req.headers.authorization || req.cookies.authorization)?.replace(/^Bearer\ /gi, '')
  if (authkey) {
    let data: { session: string }
    try {
      data = verify(authkey, process.env.API_JWT_SECRET) as { session: string }
    } catch (error) {
      throw { status: 401, body: { error: 'Access token is invalid' } }
    }

    try {
      const session = new StringSession(data.session)
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, {
        connectionRetries: CONNECTION_RETRIES,
        useWSS: false,
        baseLogger: new Logger(LogLevel.NONE)
      })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }
    await req.tg.connect()
    req.authKey = authkey

    const [userAuth, user] = await Redis.connect().getFromCacheFirst(`auth:${authkey}`, async () => {
      let userAuth: any
      try {
        userAuth = await req.tg.getMe()
      } catch (error) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await req.tg.connect()
          userAuth = await req.tg.getMe()
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await req.tg.connect()
          userAuth = await req.tg.getMe()
        }
      }

      const user = await Users.findOne({ tg_id: userAuth['id'].toString() })
      if (!user) {
        throw { status: 401, body: { error: 'User not found' } }
      }
      return [userAuth, user]
    }, 54000)

    req.user = user
    req.userAuth = userAuth
  }

  return next()
}