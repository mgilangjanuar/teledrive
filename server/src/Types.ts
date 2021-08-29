import { TelegramClient } from 'telegram'

declare module 'http' {
  interface IncomingMessage {
    tg: TelegramClient
  }
}