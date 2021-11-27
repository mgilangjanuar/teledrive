import { CloudUploadOutlined } from '@ant-design/icons'
import { notification, Upload as BaseUpload } from 'antd'
import mime from 'mime-types'
import React, { useRef } from 'react'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataFileList: [any[], (data: any[]) => void],
  parent?: Record<string, any> | null,
  isDirectory?: boolean,
  onCancel: (file: any) => void
}

const Upload: React.FC<Props> = ({ dataFileList: [fileList, setFileList], parent, isDirectory, onCancel }) => {
  const cancelUploading = useRef<string | null>(null)

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    const chunkSize = 512 * 1024
    const parts = Math.ceil(file.size / chunkSize)
    let firstResponse: any
    let deleted = false

    try {
      for (let i = 0; i < parts; i++) {
        if (firstResponse?.file && cancelUploading.current && file.uid === cancelUploading.current) {
          await req.delete(`/files/${firstResponse?.file.id}`)
          cancelUploading.current = null
          deleted = true
          break
        }
        const blobPart = file.slice(i * chunkSize, Math.min(i * chunkSize + chunkSize, file.size))
        const data = new FormData()
        data.append('upload', blobPart)

        const { data: response } = await req.post(`/files/upload${firstResponse?.file?.id ? `/${firstResponse?.file.id}` : ''}`, data, {
          params: {
            ...parent?.id ? { parent_id: parent.link_id || parent.id || undefined } : {},
            name: file.name,
            size: file.size,
            mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
            part: i,
            total_part: parts,
          },
        })

        if (!firstResponse) {
          firstResponse = response
        }

        const percent = ((i + 1) / parts * 100).toFixed(1)
        onProgress({ percent }, file)
      }
      // notification.close(`upload-${file.uid}`)
      if (!deleted) {
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
    beforeUpload: (file) => {
      if (file.size > 2_000_000_000) {
        notification.error({
          message: 'Error',
          description: 'Maximum file size is 2 GB'
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
      Maximum file size is 2 GB
    </p>
  </BaseUpload.Dragger>
}

export default Upload