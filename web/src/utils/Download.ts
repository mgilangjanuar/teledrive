import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { telegramClient } from './Telegram'

class ConnectionPool {
  private connections: Promise<any>[]
  public maxSize: number

  constructor(maxSize: number) {
    this.connections = []
    this.maxSize = maxSize
  }

  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.shift()
    }
    if (this.connections.length < this.maxSize) {
      const connection = telegramClient.connect()
      this.connections.push(connection)
      return connection
    }
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.connections.length < this.maxSize) {
          const connection = telegramClient.connect()
          this.connections.push(connection)
          clearInterval(interval)
          resolve(connection)
        }
      }, 1000)
    })
  }

  releaseConnection(connection: Promise<any>) {
    this.connections.push(connection)
  }
}

// Declare the proper type for file iterators
type FileIterator = {
  [Symbol.asyncIterator]: () => AsyncGenerator<Uint8Array, void, unknown>
}
const fileIterators: FileIterator[] = []
async function* generateChunks(
  client: any,
  media: any,
  i: number,
  numParallel: number
): AsyncGenerator<Uint8Array, void, unknown> {
  // <-- change the return type here to Uint8Array
  const chunks = await client.downloadMedia(media, {
    offset: (i * media.size) / numParallel,
    limit: media.size / numParallel
  })
  for (const chunk of chunks) {
    yield chunk
  }
}

const connectionPool = new ConnectionPool(5) // set maximum pool size to 5

const cache = new Map<string, Uint8Array>() // create a cache for downloaded data

export async function download(
  id: string,
  numParallel: number = 1
): Promise<ReadableStream> {
  const cachedData = cache.get(id)
  if (cachedData) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(cachedData)
        controller.close()
      }
    })
  }

  const client = await connectionPool.getConnection()

  try {
    const { data: response } = await client.invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(id) })]
      })
    )
    const media = response.messages[0].media

    // Update the for loop that pushes the generator to the fileIterators array
    for (let i = 0; i < numParallel; i++) {
      fileIterators.push({
        [Symbol.asyncIterator]: generateChunks.bind(
          null,
          client,
          media,
          i,
          numParallel
        )
      })
    }
    const stream = new ReadableStream({
      start(controller) {
        const readers = []
        for (const fileIterator of fileIterators) {
          readers.push(fileIterator[Symbol.asyncIterator]().getReader())
        }

        const pump = async () => {
          const promises = []
          for (let i = 0; i < readers.length; i++) {
            const reader = readers[i]
            const promise = reader.read()
            promises.push(promise)
            promise.then(({ done, value }) => {
              if (done) {
                readers[i] = null
              } else {
                controller.enqueue(value)
              }
            })
          }
          await Promise.all(promises)
          if (readers.every((reader) => reader === null)) {
            cache.set(id, controller.byobRequest.buffer)
            controller.close()
          } else {
            await pump()
          }
        }

        pump()
      }
    })

    return stream
  } finally {
    connectionPool.releaseConnection(client)
  }
}

export const directDownload = async (
  id: string,
  name: string,
  numParallel: number = 1
): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()

  try {
    const readers = []
    for (let i = 0; i < numParallel; i++) {
      readers.push((await download(id, numParallel)).getReader())
    }

    const pump = async () => {
      const promises = []
      for (let i = 0; i < readers.length; i++) {
        const reader = readers[i]
        const promise = reader.read()
        promises.push(promise)
        promise.then(({ done, value }) => {
          if (done) {
            readers[i] = null
          } else {
            writer.write(value)
          }
        })
      }
      await Promise.all(promises)
      if (readers.every((reader) => reader === null)) {
        writer.close()
      } else {
        await pump()
      }
    }

    await pump()
  } catch (error) {
    console.error(error)
  }
}
