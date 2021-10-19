import { TelegramClient } from '@mgilangjanuar/telegram'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import { NextFunction, Request, Response } from 'express'
import { verify } from 'jsonwebtoken'
import { Users } from '../../model/entities/Users'
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
    req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: CONNECTION_RETRIES, useWSS: false })
  } catch (error) {
    throw { status: 401, body: { error: 'Invalid key' } }
  }

  await req.tg.connect()
  const userAuth = await req.tg.getMe()

  const user = await Users.findOne({ tg_id: userAuth['id'] })
  if (!user) {
    throw { status: 401, body: { error: 'User not found' } }
  }
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
      req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: CONNECTION_RETRIES, useWSS: false })
    } catch (error) {
      throw { status: 401, body: { error: 'Invalid key' } }
    }

    await req.tg.connect()
    const userAuth = await req.tg.getMe()

    const user = await Users.findOne({ tg_id: userAuth['id'] })
    if (!user) {
      throw { status: 401, body: { error: 'User not found' } }
    }
    req.user = user
    req.userAuth = userAuth
  }

  return next()
}