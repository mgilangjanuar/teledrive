import { Logger, TelegramClient } from '@mgilangjanuar/telegram'
import { LogLevel } from '@mgilangjanuar/telegram/extensions/Logger'
import { StringSession } from '@mgilangjanuar/telegram/sessions'

export const telegramClient = {
  connect: async (session = localStorage.getItem('session')): Promise<TelegramClient> => {
    if (!session) {
      throw { status: 401, message: 'Session not found' }
    }
    const client = new TelegramClient(new StringSession(session), Number(process.env.REACT_APP_TG_API_ID), process.env.REACT_APP_TG_API_HASH as string, {
      connectionRetries: 10,
      useWSS: false,
      baseLogger: new Logger(LogLevel.NONE)
    })
    await client.connect()
    return client
  }
}