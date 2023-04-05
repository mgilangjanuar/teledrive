import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { req } from './Fetcher'
import { telegramClient } from './Telegram'
async function downloadFile(client, file) {
  let chat
  if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
    const [type, peerId, id, accessHash] = file.forward_info.split('/')
    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: BigInt(peerId) as any,
        accessHash: BigInt(accessHash as string) as any,
      })
      chat = await client.invoke(
        new Api.channels.GetMessages({
          channel: peer,
          id: [new Api.InputMessageID({ id: Number(id) })],
        })
      )
    }
  } else {
    chat = await client.invoke(
      new Api.messages.GetMessages({
        id: [new Api.InputMessageID({ id: Number(file.message_id) })],
      })
    )
  }
  return client.downloadMedia(chat['messages'][0].media, {
    outputFile: {
      write: (chunk: Buffer) => {
        return true
      },
    },
  })
}
export async function download(id: string): Promise<ReadableStream> {
  const { data: response } = await req.get(`/files/${id}`, {
    params: { raw: 1, as_array: 1 },
  })
  const client = await telegramClient.connect()
  const filesToDownload = response.files
  const readableStream = new ReadableStream({
    async pull(controller) {
      for (const [index, file] of filesToDownload.entries()) {
        try {
          const data = await downloadFile(client, file)
          controller.enqueue(data)
          if (index === filesToDownload.length - 1) {
            controller.close()
          }
        } catch (error) {
          console.error(error)
        }
      }
    },
  })
  return readableStream
}
export const directDownload = async (id: string, name: string): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()
  const pump = async () => {
    const { value, done } = await reader.read()
    if (done) return writer.close()
    await writer.write(value)
    await pump()
  }
  await pump()
}