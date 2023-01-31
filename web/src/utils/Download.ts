import streamSaver from 'streamsaver'
import { Api } from 'teledrive-client'
import { req } from './Fetcher'
import { telegramClient } from './Telegram'

const downloadFiles = async (controller: ReadableStreamDefaultController, client: any, response: any) => {
  for (const file of response.files) {
    const { forwardInfo, messageId } = file
    let chat: any
    if (forwardInfo && forwardInfo.match(/^channel\//gi)) {
      const [, peerId, id, accessHash] = forwardInfo.split('/')
      let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
      if (forwardInfo.startsWith('channel')) {
        peer = new Api.InputPeerChannel({
          channelId: BigInt(peerId) as any,
          accessHash: BigInt(accessHash as string) as any
        })
        chat = await client.invoke(new Api.channels.GetMessages({
          channel: peer,
          id: [new Api.InputMessageID({ id: Number(id) })]
        }))
      }
    } else {
      chat = await client.invoke(new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(message_id) })]
      }))
    }
    const media = chat['messages'][0].media
    await client.downloadMedia(media, {
      outputFile: {
        write: (chunk: Buffer) => {
          if (controller.cancel) return false
          controller.enqueue(chunk)
        },
        close: () => controller.close()
      },
      progressCallback: (received, total) => {
        console.log('progress:', received, '/', total)
      }
    })
  }
}

export const download = async (id: string): Promise<ReadableStream> => {
  const { data: response } = await req.get(`/files/${id}`, { params: { raw: 1, as_array: 1 } })
  const client = await telegramClient.connect()
  return new ReadableStream({
    start: async (controller: ReadableStreamDefaultController) => {
      console.log('start downloading:', response.files)
      await downloadFiles(controller, client, response)
    }
  }, {
    size: (chunk: any) => chunk.length
  })
}

export const directDownload = async (id: string, name: string): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()
  const pump = async () => {
    const { value, done } = await reader.read()
    if (done) return writer.close()
    writer.write(value)
    return writer.ready.then(pump)
  }
  await pump()
}