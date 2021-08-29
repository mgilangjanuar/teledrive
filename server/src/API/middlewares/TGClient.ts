import { NextFunction, Request, Response } from 'express'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { TG_CREDS } from '../../utils/Constant'

export async function TGClient(req: Request, _: Response, next: NextFunction): Promise<any> {
  const session = new StringSession('')
  req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, { requestRetries: 5 })
  return next()
}