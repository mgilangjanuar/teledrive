import { Button, Card, Col, Form, Input, Layout, message, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import JSCookie from 'js-cookie'
import React, { useState, useEffect } from 'react'
import { req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Login: React.FC = () => {
  const [formLogin] = useForm()
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>()
  const [loadingLogin, setLoadingLogin] = useState<boolean>()
  const [countdown, setCountdown] = useState<number>()
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>()

  const sendCode = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return message.error('Please input your valid phone number with country code')
    }
    try {
      setLoadingSendCode(true)
      const { data } = await req.post('/auth/sendCode', { phoneNumber })
      JSCookie.set('authorization', `Bearer ${data.accessToken}`)
      setPhoneCodeHash(data.phoneCodeHash)
      setCountdown(60)
    } catch (error: any) {
      setLoadingSendCode(false)
      return message.error(error?.response?.data?.error || 'Something error')
    }
  }

  const login = async () => {
    if (!phoneCodeHash) {
      return message.error('Please send code first')
    }
    setLoadingLogin(true)
    const { phoneNumber, phoneCode } = formLogin.getFieldsValue()
    try {
      const { data } = await req.post('/auth/login', { phoneNumber, phoneCode, phoneCodeHash })
      JSCookie.set('authorization', `Bearer ${data.accessToken}`)
      setLoadingLogin(false)
      return message.success(`Welcome back, ${data.user.username}!`)
    } catch (error: any) {
      setLoadingLogin(false)
      return message.error(error?.response?.data?.error || 'Something error')
    }
  }

  useEffect(() => {
    if (countdown) {
      setTimeout(() => setCountdown(countdown - 1), 1000)
    } else {
      setLoadingSendCode(false)
    }
  }, [countdown])

  return <>
    <Navbar />
    <Layout.Content>
      <Row style={{ marginTop: '20vh' }}>
        <Col lg={{ span: 8, offset: 8 }} md={{ span: 12, offset: 6 }} span={20} offset={2}>
          <Card>
            <Typography.Paragraph type="secondary">
              Please download <a href="https://telegram.org/" target="_blank">Telegram</a> app and login with your account.
            </Typography.Paragraph>
            <Form layout="horizontal" form={formLogin} onFinish={login} labelCol={{ span: 9 }} wrapperCol={{ span: 15 }}>
              <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true, message: 'Please input your phone number' }]}>
                <Input.Search placeholder="628912345678" enterButton={countdown ? `Wait in ${countdown}s...` : 'Send code'} loading={loadingSendCode} onSearch={sendCode} />
              </Form.Item>
              <Form.Item label="Code" name="phoneCode" rules={[{ required: true, message: 'Please input your code' }]}>
                <Input placeholder="98765" />
              </Form.Item>
              <Form.Item wrapperCol={{ span: 15, offset: 9 }}>
                <Button type="primary" htmlType="submit" loading={loadingLogin}>Login</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Login