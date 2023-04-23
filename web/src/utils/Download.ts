import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { telegramClient } from './Telegram'
import { concat } from 'concat-stream'
import FastPriorityQueue from 'fastpriorityqueue'
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
  clients: any[],
  media: any,
  i: number,
  numParallel: number,
  bufferSize: number = 1024 * 1024 // set buffer size to 1 MB
): AsyncGenerator<Uint8Array, void, unknown> {
  const numConnections = clients.length
  let connIndex = i % numConnections
  let offset = Math.floor(i / numConnections) * media.size / numParallel
  const limit = media.size / numParallel
  const promises: Promise<Uint8Array[]>[] = []
  let buffer: Uint8Array[] = []
  let bufferLength = 0
  for (let j = 0; j < numParallel; j++) {
    const client = clients[connIndex]
    promises.push(
      client.downloadMedia(media, { offset, limit })
    )
    offset += limit
    connIndex = (connIndex + 1) % numConnections
  }
  const chunksArray = await Promise.allSettled(promises)
  for (const result of chunksArray) {
    if (result.status === 'fulfilled') {
      const chunks = result.value
      for (const chunk of chunks) {
        buffer.push(chunk)
        bufferLength += chunk.byteLength
        if (bufferLength >= bufferSize) {
          const concatenated = concat(buffer)
          yield concatenated
          buffer = []
          bufferLength = 0
        }
      }
    } else {
      console.error(result.reason)
    }
  }
  if (bufferLength > 0) {
    const concatenated = concat(buffer)
    yield concatenated
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
  const clients: any[] = []
  for (let i = 0; i < numParallel; i++) {
    clients.push(await connectionPool.getConnection())
  }
  try {
    const { data: response } = await clients[0].invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(id) })]
      })
    )
    const media = response.messages[0].media
    for (let i = 0; i < numParallel; i++) {
      fileIterators.push({
        [Symbol.asyncIterator]: generateChunks.bind(
          null,
          clients,
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
    return mergeStreams(...streams)
  } finally {
    for (const client of clients) {
      connectionPool.releaseConnection(client)
    }
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

function mergeStreams(...streams: ReadableStream<Uint8Array>[]): ReadableStream<Uint8Array> {
  if (streams.length === 1) {
    return streams[0]
  }
  const mid = Math.floor(streams.length / 2)
  const left = mergeStreams(...streams.slice(0, mid))
  const right = mergeStreams(...streams.slice(mid))
  // Use FastPriorityQueue instead of an array and custom heapify/siftDown functions
  const heap = new FastPriorityQueue((a: any, b: any) => a[0] > b[0])
  // Initialize heap with the first chunk from each stream
  const leftReader = left.getReader()
  const rightReader = right.getReader()
  const read = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const { done, value } = await reader.read()
    if (!done && value !== undefined) {
      heap.add([value.byteLength, reader])
    }
  }
  read(leftReader)
  read(rightReader)
  const combinedStream = new ReadableStream({
    async start(controller) {
      while (!heap.isEmpty()) {
        const [_, reader] = heap.poll()
        const { done, value } = await reader.read()
        if (done) {
          if (!heap.isEmpty()) {
            const next = heap.poll()
            heap.add(next)
          }
        } else {
          if (value !== undefined) {
            controller.enqueue(value)
            heap.add([value.byteLength, reader])
          }
        }
      }
      controller.close()
    }
  })
  return combinedStream
}