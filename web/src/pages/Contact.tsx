import { SendOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, Modal, notification, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { req } from '../utils/Fetcher'

interface Props {
  me?: any
}

const Contact: React.FC<Props> = ({ me }) => {
  const [form] = useForm()
  const [loading, setLoading] = useState<boolean>()
  const [confirmation, setConfirmation] = useState<boolean>()

  useEffect(() => {
    form.setFieldsValue({
      from: me?.user.username,
      email: localStorage.getItem('email')
    })
  }, [me])

  useEffect(() => {
    const intent = new URLSearchParams(location.search).get('intent')
    if (intent === 'sponsor') {
      form.setFieldsValue({
        message: 'Hey 👋\nI want to be your sponsor!\n\nWhat should I do? 😁'
      })
    } else if (intent === 'help') {
      form.setFieldsValue({
        message: 'Hello, I need your help!\n\n<your message here>'
      })
    } else if (intent === 'report') {
      form.setFieldsValue({
        message: 'Hi, I want to report for fraud/scam/sensitive content! 🤮\n\n<your link/message here>'
      })
    } else if (intent === 'bug') {
      form.setFieldsValue({
        message: 'Hello 👋\nI found bug/security hole in your platform 😨\n\n<your message here>'
      })
    }
  }, [])

  const send = async () => {
    if (!confirmation) {
      return setConfirmation(true)
    }
    setLoading(true)
    localStorage.setItem('email', form.getFieldValue('email'))
    await req.post('/contact/send', form.getFieldsValue())
    form.setFieldsValue({ message: null })
    notification.success({
      message: 'Sent!',
      description: 'Your message sent successfully!'
    })
    setConfirmation(undefined)
    setLoading(false)
  }

  return <>
    <Layout.Content className="container">
      <Row style={{ marginTop: '80px' }}>
        <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 8, offset: 8 }} lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={20} offset={2}>
          <Typography.Title>
            Contact Us
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
            Please fill in your Telegram username and we'll get back to you via Telegram. Or, email us at <a href="mailto:support@teledriveapp.com">support@teledriveapp.com</a>.
          </Typography.Paragraph>
          <Card>
            <Form form={form} layout="horizontal" onFinish={send} wrapperCol={{ span: 18 }} labelCol={{ span: 6 }}>
              <Form.Item name="from" label="Username" rules={[{ required: true, message: 'Please input your username' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please input your email' }]}>
                <Input type="email" />
              </Form.Item>
              <Form.Item help={<>Language: English</>} name="message" label="Message" rules={[{ required: true, message: 'Please input your message' }]}>
                <Input.TextArea rows={5} />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginTop: '30px' }} wrapperCol={{ span: 24 }}>
                <Button shape="round" loading={loading} htmlType="submit" type="primary" icon={<SendOutlined />}>Send</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout.Content>
    <Modal visible={confirmation}
      title={<><WarningOutlined /> Confirmation</>}
      onCancel={() => setConfirmation(undefined)}
      onOk={send}
      okText="Confirm"
      cancelButtonProps={{ shape: 'round' }}
      okButtonProps={{ type: 'primary', loading, shape: 'round' }}>
      <Typography.Paragraph>
        Please double check your username (<Link target="_blank" to={{ pathname: `https://t.me/${form.getFieldValue('from')}` }}>@{form.getFieldValue('from')}</Link>) because we will reply your message to this Telegram account.
      </Typography.Paragraph>
    </Modal>
  </>
}

export default Contact