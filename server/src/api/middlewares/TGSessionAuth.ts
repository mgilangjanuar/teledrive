import { NextFunction, Request, Response } from 'express'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { TG_CREDS } from '../../utils/Constant'

export async function TGSessionAuth(req: Request, _: Response, next: NextFunction): Promise<any> {
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
  return next()
}