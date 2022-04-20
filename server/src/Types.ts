import { users } from '@prisma/client'
import { TelegramClient } from 'teledrive-client'

declare module 'http' {
  interface IncomingMessage {
    tg?: TelegramClient,
    user?: users,
    userAuth?: any,
    authKey?: string
  }
}