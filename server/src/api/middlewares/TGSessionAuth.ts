import { TelegramClient } from '@mgilangjanuar/telegram'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import { NextFunction, Request, Response } from 'express'
import { verify } from 'jsonwebtoken'
import { CONNECTION_RETRIES, TG_CREDS } from '../../utils/Constant'

export async function TGSessionAuth(req: Request, _: Response, next: NextFunction): Promise<any> {
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
  return next()
}