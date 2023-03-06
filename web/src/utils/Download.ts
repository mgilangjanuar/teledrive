import streamSaver from 'streamsaver'
import { Api } from 'telegram'
import { req } from './Fetcher'
import { telegramClient } from './Telegram'

export async function download(id: string): Promise<ReadableStream> {
  const { data: response } = await req.get(`/files/${id}`, { params: { raw: 1, as_array: 1 } })
  let cancel = false
  const client = await telegramClient.connect()

  const readableStream = new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      console.log('start downloading:', response.files)
      response.files.forEach(async (file) => {
        let chat: any
        if (file.forward_info && file.forward_info.match(/^channel\//gi)) {
          const [type, peerId, id, accessHash] = file.forward_info.split('/')
          let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
          if (type === 'channel') {
            peer = new Api.InputPeerChannel({
              channelId: BigInt(peerId),
              accessHash: BigInt(accessHash as string),
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

        const getData = async () =>
          await client.downloadMedia(chat['messages'][0].media, {
            outputFile: {
              write: (chunk: Buffer) => {
                if (cancel) return false
                return controller.enqueue(chunk)
              },
              close: () => {
                if (countFiles++ >= Number(response.files.length)) controller.close()
              },
            },
            progressCallback: (received, total) => {
              console.log('progress: ', ((Number(received) / Number(total)) * 100).toFixed(2), '%')
            },
          })
        try {
          await getData()
        } catch (error) {
          console.log(error)
        }
      })
    },
    cancel() {
      cancel = true
    },
  })

  return readableStream
}

export const directDownload = async (id: string, name: string): Promise<void> => {
  const fileStream = streamSaver.createWriteStream(name)
  const writer = fileStream.getWriter()
  const reader = (await download(id)).getReader()

  const pump = async () => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      writer.write(value)
    }

    writer.close()
  }

  await pump()
}
