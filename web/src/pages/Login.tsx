import { Button, Card, Col, Form, Input, Layout, message, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Login: React.FC = () => {
  const history = useHistory()
  const [formLogin] = useForm()
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>()
  const [loadingLogin, setLoadingLogin] = useState<boolean>()
  const [countdown, setCountdown] = useState<number>()
  const [token, setToken] = useState<string>()
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params?.get('token')) {
      return history.replace('/')
    }
    setToken(params.get('token') as string)
  }, [])

  const sendCode = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return message.error('Please input your valid phone number with country code')
    }
    try {
      setLoadingSendCode(true)
      const { data } = phoneCodeHash ? await req.post('/auth/reSendCode', { token, phoneNumber, phoneCodeHash }) : await req.post('/auth/sendCode', { token, phoneNumber })
      setPhoneCodeHash(data.phoneCodeHash)
      setCountdown(60)
    } catch (error: any) {
      setLoadingSendCode(false)
      message.error(error?.response?.data?.error || 'Something error')
      if (error?.response?.status === 400) {
        message.info('Please reload your browser and try it again...')
      }
    }
  }

  const login = async () => {
    if (!phoneCodeHash) {
      return message.error('Please send code first')
    }
    setLoadingLogin(true)
    const { phoneNumber, phoneCode } = formLogin.getFieldsValue()
    try {
      const { data } = await req.post('/auth/login', { token, phoneNumber, phoneCode, phoneCodeHash })
      setLoadingLogin(false)
      message.success(`Welcome back, ${data.user.username}!`)
      return history.replace('/dashboard')
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
                <Input.Search type="tel" enterButton={countdown ? `Re-send in ${countdown}s...` : phoneCodeHash ? 'Re-send' : 'Send'} loading={loadingSendCode} onSearch={sendCode} />
              </Form.Item>
              <Form.Item label="Code" name="phoneCode" rules={[{ required: true, message: 'Please input your code' }]}>
                <Input />
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