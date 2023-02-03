import { CloudUploadOutlined } from '@ant-design/icons'
import { notification, Typography, Upload as BaseUpload } from 'antd'
import mime from 'mime-types'
import React, { useEffect, useRef } from 'react'
import { Api } from 'teledrive-client'
import { CHUNK_SIZE, MAX_UPLOAD_SIZE, RETRY_COUNT } from '../../../utils/Constant'
import { req } from '../../../utils/Fetcher';
import { telegramClient } from '../../../utils/Telegram'

interface Props {
  dataFileList: [any[], (data: any[]) => void],
  parent?: Record<string, any> | null,
  isDirectory?: boolean,
  me?: any,
  onCancel: (file: any) => void
}

const Upload: React.FC<Props> = ({
  dataFileList: [fileList, setFileList],
  parent,
  isDirectory,
  me,
  onCancel,
}) => {
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
    let retryCount = 0
    while (retryCount < RETRY_COUNT) {
      try {
        await fn()
        retryCount = RETRY_COUNT
      } catch (error) {
        await new Promise((res) => setTimeout(res, 3000 * ++retryCount))
        await cb?.()
        if (retryCount === RETRY_COUNT) {
          notification.error({
            message: 'Failed to upload file',
            description: (
              <>
                <Typography.Paragraph>
                  {error?.response?.data?.error || error.message || 'Something error'}
                </Typography.Paragraph>
                <Typography.Paragraph code>
                  {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
                </Typography.Paragraph>
              </>
            ),
          });
          throw error
        }
      }
    }
  };

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    filesWantToUpload.current = [...filesWantToUpload.current, file]
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: "Please don't close/reload this browser",
    });
    window.onbeforeunload = () => {
      return 'Are you sure you want to leave?'
    };
      // ... rest of the code ...
    } ,catch (error) {
      if (!deleted) {
        try {
          await req('DELETE', `/telegram/files/${data.fileId}`)
        } catch (e) {}
      }
      onError(error)
    } finally {
      filesWantToUpload.current = filesWantToUpload.current.filter(f => f.uid !== file.uid)
      if (!filesWantToUpload.current.length) {
        window.onbeforeunload = undefined
        notification.success({
          key: 'preparingUpload',
          message: 'Success',
          description: 'Uploading process has been finished'
        })
      }
    }
  }

  const customRequest = async (params: any) => {
    const file = params.file
    try {
      await retry(
        async () => {
          const fileMetadata = await telegramClient.upload.getFile(file.name, file.type, parentPath.current?.fileId, isDirectory)
          if (parentPath.current?.fileId !== fileMetadata.fileId) {
            parentPath.current = fileMetadata
          }
          return upload({
            ...params,
            fileMetadata,
            file
          })
        },
        async () => {
          parentPath.current = null
        }
      )
      params.onSuccess()
    } catch (error) {
      params.onError(error)
    }
  }

  return (
    <BaseUpload
      customRequest={customRequest}
      fileList={fileList}
      onChange={(info) => {
        const newFileList = info.fileList.map(f => {
          if (f.status === 'done' || f.status === 'error') {
            onCancel(f)
            return null
          }
          return f
        }).filter(f => f) as any[]
        setFileList(newFileList)
      }}
    >
      <span className="ant-btn ant-btn-primary">
        <CloudUploadOutlined /> Upload
      </span>
    </BaseUpload>
  )
}

export default Upload
