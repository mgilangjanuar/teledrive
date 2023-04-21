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
  const chunksArray = await Promise.all(promises)
  for (const chunks of chunksArray) {
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

export function mergeStreams(...streams: ReadableStream<Uint8Array>[]): ReadableStream<Uint8Array> {
  if (streams.length === 1) {
    return streams[0]
  }

  const mid = Math.floor(streams.length / 2)
  const left = mergeStreams(...streams.slice(0, mid))
  const right = mergeStreams(...streams.slice(mid))

  const heap: [number, ReadableStreamDefaultReader<Uint8Array>][] = []

  function heapify<T>(arr: [number, T][]): void {
    for (let i = Math.floor(arr.length / 2); i >= 0; i--) {
      siftDown(arr, i)
    }
  }

  function siftDown<T>(arr: [number, T][], idx: number): void {
    const left = 2 * idx + 1
    const right = 2 * idx + 2
    let maxIdx = idx
    if (left < arr.length && arr[left][0] > arr[maxIdx][0]) {
      maxIdx = left
    }
    if (right < arr.length && arr[right][0] > arr[maxIdx][0]) {
      maxIdx = right
    }
    if (maxIdx !== idx) {
      [arr[idx], arr[maxIdx]] = [arr[maxIdx], arr[idx]]
      siftDown(arr, maxIdx)
    }
  }

  // Initialize heap with first chunk from each stream 
  const leftReader = left.getReader()
  const rightReader = right.getReader()
  const read = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const { done, value } = await reader.read()
    if (!done && value !== undefined) {
      heap.push([value.byteLength, reader])
      heapify(heap)
    }
  }
  read(leftReader)
  read(rightReader)

  const combinedStream = new ReadableStream({
    async start(controller) {
      while (heap.length > 0) {
        const [_, reader] = heap[0]
        const { done, value } = await reader.read()
        if (done) {
          heap[0] = heap[heap.length - 1]
          heap.pop()
          heapify(heap)
        } else {
          if (value !== undefined) {
            controller.enqueue(value)
            heap[0] = [value.byteLength, reader]
            heapify(heap)
          }
        }
      }
      controller.close()
    }
  })
  return combinedStream
}