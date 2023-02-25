import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { notification } from 'antd'

export const telegramClient = {
  connect: async (session = localStorage.getItem('session')): Promise<TelegramClient> => {
    if (session === null || session === undefined) {
      notification.info({ message: 'Experimental feature', description: 'Join the experimental features in the Settings page' })
      throw { status: 401, message: 'Session not found' }
    }
    const client = new TelegramClient(new StringSession(session), Number(process.env.REACT_APP_TG_API_ID), process.env.REACT_APP_TG_API_HASH as string, {
      connectionRetries: 10,
      useWSS: true,
      // baseLogger: new Logger(LogLevel.NONE)
    })
    await client.connect()
    return client
  }
}

export const anonymousTelegramClient = {
  connect: async (session = localStorage.getItem('session') || ''): Promise<TelegramClient> => {
    const client = new TelegramClient(new StringSession(session), Number(process.env.REACT_APP_TG_API_ID), process.env.REACT_APP_TG_API_HASH as string, {
      connectionRetries: 10,
      useWSS: true,
      // baseLogger: new Logger(LogLevel.NONE)
    })
    await client.connect()
    return client
  }
}