import { CopyOutlined, InfoCircleOutlined, LinkOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Col, Divider, Empty, Form, Input, message, Modal, notification, Row, Spin, Switch, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import * as clipboardy from 'clipboardy'
import React, { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce/lib'
import { req } from '../../../utils/Fetcher'

interface Props {
  me: any,
  dataSource?: [any[], (data: any[]) => void],
  onFinish?: () => void,
  dataSelect: [any, (data: any) => void]
}

const Share: React.FC<Props> = ({
  me,
  dataSource,
  onFinish,
  dataSelect: [selectShare, setSelectShare] }) => {

  const [loadingShare, setLoadingShare] = useState<boolean>(false)
  const [sharingOptions, setSharingOptions] = useState<string[]>()
  const [isPublic, setIsPublic] = useState<boolean>()
  const [username, setUsername] = useState<string>()
  const [getUser] = useDebounce(username, 500)
  const [users, setUsers] = useState<any[]>([])
  const [formShare] = useForm()

  useEffect(() => {
    if (getUser) {
      req.get('/users/search', {
        params: {
          username: getUser
        }
      }).then(({ data }) => {
        setUsers(data.users?.filter((user: any) => user.username !== me?.user.username))
      })
    }
  }, [getUser])

  useEffect(() => {
    if (selectShare) {
      const isPublic = (selectShare.sharing_options || [])?.includes('*')
      setIsPublic(isPublic)
      setSharingOptions(selectShare.sharing_options)
      formShare.setFieldsValue({
        id: selectShare.id,
        message: 'Hey, please check this out! 👆',
        public: isPublic,
        sharing_options: selectShare.sharing_options?.length ? selectShare.sharing_options.filter((opt: string) => opt !== '*') : [''],
        link: `${window.location.origin}/view/${selectShare.id}`
      })
    } else {
      formShare.resetFields()
    }
  }, [selectShare])

  const share = async () => {
    setLoadingShare(true)
    const { id, public: isPublic, sharing_options: sharingOpts } = formShare.getFieldsValue()

    const sharing = [
      ...new Set([...sharingOpts === undefined ? sharingOptions : sharingOpts, isPublic ? '*' : null]
        .filter(sh => isPublic ? sh : sh !== '*').filter(Boolean)) as any
    ]
    setSharingOptions(sharing)

    try {
      await req.patch(`/files/${id}`, { file: { sharing_options: sharing } })
      dataSource?.[1](dataSource?.[0].map(file => file.id === id ? { ...file, sharing_options: sharing } : file))
    } catch (error: any) {
      if (error?.response?.status === 402) {
        notification.error({
          message: 'Premium Feature',
          description: 'Please upgrade your plan for using this feature'
        })
        setSelectShare(undefined)
      }
    }
    setLoadingShare(false)
    onFinish?.()
  }

  const copy = (val: string) => {
    clipboardy.write(val)
    return message.info('Copied!')
  }

  return <Modal visible={selectShare}
    onCancel={() => setSelectShare(undefined)}
    footer={null}
    title={`Share ${selectShare?.name}`}>
    <Form form={formShare} layout="horizontal">
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      {selectShare?.type !== 'folder' ? <Form.Item name="public" label="Make public">
        <Switch checked={isPublic} onClick={val => {
          setIsPublic(val)
          share()
        }} />
      </Form.Item> : ''}
      {!isPublic && <Form.List name="sharing_options">
        {(fields, { add, remove }) => <>
          {fields.map((field, i) => <Row gutter={14} key={i}>
            <Col span={22}>
              <Form.Item {...field} rules={[{ required: true, message: 'Username is required' }]}>
                <AutoComplete notFoundContent={<Empty />} options={users?.map((user: any) => ({ value: user.username }))}>
                  <Input onBlur={() => share()} placeholder="username" prefix="@" onChange={e => setUsername(e.target.value)} />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={2}>
              <Button icon={<MinusCircleOutlined />} type="link" danger onClick={() => {
                remove(field.name)
                share()
              }} />
            </Col>
          </Row>)}
          <Form.Item style={{ textAlign: 'left' }}>
            <Button shape="round" onClick={() => {
              add()
              share()
            }} icon={<PlusOutlined />}>Add user</Button>
          </Form.Item>
        </>}
      </Form.List>}
      <Divider />
      <Spin spinning={loadingShare}>
        <Typography.Paragraph type="secondary">
          <InfoCircleOutlined /> You are shared {isPublic ? 'with anyone.' :
            `with ${formShare.getFieldValue('sharing_options')?.[0] || 'no one'}
              ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length > 1 ? ` and ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length - 1} people` : ''}`}
        </Typography.Paragraph>
        {sharingOptions?.[0] ? <Form.Item label={<><LinkOutlined /> &nbsp;Share URL</>} name="link">
          <Input.Search readOnly contentEditable={false} enterButton={<CopyOutlined />} onSearch={copy} />
        </Form.Item> : ''}
      </Spin>
    </Form>
  </Modal>
}

export default Share