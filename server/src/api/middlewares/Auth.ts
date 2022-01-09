import { TelegramClient } from '@mgilangjanuar/telegram'
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
    req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: CONNECTION_RETRIES, useWSS: false })
  } catch (error) {
    throw { status: 401, body: { error: 'Invalid key' } }
  }

  let userAuth: any
  try {
    await req.tg.connect()
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

  const user = await Redis.connect().getFromCacheFirst(`user:${userAuth.id}`, async () => await Users.findOne({ tg_id: userAuth['id'].toString() }), 600)
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
    let userAuth: any
    try {
      await req.tg.connect()
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

    const user = await Redis.connect().getFromCacheFirst(`user:${userAuth.id}`, async () => await Users.findOne({ tg_id: userAuth['id'].toString() }), 600)
    if (!user) {
      throw { status: 401, body: { error: 'User not found' } }
    }
    req.user = user
    req.userAuth = userAuth
  }

  return next()
}