import { NextFunction, Request, Response } from 'express'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { Users } from '../../model/entities/Users'
import { TG_CREDS } from '../../utils/Constant'

export async function Auth(req: Request, _: Response, next: NextFunction): Promise<any> {
  const authkey = (req.headers.authorization || req.cookies.authorization)?.replace(/^Bearer\ /gi, '')
  if (!authkey) {
    throw { status: 401, body: { error: 'Auth key is required' } }
  }

  try {
    const session = new StringSession(authkey)
    req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { connectionRetries: 5 })
  } catch (error) {
    throw { status: 401, body: { error: 'Invalid key' } }
  }

  await req.tg.connect()
  const data = await req.tg.getMe()

  const user = await Users.findOne({ tg_id: data['id'], username: data['username'] })
  if (!user) {
    throw { status: 401, body: { error: 'User not found' } }
  }
  req.user = user

  return next()
}