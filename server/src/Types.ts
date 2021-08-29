import { TelegramClient } from 'telegram'
import { Users } from './model/Users'

declare module 'http' {
  interface IncomingMessage {
    tg?: TelegramClient,
    user?: Users
  }
}