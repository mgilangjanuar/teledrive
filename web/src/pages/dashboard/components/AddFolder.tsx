import { Form, Input, Modal, notification } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useState } from 'react'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataSource: [any[], (data: any[]) => void],
  dataActivate: [any, (data: any) => void],
  parent?: Record<string, any> | null
}

const AddFolder: React.FC<Props> = ({
  dataSource: [data, setData],
  dataActivate: [addFolder, setAddFolder],
  parent }) => {

  const [loadingAddFolder, setLoadingAddFolder] = useState<boolean>()
  const [formAddFolder] = useForm()

  const createFolder = async () => {
    setLoadingAddFolder(true)
    const { name } = formAddFolder.getFieldsValue()
    try {
      const { data: result } = await req.post('/files/addFolder', {
        file: { name, parent_id: parent?.link_id || parent?.id || undefined }
      })
      notification.success({
        message: 'Success',
        description: `Folder ${result.file.name} created successfully!`
      })
      formAddFolder.resetFields()
      setData([{ ...result.file, key: result.file.id }, ...data])
      setAddFolder(false)
      setLoadingAddFolder(false)
    } catch (error: any) {
      setLoadingAddFolder(false)
      return notification.error({
        message: 'Error',
        description: error?.message || error
      })
    }
  }

  return <Modal visible={addFolder}
    onCancel={() => setAddFolder(false)}
    okText="Add"
    title="Add Folder"
    onOk={() => formAddFolder.submit()}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ loading: loadingAddFolder, shape: 'round' }}>
    <Form form={formAddFolder} layout="horizontal" onFinish={createFolder}>
      <Form.Item name="name" label="Name">
        <Input placeholder="New Folder" />
      </Form.Item>
    </Form>
  </Modal>
}

export default AddFolder