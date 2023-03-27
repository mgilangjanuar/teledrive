import { Modal, Form, Input, notification, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useState, useEffect } from 'react'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataSource?: [any[], (data: any[]) => void],
  onFinish?: () => void,
  dataSelect: [any, (data: any) => void]
}

const Rename: React.FC<Props> = ({
  dataSource,
  onFinish,
  dataSelect: [fileRename, setFileRename] }) => {

  const [loadingRename, setLoadingRename] = useState<boolean>()
  const [formRename] = useForm()

  useEffect(() => {
    if (fileRename) {
      formRename.setFieldsValue({ name: fileRename.name.replace(/\.part0*\d+$/, '') })
    }
  }, [fileRename])

  const renameFile = async () => {
    setLoadingRename(true)
    const name = String(formRename.getFieldsValue().name)
    try {
      const { data: exists } = await req.get('/files', { params: { parent_id: fileRename.parent_id, name: name } })
      if (/\.part0*\d*$/.test(name))
        throw { status: 400, body: { error: 'The file name cannot end with ".part", even if followed by digits!' } }
      if (/\(\d+\).+/.test(name))
        throw { status: 400, body: { error: 'The file name cannot contain text after parentheses with digits inside!' } }
      if (exists.length > 0)
        throw { status: 400, body: { error: `A file/folder named "${name}" already exists!` } }

      const { data: result } = await req.patch(`/files/${fileRename?.id}`, {
        file: { name }
      })
      notification.success({
        message: 'Success',
        description: `${fileRename?.name.replace(/\.part0*\d+$/, '')} renamed successfully!`
      })
      dataSource?.[1](dataSource?.[0].map((datum: any) => datum.id === result.file.id ? { ...datum, name } : datum))
      setFileRename(undefined)
      setLoadingRename(false)
      formRename.resetFields()
      onFinish?.()
    } catch (error: any) {
      setLoadingRename(false)
      return notification.error({
        message: 'Error',
        description: error?.body?.error || 'Failed to rename a file. Please try again!'
      })
    }
  }

  return <Modal visible={fileRename}
    onCancel={() => setFileRename(undefined)}
    okText="Rename"
    title={<Typography.Text ellipsis>Rename {fileRename?.name.replace(/\.part0*\d+$/, '')}</Typography.Text>}
    onOk={() => formRename.submit()}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ loading: loadingRename, shape: 'round' }}>
    <Form form={formRename} layout="horizontal" onFinish={renameFile}>
      <Form.Item name="name" label="Name">
        <Input />
      </Form.Item>
    </Form>
  </Modal>
}

export default Rename