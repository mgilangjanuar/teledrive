import { users } from '@prisma/client'
import { TelegramClient } from 'telegram'

declare module 'http' {
  interface IncomingMessage {
    tg?: TelegramClient,
    user?: users,
    userAuth?: any,
    authKey?: string
  }
}