import { DeleteOutlined, LogoutOutlined, WarningOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Divider, Form, Input, Layout, Modal, notification, Row, Switch, Typography } from 'antd'
import { useForm } from 'antd/es/form/Form'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import useSWRImmutable from 'swr/immutable'
import { apiUrl, fetcher, req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Settings: React.FC = () => {
  const history = useHistory()
  const [expandableRows, setExpandableRows] = useState<boolean>(false)
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)
  const [removeConfirmation, setRemoveConfirmation] = useState<boolean>(false)
  const [formRemoval] = useForm()
  const { data: me } = useSWRImmutable('/users/me', fetcher, {
    onError: () => history.push('/login'),
    onSuccess: ({ user }) => {
      setExpandableRows(user?.settings?.expandable_rows)
    }
  })

  const save = (settings: any) => {
    req.patch('/users/me/settings', { settings })
      .then(() => notification.success({  message: 'Settings saved' }))
      .catch(() => notification.error({ message: 'Something error. Please try again.' }))
  }

  const logout = async () => {
    await req.post('/auth/logout')
    return window.location.replace('/')
  }

  const remove = async () => {
    const { agreement, reason } = formRemoval.getFieldsValue()
    try {
      await req.post('/users/me/delete', { agreement, reason })
      return window.location.replace('/')
    } catch (error: any) {
      return notification.error({ message: 'Error', description: error.response?.data.error })
    }
  }

  return <>
    <Navbar page="settings" user={me} />
    <Layout.Content className="container">
      <Row style={{ marginTop: '30px' }}>
        <Col lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={20} offset={2}>
          <Typography.Title level={2}>
            Settings
          </Typography.Title>
          <Card>
            <Card.Meta avatar={<Avatar size="large" src={`${apiUrl}/users/me/photo`} />} title={me?.user.name} description={me?.user.username} />
            <Divider />
            <Form layout="horizontal" labelAlign="left" labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
              <Form.Item label="Expandable Rows" name="expandable_rows">
                <Switch onChange={val => {
                  setExpandableRows(val)
                  save({ expandable_rows: val })
                }} checked={expandableRows} />
              </Form.Item>
              <Form.Item label={<Typography.Text type="danger">Delete Account</Typography.Text>}>
                <Button shape="round" danger type="primary" icon={<DeleteOutlined />} onClick={() => setRemoveConfirmation(true)}>Permanently Removed</Button>
              </Form.Item>
            </Form>
            <Row>
              <Col span={24} md={{ span: 12, offset: 12 }} lg={{ span: 12, offset: 12 }}>
                <Button icon={<LogoutOutlined />} danger shape="round" onClick={() => setLogoutConfirmation(true)}>
                  Logout
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Layout.Content>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Confirmation
    </Typography.Text>}
    visible={logoutConfirmation}
    onCancel={() => setLogoutConfirmation(false)}
    onOk={logout}
    okButtonProps={{ danger: true, type: 'primary' }}>
      <Typography.Paragraph>
        All the files you share will not be able to download once you sign out. Continue?
      </Typography.Paragraph>
    </Modal>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> This action cannot be undone
    </Typography.Text>}
    visible={removeConfirmation}
    onCancel={() => setRemoveConfirmation(false)}
    onOk={remove}
    okButtonProps={{ danger: true, type: 'primary' }}>
      <Form form={formRemoval} onFinish={remove} layout="vertical">
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please input your username' }]}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="agreement" label={<>Please type &nbsp; <Typography.Text type="danger">permanently removed</Typography.Text> &nbsp; for your confirmation</>} rules={[{ required: true, message: 'Please input your username' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>

    <Footer />
  </>
}

export default Settings