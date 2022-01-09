import { ArrowLeftOutlined, CrownOutlined, FrownOutlined, LogoutOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Form, Input, Layout, List, Modal, notification, Popover, Row, Switch, Typography } from 'antd'
import { useForm } from 'antd/es/form/Form'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import useSWRImmutable from 'swr/immutable'
import * as serviceWorkerRegistration from '../serviceWorkerRegistration'
import { apiUrl, fetcher, req } from '../utils/Fetcher'

interface Props {
  me?: any,
  mutate?: any,
  error?: any
}

const Settings: React.FC<Props> = ({ me, mutate, error }) => {
  const history = useHistory()
  const [expandableRows, setExpandableRows] = useState<boolean>()
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)
  const [removeConfirmation, setRemoveConfirmation] = useState<boolean>(false)
  const [formRemoval] = useForm()
  const { data: respVersion } = useSWRImmutable('/utils/version', fetcher)

  const save = async (settings: any): Promise<void> => {
    try {
      await req.patch('/users/me/settings', { settings })
      notification.success({ message: 'Settings saved' })
      mutate()
    } catch ({ response }) {
      if ((response as any).status === 402) {
        return notification.error({
          message: 'Premium Feature',
          description: 'Please upgrade your plan for using this feature'
        })
      }
      return notification.error({ message: 'Something error. Please try again.' })
    }
  }

  useEffect(() => {
    if (me) {
      setExpandableRows(me.user?.settings?.expandable_rows)
    }
  }, [me])

  useEffect(() => {
    if (error) {
      return history.push('/login')
    }
  }, [error])

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
    <Layout.Content>
      <Row style={{ margin: '50px 12px 100px' }}>
        <Col lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={24}>
          <Typography.Title>
            Settings
          </Typography.Title>
          <Card loading={!me && !error} title={<Card.Meta avatar={<Avatar size="large" src={`${apiUrl}/users/me/photo`} />} title={<>{me?.user.name} {me?.user?.plan === 'premium' && <Popover placement="top" content={<Layout style={{ padding: '7px 13px' }}>Premium</Layout>}>
            <CrownOutlined />
          </Popover>}</>} description={me?.user.username} />} actions={[<Row style={{ marginTop: '15px' }}>
            <Col span={22} offset={1} md={{ span: 12, offset: 6 }}>
              <Typography.Paragraph style={{ textAlign: 'center' }}>
                <Button block icon={<LogoutOutlined />} danger shape="round"
                  onClick={() => setLogoutConfirmation(true)}>
                  Logout
                </Button>
              </Typography.Paragraph>
              <Typography.Paragraph style={{ textAlign: 'center' }}>
                <Button block icon={<ArrowLeftOutlined />} type="link"
                  onClick={() => history.push('/dashboard')}>
                  Back to Dashboard
                </Button>
              </Typography.Paragraph>
              <Typography.Paragraph style={{ textAlign: 'center' }} type="secondary">
                v{respVersion?.version}
              </Typography.Paragraph>
            </Col>
          </Row>]}>
            <Form layout="horizontal" labelAlign="left" labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
              <List>
                <List.Item key="expandable-rows" actions={[<Form.Item name="expandable_rows">
                  <Switch onChange={val => {
                    setExpandableRows(val)
                    save({ expandable_rows: val })
                  }} checked={expandableRows} defaultChecked={expandableRows} />
                </Form.Item>]}>
                  <List.Item.Meta title="Expandable Rows" description="Show file details in row table" />
                </List.Item>

                <List.Item key="dark-mode" actions={[<Form.Item name="dark_mode">
                  <Switch onChange={(val: boolean) => save({ theme: val ? 'dark' : 'light' }).then(window.location.reload)} checked={me?.user.settings?.theme === 'dark'} defaultChecked={me?.user.settings?.theme === 'dark'} />
                </Form.Item>]}>
                  <List.Item.Meta title="Dark Mode" description="Join the dark side" />
                </List.Item>

                <List.Item key="check-for-updates" actions={[<Form.Item>
                  <Button shape="round" icon={<ReloadOutlined />} onClick={() => {
                    serviceWorkerRegistration.unregister();
                    (window.location as any).reload(true)
                  }}>Reload</Button>
                </Form.Item>]}>
                  <List.Item.Meta title="Check Updates" description="Reload to checking for updates" />
                </List.Item>

                <List.Item key="delete-account" actions={[<Form.Item>
                  <Button shape="round" danger type="primary" icon={<FrownOutlined />} onClick={() => setRemoveConfirmation(true)}>Delete</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Typography.Text type="danger">Delete Account</Typography.Text>} description="Delete your account permanently" />
                </List.Item>
              </List>

            </Form>
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
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round' }}>
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
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round' }}>
      <Form form={formRemoval} onFinish={remove} layout="vertical">
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please input your reason' }]}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="agreement" label={<Typography.Text>Please type <Typography.Text type="danger">permanently removed</Typography.Text> for your confirmation</Typography.Text>} rules={[{ required: true, message: 'Please input the confirmation' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  </>
}

export default Settings