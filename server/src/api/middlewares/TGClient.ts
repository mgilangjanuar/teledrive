import { TelegramClient } from '@mgilangjanuar/telegram'
import { StringSession } from '@mgilangjanuar/telegram/sessions'
import { NextFunction, Request, Response } from 'express'
import { CONNECTION_RETRIES, TG_CREDS } from '../../utils/Constant'

export async function TGClient(
  req: Request,
  _: Response,
  next: NextFunction
): Promise<any> {
  req.tg = new TelegramClient(
    new StringSession(''),
    TG_CREDS.apiId,
    TG_CREDS.apiHash,
    {
      connectionRetries: CONNECTION_RETRIES,
      useWSS: false
    }
  )

  return next()
}
