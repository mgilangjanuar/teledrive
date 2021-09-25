import { InboxOutlined } from '@ant-design/icons'
import { notification, Upload as BaseUpload } from 'antd'
import React, { useRef } from 'react'
import mime from 'mime-types'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataFileList: [any[], (data: any[]) => void],
  parent?: Record<string, any> | null,
  onCancel: (file: any) => void
}

const Upload: React.FC<Props> = ({ dataFileList: [fileList, setFileList], parent, onCancel }) => {
  const cancelUploading = useRef<string | null>(null)

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    notification.info({
      key: `upload-${file.uid}`,
      message: 'Preparing to upload',
      description: <>Uploading (0%) {file.name}</>,
      duration: null
    })
    const chunkSize = 512 * 1024
    const parts = Math.ceil(file.size / chunkSize)
    let firstResponse: any

    try {
      for (let i = 0; i < parts; i++) {
        if (firstResponse?.file && cancelUploading.current && file.uid === cancelUploading.current) {
          await req.delete(`/files/${firstResponse?.file.id}`)
          cancelUploading.current = null
          break
        }
        const blobPart = file.slice(i * chunkSize, Math.min(i * chunkSize + chunkSize, file.size))
        const data = new FormData()
        data.append('upload', blobPart)

        const { data: response } = await req.post(`/files/upload${firstResponse?.file?.id ? `/${firstResponse?.file.id}` : ''}`, data, {
          params: {
            ...parent?.id ? { parent_id: parent.id || undefined } : {},
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

        const percent = ((i + 1) / parts * 100).toFixed(2)
        notification.info({
          key: `upload-${file.uid}`,
          message: 'On it!',
          description: <>Uploading ({percent}%) {file.name}</>,
          duration: null
        })
        onProgress({ percent }, file)
      }
      notification.close(`upload-${file.uid}`)
      notification.success({
        message: 'Success',
        description: `File ${file.name} uploaded successfully`
      })
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

  return <BaseUpload.Dragger name="upload"
    customRequest={upload}
    beforeUpload={file => {
      if (file.size / 1_000_000_000 > 2) {
        notification.error({
          message: 'Error',
          description: 'Maximum file size is 2 GB'
        })
        return false
      }
      return true
    }}
    fileList={fileList}
    onRemove={file => {
      if (!file.response?.file) {
        cancelUploading.current = file.uid
        return true
      }
      if (file.response?.file) {
        onCancel(file.response?.file)
      }
      return false
    }}
    onChange={async ({ fileList }) => setFileList(fileList)}>
    <p className="ant-upload-drag-icon"> <InboxOutlined /></p>
    <p className="ant-upload-text">Click or drag file to this area to upload</p>
    <p className="ant-upload-hint">
      Maximum file size is 2 GB
    </p>
  </BaseUpload.Dragger>
}

export default Upload