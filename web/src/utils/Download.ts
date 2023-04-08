import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { telegramClient } from './Telegram'

class ConnectionPool {
  private connections: Promise<any>[]

  constructor() {
    this.connections = []
  }

  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.shift()
    }
    const connection = telegramClient.connect()
    this.connections.push(connection)
    return connection
  }

  releaseConnection(connection: Promise<any>) {
    this.connections.push(connection)
  }
}

const connectionPool = new ConnectionPool()

export async function download(id: string): Promise<ReadableStream> {
  const client = await connectionPool.getConnection()

  try {
    const { data: response } = await client.invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(id) })]
      })
    )
    const media = response.messages[0].media

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
