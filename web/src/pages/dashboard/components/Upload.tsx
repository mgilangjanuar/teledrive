import { CloudUploadOutlined } from '@ant-design/icons'
import { notification, Upload as BaseUpload } from 'antd'
import mime from 'mime-types'
import React, { useRef } from 'react'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataFileList: [any[], (data: any[]) => void],
  parent?: Record<string, any> | null,
  isDirectory?: boolean,
  me?: any,
  onCancel: (file: any) => void
}

const Upload: React.FC<Props> = ({ dataFileList: [fileList, setFileList], parent, isDirectory, me, onCancel }) => {
  const cancelUploading = useRef<string | null>(null)

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    window.onbeforeunload = () => {
      return 'Are you sure you want to leave?'
    }
    // const maxSize = 1024 * 1024 * 1024 * 2
    const maxSize = 2_000_000_000
    const chunkSize = 512 * 1024

    const fileParts = Math.ceil(file.size / maxSize)
    let deleted = false

    try {
      const responses: any[] = []
      let totalParts: number = 0
      const totalAllParts = Math.ceil(file.size % maxSize / chunkSize) + (fileParts - 1) * Math.ceil(maxSize / chunkSize)

      await Promise.all(Array.from(Array(fileParts).keys()).map(async j => {
        const fileBlob = file.slice(j * maxSize, Math.min(j * maxSize + maxSize, file.size))
        const parts = Math.ceil(fileBlob.size / chunkSize)

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
              const blobPart = fileBlob.slice(i * chunkSize, Math.min(i * chunkSize + chunkSize, file.size))
              const data = new FormData()
              data.append('upload', blobPart)

              let parentId = parent?.id
              if (file.webkitRelativePath) {
                const paths = file.webkitRelativePath.split('/').slice(0, -1) || []
                for (const path of paths) {
                  const { data: findFolder } = await req.get('/files', { params: {
                    type: 'folder',
                    name: path,
                    ...parentId ? { parent_id: parentId } : { 'parent_id.is': 'null' },
                  } })
                  if (!findFolder?.length) {
                    const { data: newFolder } = await req.post('/files/addFolder', {
                      file: {
                        name: path,
                        ...parentId ? { parent_id: parentId } : {},
                      }
                    })
                    parentId = newFolder.file.id
                  } else {
                    parentId = findFolder.files[0].id
                  }
                }
              }

              const { data: response } = await req.post(`/files/upload${i > 0 && responses[j]?.file?.id ? `/${responses[j]?.file.id}` : ''}`, data, {
                params: {
                  // ...parent?.id ? { parent_id: parent.link_id || parent.id || undefined } : {},
                  ...parentId ? { parent_id: parentId } : {},
                  name: `${file.name}${fileParts > 1 ? `.part${String(j + 1).padStart(3, '0')}` : ''}`,
                  size: fileBlob.size,
                  mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
                  part: i,
                  total_part: parts,
                },
              })
              responses[j] = response

              const percent = (++totalParts / totalAllParts * 100).toFixed(1)
              onProgress({ percent }, file)
            }
          }

          const group = 5
          await uploadPart(0)
          for (let i = 1; i < parts - 1; i += group) {
            const others = Array.from(Array(i + group).keys()).slice(i, Math.min(parts - 1, i + group))
            await Promise.all(others.map(async j => await uploadPart(j)))
          }
          if (parts - 1 > 0) {
            await uploadPart(parts - 1)
          }
        }

      }))

      // notification.close(`upload-${file.uid}`)
      if (!deleted) {
        window.onbeforeunload = undefined as any
        notification.success({
          key: 'fileUploaded',
          message: 'Success',
          description: `File ${file.name} uploaded successfully`
        })
      }
      return onSuccess(responses[0], file)
    } catch (error: any) {
      console.error(error)
      notification.close(`upload-${file.uid}`)
      notification.error({
        key: 'fileUploadError',
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: error.response.data.error } : {}
      })
      return onError(error.response?.data || error.response || { error: error.message }, file)
    }
  }

  const params = {
    multiple: true,
    customRequest: upload,
    beforeUpload: (file: any) => {
      if (file.size > 2_000_000_000 && (!me?.user.plan || me?.user.plan === 'free')) {
        notification.error({
          message: 'Error',
          description: 'Maximum file size is 2 GB. Upgrade your plan to upload larger files.'
        })
        return false
      }
      return true
    },
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