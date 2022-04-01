import streamSaver from 'streamsaver'
import { Api } from 'teledrive-client'
import { req } from './Fetcher'
import { telegramClient } from './Telegram'

export async function download(id: string): Promise<ReadableStream> {
  const { data: response } = await req.get(`/files/${id}`, { params: { raw: 1, as_array: 1 } })
  let cancel = false

  const client = await telegramClient.connect()
  const readableStream = new ReadableStream({
    start(_controller: ReadableStreamDefaultController) {
    },
    async pull(controller: ReadableStreamDefaultController) {
      console.log('start downloading:', response.files)
      for (const file of response.files) {
        let chat: any
        if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
          const [type, peerId, id, accessHash] = file.forward_info.split('/')
          let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
          if (type === 'channel') {
            peer = new Api.InputPeerChannel({
              channelId: BigInt(peerId) as any,
              accessHash: BigInt(accessHash as string) as any })
            chat = await client.invoke(new Api.channels.GetMessages({
              channel: peer,
              id: [new Api.InputMessageID({ id: Number(id) })]
            }))
          }
        } else {
          chat = await client.invoke(new Api.messages.GetMessages({
            id: [new Api.InputMessageID({ id: Number(file.message_id) })]
          }))
        }

        const getData = async () => await client.downloadMedia(chat['messages'][0].media, {
          outputFile: {
            write: (chunk: Buffer) => {
              if (cancel) return false
              return controller.enqueue(chunk)
            },
            close: () => controller.close()
          },
          progressCallback: (received, total) => {
            console.log('progress:', received, '/', total)
          }
        })
        await getData()
      }
    },
    cancel() {
      cancel = true
    }
  }, {
    size(chunk: any) {
      return chunk.length
    }
  })
  return readableStream
}

export const directDownload = async (id: string, name: string): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()
  const pump = () => reader.read().then(({ value, done }) => {
    if (done) return writer.close()
    writer.write(value)
    return writer.ready.then(pump)
  })
  await pump()

}