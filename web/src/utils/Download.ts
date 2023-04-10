import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { telegramClient } from './Telegram'
import { concat } from 'concat-stream'
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
const connectionPool = new ConnectionPool(5) // set maximum pool size to 5
const cache = new Map<string, Uint8Array>() // create a cache for downloaded data
async function* generateChunks(
  client: any,
  media: any,
  i: number,
  numParallel: number
): AsyncGenerator<Uint8Array, void, unknown> {
  // <-- change the return type here to Uint8Array
  const chunks = await client.downloadMedia(media, {
    offset: i * media.size / numParallel,
    limit: media.size / numParallel
  })
  for (const chunk of chunks) {
    yield chunk
  }
}
export async function download(
  id: string,
  numParallel: number = 1
): Promise<ReadableStream<Uint8Array>> {
  const fileIterators: FileIterator[] = []
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
    const streams: ReadableStream<Uint8Array>[] = []
    for (const fileIterator of fileIterators) {
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of fileIterator) {
            controller.enqueue(chunk)
          }
          controller.close()
        }
      })
      streams.push(stream)
    }
    return mergeStreams(...streams) // merge the streams and return the merged stream
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
    const streams = await download(id, numParallel)
    // Combine the streams using a function like mergeStreams in place of [stream1, stream2, ..., streamN]
    const mergedStream = mergeStreams(streams)
    const reader = mergedStream.getReader()
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) {
        if (value) { // add null check here
          cache.set(id, value)
        }
        writer.close()
        return
      }
      writer.write(value)
      pump()
    }
    pump()
  } catch (error) {
    console.error(error)
  }
}
export function mergeStreams(...streams: ReadableStream<Uint8Array>[]): ReadableStream<Uint8Array> {
  const combinedStream = new ReadableStream({
    async start(controller) {
      let allDone = false
      while (!allDone) {
        allDone = true
        for (const stream of streams) {
          const reader = stream.getReader()
          const { done, value } = await reader.read()
          if (!done) {
            allDone = false
            controller.enqueue(value)
          }
        }
      }
      controller.close()
    }
  })
  return combinedStream
}