import { CloudUploadOutlined } from '@ant-design/icons'
import { notification, Typography, Upload as BaseUpload } from 'antd'
import mime from 'mime-types'
import React, { useEffect, useRef } from 'react'
import { Api } from 'telegram'
import { CHUNK_SIZE, MAX_UPLOAD_SIZE, RETRY_COUNT } from '../../../utils/Constant'
import { req } from '../../../utils/Fetcher'
import { telegramClient } from '../../../utils/Telegram'

interface Props {
  dataFileList: [any[], (data: any[]) => void],
  parent?: Record<string, any> | null,
  isDirectory?: boolean,
  me?: any,
  onCancel: (file: any) => void
}

const Upload: React.FC<Props> = ({ dataFileList: [fileList, setFileList], parent, isDirectory, me, onCancel }) => {
  const cancelUploading = useRef<string | null>(null)
  const parentPath = useRef<Record<string, string> | null>(null)
  const filesWantToUpload = useRef<any[]>([])

  useEffect(() => {
    if (!fileList?.length) {
      parentPath.current = null
      filesWantToUpload.current = []
    }
  }, [fileList])

  const retry = async (fn: () => Promise<any>, cb?: () => any | Promise<any>) => {
    let retry = 0
    while (retry < RETRY_COUNT) {
      try {
        await fn()
        retry = RETRY_COUNT
      } catch (error: any) {
        await new Promise(res => setTimeout(res, 3000 * ++retry))
        await cb?.()
        if (retry === RETRY_COUNT) {
          notification.error({ message: 'Failed to upload file', description: <>
            <Typography.Paragraph>
              {error?.response?.data?.error || error.message || 'Something error'}
            </Typography.Paragraph>
            <Typography.Paragraph code>
              {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
            </Typography.Paragraph>
          </> })
          throw error
        }
      }
    }
  }

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    filesWantToUpload.current = [...filesWantToUpload.current, file]
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    window.onbeforeunload = () => {
      return 'Are you sure you want to leave?'
    }

    // notification.info({ key: 'prepareToUpload', message: 'Preparing...', duration: 3 })
    // await new Promise(res => setTimeout(res, 3000))

    const fileParts = Math.ceil(file.size / MAX_UPLOAD_SIZE)
    let deleted = false

    try {
      const { data: exists } = await req.get('/files', { params: { parent_id: parent?.id, name: file.name } })
      if (/\.part0*\d*$/.test(file.name))
        throw { status: 400, body: { error: 'The file name cannot end with ".part", even if followed by digits!' } }
      if (/\(\d+\).+/.test(file.name))
        throw { status: 400, body: { error: 'The file name cannot contain text after parentheses with digits inside!' } }
      if (exists.length > 0)
        throw { status: 400, body: { error: `A file/folder named "${file.name}" already exists!` } }

      while (filesWantToUpload.current?.findIndex(f => f.uid === file.uid) !== 0) {
        await new Promise(res => setTimeout(res, 1000))
      }
      console.log('Uploading idx:', filesWantToUpload.current?.findIndex(f => f.uid === file.uid))

      const responses: any[] = []
      let totalParts: number = 0
      const totalAllParts = Math.ceil(file.size % MAX_UPLOAD_SIZE / CHUNK_SIZE) + (fileParts - 1) * Math.ceil(MAX_UPLOAD_SIZE / CHUNK_SIZE)

      if (localStorage.getItem('experimental')) {
        let client = await telegramClient.connect()
        for (let j = 0; j < fileParts; j++) {
          const fileBlob = file.slice(j * MAX_UPLOAD_SIZE, Math.min(j * MAX_UPLOAD_SIZE + MAX_UPLOAD_SIZE, file.size))
          const parts = Math.ceil(fileBlob.size / CHUNK_SIZE)

          if (!deleted) {
            const uploadPart = async (i: number) => {
              if (responses?.length && cancelUploading.current && file.uid === cancelUploading.current) {
                await Promise.all(responses.map(async response => {
                  try {
                    await req.delete(`/files/${response?.file.id}`)
                  } catch (error) {
                    // ignore
                  }
                }))
                cancelUploading.current = null
                deleted = true
                window.onbeforeunload = undefined as any
              } else {
                const blobPart = fileBlob.slice(i * CHUNK_SIZE, Math.min(i * CHUNK_SIZE + CHUNK_SIZE, file.size))

                const beginUpload = async () => {
                  const { data: response } = responses[j] ? { data: responses[j] } : await req.post('/files/uploadBeta', {
                    ...parent?.id ? { parent_id: parent.id } : {},
                    relative_path: file.webkitRelativePath || null,
                    name: `${file.name}${fileParts > 1 ? `.part${String(j + 1).padStart(3, '0')}` : ''}`,
                    size: fileBlob.size,
                    mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
                    part: i,
                    total_part: parts,
                  })

                  // upload per part
                  const uploadPart = async () => await client.invoke(new Api.upload.SaveBigFilePart({
                    fileId: response.file.file_id,
                    filePart: Number(i),
                    fileTotalParts: Number(parts),
                    bytes: Buffer.from(await blobPart.arrayBuffer())
                  }))

                  await retry(async () => await uploadPart(), async () => client = await telegramClient.connect())

                  if (Number(i) >= Number(parts) - 1) {
                    // begin to send
                    const sendData = async (forceDocument: boolean) => {
                      let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat | null = null
                      if (me.user.settings?.saved_location) {
                        const [type, peerId, _, accessHash] = me.user.settings?.saved_location.split('/')
                        if (type === 'channel') {
                          peer = new Api.InputPeerChannel({
                            channelId: BigInt(peerId) as any,
                            accessHash: BigInt(accessHash as string) as any })
                        } else if (type === 'user') {
                          peer = new Api.InputPeerUser({
                            userId: BigInt(peerId.toString()) as any,
                            accessHash: BigInt(accessHash.toString()) as any })
                        } else if (type === 'chat') {
                          peer = new Api.InputPeerChat({
                            chatId: BigInt(peerId) as any })
                        }
                      }
                      return await client.sendFile(peer || 'me', {
                        file: new Api.InputFileBig({
                          id: BigInt(response.file.file_id) as any,
                          parts: Number(parts),
                          name: response.file.name
                        }),
                        caption: response.file.name,
                        forceDocument,
                        fileSize: Number(fileBlob.length),
                        attributes: forceDocument ? [
                          new Api.DocumentAttributeFilename({ fileName: response.file.name })
                        ] : undefined,
                        workers: 1
                      })
                    }

                    let data: Api.Message
                    try {
                      data = await sendData(false)
                    } catch (error) {
                      console.error(error)
                      data = await sendData(true)
                    }
                    // console.log(data)

                    await req.post(`/files/uploadBeta/${response.file.id}`, {
                      message: {
                        id: data.id,
                        date: data.date
                      }
                    })
                  }
                  return response
                }

                responses[j] = await beginUpload()

                const percent = (++totalParts / totalAllParts * 100).toFixed(1)
                onProgress({ percent }, file)
              }
            }

            const group = 5
            await retry(async () => await uploadPart(0), async () => client = await telegramClient.connect())
            for (let i = 1; i < parts - 1; i += group) {
              if (deleted) break
              const others = Array.from(Array(i + group).keys()).slice(i, Math.min(parts - 1, i + group))
              await Promise.all(others.map(async j => await retry(async () => await uploadPart(j), async () => client = await telegramClient.connect())))
            }
            if (!deleted && parts - 1 > 0) {
              await retry(async () => await uploadPart(parts - 1), async () => client = await telegramClient.connect())
            }
          }
        }
      } else {
        for (let j = 0; j < fileParts; j++) {
          const fileBlob = file.slice(j * MAX_UPLOAD_SIZE, Math.min(j * MAX_UPLOAD_SIZE + MAX_UPLOAD_SIZE, file.size))
          const parts = Math.ceil(fileBlob.size / CHUNK_SIZE)

          if (!deleted) {
            const uploadPart = async (i: number) => {
              if (responses?.length && cancelUploading.current && file.uid === cancelUploading.current) {
                await Promise.all(responses.map(async response => {
                  try {
                    await req.delete(`/files/${response?.file.id}`)
                  } catch (error) {
                    // ignore
                  }
                }))
                cancelUploading.current = null
                deleted = true
                window.onbeforeunload = undefined as any
              } else {
                const blobPart = fileBlob.slice(i * CHUNK_SIZE, Math.min(i * CHUNK_SIZE + CHUNK_SIZE, file.size))
                const data = new FormData()
                data.append('upload', blobPart)

                const beginUpload = async () => {
                  const { data: response } = await req.post(`/files/upload${i > 0 && responses[j]?.file?.id ? `/${responses[j]?.file.id}` : ''}`, data, {
                    params: {
                      ...parent?.id ? { parent_id: parent.id } : {},
                      relative_path: file.webkitRelativePath || null,
                      name: `${file.name}${fileParts > 1 ? `.part${String(j + 1).padStart(3, '0')}` : ''}`,
                      size: fileBlob.size,
                      mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
                      part: i,
                      total_part: parts,
                    },
                  })
                  return response
                }

                let trial = 0
                while (trial < RETRY_COUNT) {
                  try {
                    responses[j] = await beginUpload()
                    trial = RETRY_COUNT
                  } catch (error) {
                    if (trial >= RETRY_COUNT) {
                      throw error
                    }
                    await new Promise(res => setTimeout(res, ++trial * 3000))
                  }
                }

                const percent = (++totalParts / totalAllParts * 100).toFixed(1)
                onProgress({ percent }, file)
              }
            }

            const group = 2
            await uploadPart(0)
            for (let i = 1; i < parts - 1; i += group) {
              if (deleted) break
              const others = Array.from(Array(i + group).keys()).slice(i, Math.min(parts - 1, i + group))
              await Promise.all(others.map(async j => await uploadPart(j)))
            }
            if (!deleted && parts - 1 > 0) {
              await uploadPart(parts - 1)
            }
          }
        }
      }

      // notification.close(`upload-${file.uid}`)
      if (!deleted) {
        window.onbeforeunload = undefined as any
        notification.success({
          key: 'fileUploaded',
          message: 'Success',
          description: `File ${file.name} uploaded successfully`
        })
      }
      // filesWantToUpload.current = filesWantToUpload.current?.map(f => f.uid === file.uid ? { ...f, status: 'done' } : f)
      filesWantToUpload.current = filesWantToUpload.current?.map(f => f.uid === file.uid ? null : f).filter(Boolean)
      return onSuccess(responses[0], file)
    } catch (error: any) {
      console.error(error)
      notification.close(`upload-${file.uid}`)
      notification.error({
        key: 'fileUploadError',
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </> } : {}
      })
      // filesWantToUpload.current = filesWantToUpload.current?.map(f => f.uid === file.uid ? { ...f, status: 'done' } : f)
      filesWantToUpload.current = filesWantToUpload.current?.map(f => f.uid === file.uid ? null : f).filter(Boolean)
      return onError(error.response?.data || error.response || { error: error.message }, file)
    }
  }

  const params = {
    multiple: true,
    customRequest: upload,
    beforeUpload: (_file: any) => true,
    fileList: fileList,
    onRemove: (file: any) => {
      if (!file.response?.file) {
        cancelUploading.current = file.uid
        return true
      }
      if (file.response?.file) {
        onCancel(file.response?.file)
      }
      return false
    },
    onChange: ({ fileList }) => setFileList(fileList),
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
      format: (percent: any) => `${percent}%`
    }
  }

  return isDirectory ? <BaseUpload name="upload" directory {...params}>
    Upload
  </BaseUpload> : <BaseUpload.Dragger name="upload" {...params}>
    <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
    <p className="ant-upload-text">Click or drag file to this area to upload</p>
    <p className="ant-upload-hint">
      Maximum file size is unlimited
    </p>
  </BaseUpload.Dragger>
}

export default Upload
