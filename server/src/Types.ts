import { TelegramClient } from 'teledrive-client'
import { Users } from './model/entities/Users'

declare module 'http' {
  interface IncomingMessage {
    tg?: TelegramClient,
    user?: Users,
    userAuth?: any,
    authKey?: string
  }
}