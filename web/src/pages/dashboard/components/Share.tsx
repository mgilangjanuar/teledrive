import { KeyOutlined, ArrowRightOutlined, CopyOutlined, InfoCircleOutlined, LinkOutlined, MinusCircleOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
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
  dataSelect: [{ row: any, action: string }, (data?: { row: any, action: string }) => void]
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
      req.get(`/files/${selectShare.row.id}`)
        .then(({ data }) => {
          const isPublic = (data.file.sharing_options || [])?.includes('*')
          setIsPublic(isPublic)
          setSharingOptions(data.file.sharing_options)
          formShare.setFieldsValue({
            id: data.file.id,
            message: 'Hey, please check this out! 👆',
            public: isPublic,
            sharing_options: data.file.sharing_options?.length ? data.file.sharing_options.filter((opt: string) => opt !== '*') : [''],
            link: `${window.location.origin}/view/${data.file.id}`,
            username: null,
            password: data.file.password
          })
        })
    } else {
      formShare.resetFields()
    }
  }, [selectShare])

  const share = async () => {
    setLoadingShare(true)
    const { id, public: isPublic, sharing_options: sharingOpts, username, password } = formShare.getFieldsValue()

    const sharing = (sharingOpts || sharingOptions)?.length || isPublic ? [
      ...new Set([
        ...sharingOpts === undefined ? sharingOptions : sharingOpts,
        isPublic ? '*' : null
      ].filter(sh => isPublic ? sh : sh !== '*').filter(Boolean)) as any
    ] : []
    setSharingOptions(sharing)

    try {
      if (selectShare?.action === 'share') {
        await req.patch(`/files/${id}`, {
          file: {
            sharing_options: sharing,
            password: password === '[REDACTED]' ? undefined : password === '' ? null : password
          }
        })
        dataSource?.[1](dataSource?.[0].map(file => file.id === id ? { ...file, sharing_options: sharing } : file))
      } else {
        const [type, peerId, _id, accessHash] = selectShare.row.forward_info?.split('/') || [null, null, null, null]
        await req.post(`/messages/forward/${selectShare.row.message_id}`, {
          ...selectShare.row.forward_info ? {
            from: {
              id: peerId,
              type,
              accessHash
            }
          } : {},
          to: username
        })
        notification.success({
          message: 'Success',
          description: `${selectShare?.row.name} sent to @${username} successfully`
        })
        formShare.setFieldsValue({ username: null })
      }
    } catch (error: any) {
      if (error?.response?.status === 402) {
        notification.error({
          message: 'Premium Feature',
          description: 'Please upgrade your plan for using this feature'
        })
        setSelectShare(undefined)
      }
      setLoadingShare(false)
    }
    setLoadingShare(false)
    onFinish?.()
  }

  const copy = (val: string) => {
    clipboardy.write(val)
    return message.info('Copied!')
  }

  return <Modal visible={selectShare?.row}
    onCancel={() => setSelectShare(undefined)}
    footer={null}
    title={<Typography.Text ellipsis>{selectShare?.action === 'share' ? 'Share' : 'Send'} {selectShare?.row.name.replace(/\.part0*\d+$/, '')}</Typography.Text>}>
    <Form form={formShare} layout="horizontal" onFinish={share}>
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      {selectShare?.action === 'share' ? <Form.Item name="public" label="Make public">
        <Switch checked={isPublic} onClick={val => {
          setIsPublic(val)
          share()
        }} />
      </Form.Item> : ''}
      {!isPublic && selectShare?.action === 'share' && <Form.List name="sharing_options">
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
      {selectShare?.action === 'forward' && <>
        <Form.Item rules={[{ required: true, message: 'Username is required' }]} name="username">
          <AutoComplete notFoundContent={<Empty />} options={users?.map((user: any) => ({ value: user.username }))}>
            <Input placeholder="username" prefix="@" onChange={e => setUsername(e.target.value)} />
          </AutoComplete>
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button htmlType="submit" shape="round" loading={loadingShare} icon={<ArrowRightOutlined />}>Send</Button>
        </Form.Item>
      </>}
      {selectShare?.action === 'share' && <>
        <Typography.Paragraph type="secondary">
          <WarningOutlined /> Your encrypted session will be saved for downloading this file
        </Typography.Paragraph>
      </>}
      <Divider />
      <Spin spinning={loadingShare}>
        {selectShare?.action === 'share' ? <>
          {sharingOptions?.[0] ? <Form.Item label={<><LinkOutlined /> &nbsp;Share URL</>} name="link">
            <Input.Search readOnly className="input-search-round" contentEditable={false} enterButton={<CopyOutlined />} onSearch={copy} />
          </Form.Item> : ''}
          <Typography.Paragraph type="secondary">
            <InfoCircleOutlined /> You are shared {isPublic ? 'with anyone.' :
              `with ${formShare.getFieldValue('sharing_options')?.[0] || 'no one'}
                ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length > 1 ? ` and ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length - 1} people` : ''}`}
          </Typography.Paragraph>
        </> : <Typography.Paragraph type="secondary">
          <InfoCircleOutlined /> You will send this file to the user directly
        </Typography.Paragraph>}
        {selectShare?.action === 'share' && <>
          <Divider />
          <Form.Item name="password" label={<><KeyOutlined /> &nbsp;Create password</>}>
            <Input.Password allowClear onBlur={share} />
          </Form.Item>
        </>}
      </Spin>
    </Form>
  </Modal>
}

export default Share