import { TelegramClient } from 'telegram'
import { Users } from './model/entities/Users'

declare module 'http' {
  interface IncomingMessage {
    tg?: TelegramClient,
    user?: Users
  }
}