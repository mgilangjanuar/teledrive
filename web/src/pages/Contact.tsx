import { SendOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, message, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { fetcher, req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Contact: React.FC = () => {
  const [form] = useForm()
  const [loading, setLoading] = useState<boolean>()
  const { data: me } = useSWRImmutable('/users/me', fetcher, {
    onSuccess: ({ user }) => form.setFieldsValue({ from: user.username })
  })

  const send = async () => {
    setLoading(true)
    await req.post('/contact/send', form.getFieldsValue())
    message.success('Message sent!')
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
            Fill in your Telegram username and we'll get back to you via Telegram.
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