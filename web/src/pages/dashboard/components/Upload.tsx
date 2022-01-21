import { CloudUploadOutlined } from '@ant-design/icons'
import { notification, Upload as BaseUpload } from 'antd'
import mime from 'mime-types'
import React, { useEffect, useRef } from 'react'
import { CHUNK_SIZE, MAX_UPLOAD_SIZE } from '../../../utils/Constant'
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
  const parentPath = useRef<Record<string, string> | null>(null)
  const filesWantToUpload = useRef<any[]>([])

  useEffect(() => {
    if (!fileList?.length) {
      parentPath.current = null
      filesWantToUpload.current = []
    }
  }, [fileList])

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    filesWantToUpload.current.push(file)
    notification.warn({
      key: 'preparingUpload',
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    window.onbeforeunload = () => {
      return 'Are you sure you want to leave?'
    }
    if (isDirectory) {
      await new Promise(res => setTimeout(res, 3000))
    }

    const fileParts = Math.ceil(file.size / MAX_UPLOAD_SIZE)
    let deleted = false

    try {
      let parentId = parent?.id
      if (file.webkitRelativePath) {
        if (isDirectory) {
          await new Promise(res => setTimeout(res, 1000 * filesWantToUpload.current?.findIndex(f => f.uid === file.uid) + 1))
        }
        const paths = file.webkitRelativePath.split('/').slice(0, -1) || []
        if (parentPath.current?.[paths.join('/')]) {
          parentId = parentPath.current[paths.join('/')]
        } else {
          for (const i in paths) {
            const path = paths[i]
            if (parentPath.current?.[paths.slice(0, i + 1).join('/')]) {
              parentId = parentPath.current[paths.slice(0, i + 1).join('/')]
            } else {
              const { data: findFolder } = await req.get('/files', { params: {
                type: 'folder',
                name: path,
                ...parentId ? { parent_id: parentId } : { 'parent_id.is': 'null' },
              } })
              if (findFolder?.length) {
                parentId = findFolder.files[0].id
                parentPath.current = { ...parentPath.current || {}, [paths.slice(0, i + 1).join('/')]: parentId }
              } else {
                const { data: newFolder } = await req.post('/files/addFolder', {
                  file: {
                    name: path,
                    ...parentId ? { parent_id: parentId } : {},
                  }
                })
                parentId = newFolder.file.id
                parentPath.current = { ...parentPath.current || {}, [paths.slice(0, i + 1).join('/')]: parentId }
              }
            }
          }
        }
      }

      const responses: any[] = []
      let totalParts: number = 0
      const totalAllParts = Math.ceil(file.size % MAX_UPLOAD_SIZE / CHUNK_SIZE) + (fileParts - 1) * Math.ceil(MAX_UPLOAD_SIZE / CHUNK_SIZE)

      await Promise.all(Array.from(Array(fileParts).keys()).map(async j => {
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
                    ...parentId ? { parent_id: parentId } : {},
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
              while (trial < 10) {
                try {
                  responses[j] = await beginUpload()
                  trial = 10
                } catch (error) {
                  await new Promise(res => setTimeout(res, 1500))
                  trial++
                }
              }

              const percent = (++totalParts / totalAllParts * 100).toFixed(1)
              onProgress({ percent }, file)
            }
          }

          const group = 1
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