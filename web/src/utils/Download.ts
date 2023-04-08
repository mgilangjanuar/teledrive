import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { req } from './Fetcher'
import { telegramClient } from './Telegram'

export async function download(id: string): Promise<ReadableStream> {
  const { data: response } = await req.get(`/files/${id}`, {
    params: { raw: 1, as_array: 1 }
  })
  let cancel = false
  const client = await telegramClient.connect()

  const fileIterator = {
    [Symbol.asyncIterator]: async function* () {
      for (const file of response.files) {
        let chat: any
        if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
          const [type, peerId, id, accessHash] = file.forward_info.split('/')
          let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
          if (type === 'channel') {
            peer = new Api.InputPeerChannel({
              channelId: BigInt(peerId) as any,
              accessHash: BigInt(accessHash as string) as any
            })
            chat = await client.invoke(
              new Api.channels.GetMessages({
                channel: peer,
                id: [new Api.InputMessageID({ id: Number(id) })]
              })
            )
          }
        } else {
          chat = await client.invoke(
            new Api.messages.GetMessages({
              id: [new Api.InputMessageID({ id: Number(file.message_id) })]
            })
          )
        }
        yield { chat, media: chat['messages'][0].media }
      }
    }
  }

  const readableStream = new ReadableStream({
    start(_controller: ReadableStreamDefaultController) {},
    async pull(controller: ReadableByteStreamController) {
      const getData = async (chat: any, media: any) => {
        const chunks = await client.downloadMedia(media)
        for (const chunk of chunks) {
          if (cancel) return false
          controller.enqueue(chunk)
        }
      }
      const downloadPromises = []
      for await (const { chat, media } of fileIterator) {
        downloadPromises.push(getData(chat, media))
      }
      await Promise.all(downloadPromises)
      controller.close()
    },
    cancel() {
      cancel = true
    }
  })

  return readableStream
}

export const directDownload = async (
  id: string,
  name: string
): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()
  const pump = () =>
    reader.read().then(({ value, done }) => {
      if (done) return writer.close()
      writer.write(value)
      return writer.ready.then(pump)
    })
  await pump()
}
