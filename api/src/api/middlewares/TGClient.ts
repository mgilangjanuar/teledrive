import { Logger, TelegramClient } from 'telegram'
import { LogLevel } from 'telegram/extensions/Logger'
import { StringSession } from 'telegram/sessions'
import { NextFunction, Request, Response } from 'express'
import { CONNECTION_RETRIES, TG_CREDS } from '../../utils/Constant'

export async function TGClient(req: Request, _: Response, next: NextFunction): Promise<any> {
  const session = new StringSession('')
  req.tg = new TelegramClient(session, TG_CREDS.apiId, TG_CREDS.apiHash, {
    connectionRetries: CONNECTION_RETRIES,
    useWSS: false,
    ...process.env.ENV === 'production' ? { baseLogger: new Logger(LogLevel.NONE) } : {}
  })
  return next()
}