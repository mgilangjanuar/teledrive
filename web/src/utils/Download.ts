import { Readable } from 'stream'
import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { telegramClient } from './Telegram'

class ConnectionPool {
  private connections: Promise<any>[]

  constructor() {
    this.connections = []
  }

  async getConnection(): Promise<any> {
    if (this.connections.length > 0) {
      return this.connections.shift()
    }
    const connection = telegramClient.connect()
    this.connections.push(connection)
    return connection
  }

  releaseConnection(connection: Promise<any>): void {
    this.connections.push(connection)
  }
}

const connectionPool = new ConnectionPool()

class TelegramReadableStream extends Readable {
  private client: any
  private media: any
  private fileIterator: any

  constructor(id: string) {
    super({ objectMode: true })
    this.client = null
    this.media = null
    this.fileIterator = null

    this._init(id)
  }

  async _init(id: string) {
    try {
      this.client = await connectionPool.getConnection()

      const { data: response } = await this.client.invoke(
        new Api.messages.GetMessages({
          id: [new Api.InputMessageID({ id: Number(id) })]
        })
      )

      this.media = response.messages[0].media

      this.fileIterator = {
        [Symbol.asyncIterator]: async function* (this: TelegramReadableStream) {
          const chunks = await this.client.downloadMedia(this.media)
          for (const chunk of chunks) {
            yield chunk
          }
        }.bind(this)
      }
    } catch (error) {
      this.emit('error', error)
    }
  }

  async _read() {
    try {
      if (!this.fileIterator) {
        // Wait for initialization to complete
        return setTimeout(() => this._read(), 0)
      }

      for await (const chunk of this.fileIterator) {
        if (!this.push(chunk)) {
          // Stop pushing data if the consumer is no longer interested
          break
        }
      }

      // Close the stream once all data has been pushed
      this.push(null)
      this.client && connectionPool.releaseConnection(this.client)
    } catch (error) {
      this.emit('error', error)
    }
  }
}

interface ReadableStreamWithGetReader extends Readable {
  getReader(): ReadableStreamDefaultReader
}

export const download = async (
  id: string
): Promise<ReadableStreamWithGetReader> => {
  return new TelegramReadableStream(id) as ReadableStreamWithGetReader
}

export const directDownload = async (
  id: string,
  name: string
): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()

  const pump = async () => {
    const { done, value } = await reader.read()
    if (done) {
      writer.close()
      return
    }
    writer.write(value)
    pump()
  }

  pump()

  return new Promise((resolve, reject) => {
    writer.on('close', resolve)
    writer.on('error', reject)
  })
}
