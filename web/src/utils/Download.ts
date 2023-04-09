import streamSaver from 'streamsaver'
import { Api } from 'telegram-mtproto'
import { telegramClient } from './Telegram'
import got from 'got'


interface PooledConnection {
  connection: Api,
  lastUsed: number
}

class ConnectionPool {
  private connections: PooledConnection[]
  private maxConnections: number
  private idleTimeout: number

  constructor(maxConnections = 5, idleTimeout = 30000) {
    this.connections = []
    this.maxConnections = maxConnections
    this.idleTimeout = idleTimeout
  }

  async getConnection(): Promise<Api> {
    const now = Date.now()
    const availableConnectionIndex = this.connections.findIndex(
      (conn) => now - conn.lastUsed < this.idleTimeout
    )
    if (availableConnectionIndex !== -1) {
      const { connection } = this.connections.splice(
        availableConnectionIndex,
        1
      )[0]
      return connection
    }
    if (this.connections.length >= this.maxConnections) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.getConnection()), 100)
      })
    }
    const connection = await telegramClient.connect()
    this.connections.push({ connection, lastUsed: now })
    return connection
  }

  releaseConnection(connection: Api): void {
    const now = Date.now()
    const pooledConnection = { connection, lastUsed: now }
    this.connections.push(pooledConnection)
  }
}

const connectionPool = new ConnectionPool()

export async function download(id: string): Promise<ReadableStream> {
  const client = await connectionPool.getConnection()

  try {
    const { messages } = await client.invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(id) })]
      })
    )
    const media = messages[0].media

    const fileIterator = {
      [Symbol.asyncIterator]: async function* () {
        const chunks = await client.downloadMedia(media)
        for (const chunk of chunks) {
          yield chunk
        }
      }
    }

    return new ReadableStream({
      start(controller) {
        (async () => {
          for await (const chunk of fileIterator) {
            controller.enqueue(chunk)
          }
          controller.close()
        })()
      }
    })
  } finally {
    connectionPool.releaseConnection(client)
  }
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
    await pump()
  }

  await pump()
}

export const directDownloadWithGot = async (
  id: string,
  name: string
): Promise<void> => {
  const client = await connectionPool.getConnection()

  try {
    const { messages } = await client.invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(id) })]
      })
    )
    const media = messages[0].media
    const gotStream = got.stream.post(
      `https://api.telegram.org/file/bot${telegramClient.token}/${media.file_reference}`,
      {
        headers: {
          Range: 'bytes=0-'
        },
        responseType: 'buffer'
      }
    )

    await new Promise((resolve, reject) => {
      pipeline(gotStream, streamSaver.createWriteStream(name), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  } finally {
    connectionPool.releaseConnection(client)
  }
}