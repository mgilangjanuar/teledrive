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
      let firstResponse: any
      let totalParts: number = 0

      const totalAllParts = Math.ceil(file.size % maxSize / chunkSize) + (fileParts - 1) * Math.ceil(maxSize / chunkSize)

      for (let j = 0; j < fileParts; j++) {
        const fileBlob = file.slice(j * maxSize, Math.min(j * maxSize + maxSize, file.size))
        const parts = Math.ceil(fileBlob.size / chunkSize)

        if (deleted) {
          window.onbeforeunload = undefined as any
          break
        }

        for (let i = 0; i < parts; i++) {
          if (firstResponse?.file && cancelUploading.current && file.uid === cancelUploading.current) {
            await req.delete(`/files/${firstResponse?.file.id}`)
            cancelUploading.current = null
            deleted = true
            window.onbeforeunload = undefined as any
            break
          }
          const blobPart = fileBlob.slice(i * chunkSize, Math.min(i * chunkSize + chunkSize, file.size))
          const data = new FormData()
          data.append('upload', blobPart)

          const { data: response } = await req.post(`/files/upload${i > 0 && firstResponse?.file?.id ? `/${firstResponse?.file.id}` : ''}`, data, {
            params: {
              ...parent?.id ? { parent_id: parent.link_id || parent.id || undefined } : {},
              name: `${file.name}${fileParts > 1 ? `.part${j + 1}` : ''}`,
              size: fileBlob.size,
              mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
              part: i,
              total_part: parts,
            },
          })
          firstResponse = response

          const percent = (++totalParts / totalAllParts * 100).toFixed(1)
          onProgress({ percent }, file)
        }
      }
      // notification.close(`upload-${file.uid}`)
      if (!deleted) {
        window.onbeforeunload = undefined as any
        notification.success({
          message: 'Success',
          description: `File ${file.name} uploaded successfully`
        })
      }
      return onSuccess(firstResponse, file)
    } catch (error: any) {
      console.error(error)
      notification.close(`upload-${file.uid}`)
      notification.error({
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