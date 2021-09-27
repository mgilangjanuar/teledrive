import { SendOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, notification, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher, req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Contact: React.FC = () => {
  const [form] = useForm()
  const [loading, setLoading] = useState<boolean>()
  const { data: me } = useSWR('/users/me', fetcher, {
    onSuccess: ({ user }) => form.setFieldsValue({ from: user.username })
  })

  useEffect(() => window.scrollTo(0, 0), [])

  useEffect(() => {
    const intent = new URLSearchParams(location.search).get('intent')
    console.log(intent)
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
    setLoading(true)
    await req.post('/contact/send', form.getFieldsValue())
    notification.success({
      message: 'Sent!',
      description: 'Your message sent successfully!'
    })
    setLoading(false)
  }

  return <>
    <Navbar user={me} />
    <Layout.Content className="container">
      <Row style={{ marginTop: '50px' }}>
        <Col lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={20} offset={2}>
          <Typography.Title>
            Contact Us
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
            Please fill in your Telegram username and we'll get back to you via Telegram.
          </Typography.Paragraph>
          <Card>
            <Form form={form} layout="horizontal" onFinish={send} wrapperCol={{ span: 18 }} labelCol={{ span: 6 }}>
              <Form.Item name="from" label="Username" rules={[{ required: true, message: 'Please input your username' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Please input your message' }]}>
                <Input.TextArea rows={5} />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right' }} wrapperCol={{ span: 24 }}>
                <Button loading={loading} htmlType="submit" type="primary" icon={<SendOutlined />}>Send</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Contact