import { LoginOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, notification, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import JSCookie from 'js-cookie'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWRImmutable from 'swr/immutable'
import { fetcher, req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Login: React.FC = () => {
  const history = useHistory()
  const [formLogin] = useForm()
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>()
  const [loadingLogin, setLoadingLogin] = useState<boolean>()
  const [countdown, setCountdown] = useState<number>()
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>()
  const [needPassword, setNeedPassword] = useState<boolean>()
  const [token] = useState<string | undefined>(new URLSearchParams(location.search).get('code') || localStorage.getItem('invitationCode') || undefined)
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  const sendCode = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return notification.error({
        message: 'Error',
        description: 'Please input your valid phone number with country code'
      })
    }

    const fetch = async (phoneCodeHash?: string) => {
      const { data } = phoneCodeHash ? await req.post('/auth/reSendCode', { token, phoneNumber, phoneCodeHash }) : await req.post('/auth/sendCode', { token, phoneNumber })
      setPhoneCodeHash(data.phoneCodeHash)
      setCountdown(60)
      notification.info({
        message: 'Sent!',
        description: 'Please check your Telegram app and input the code'
      })
    }

    try {
      setLoadingSendCode(true)
      await fetch(phoneCodeHash)
    } catch (error: any) {
      setLoadingSendCode(false)
      notification.error({
        message: 'Error',
        description: error?.response?.data?.error || 'Something error'
      })
      if (error?.response?.status === 400) {
        await fetch()
      }
    }
  }

  const login = async () => {
    if (!phoneCodeHash) {
      return notification.error({
        message: 'Error',
        description: 'Please send code first'
      })
    }
    setLoadingLogin(true)
    const { phoneNumber, phoneCode, password } = formLogin.getFieldsValue()
    try {
      const { data } = await req.post('/auth/login', { token, ...needPassword ? { password } : { phoneNumber, phoneCode, phoneCodeHash } })
      setLoadingLogin(false)
      notification.success({
        message: 'Success',
        description: `Welcome back, ${data.user.username}!`
      })
      return history.replace('/dashboard')
    } catch (error: any) {
      setLoadingLogin(false)
      const { data } = error?.response
      if (data?.details?.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        notification.info({
          message: 'Info',
          description: 'Please input your 2FA password'
        })
        return setNeedPassword(true)
      }
      return notification.error({
        message: 'Error',
        description: data?.error || 'Something error'
      })
    }
  }

  useEffect(() => {
    if (!token) {
      notification.info({
        message: 'Limited to early users',
        description: 'Join the waiting list and always check your inbox 🍻'
      })
      return history.replace('/')
    }
  }, [token])

  useEffect(() => {
    if (JSCookie.get('authorization') && me?.user) {
      console.log(me.user)
      history.replace('/dashboard')
    }
  }, [me])

  useEffect(() => {
    if (countdown) {
      setTimeout(() => setCountdown(countdown - 1), 1000)
    } else {
      setLoadingSendCode(false)
    }
  }, [countdown])

  return <>
    <Navbar />
    <Layout.Content className="container">
      <Row style={{ marginTop: '80px' }}>
        <Col lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={20} offset={2}>
          <Typography.Title>
            Welcome!
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
            Please download <a href="https://telegram.org/" target="_blank">Telegram</a> app and login with your account.
          </Typography.Paragraph>
          <Card>
            <Form layout="horizontal" form={formLogin} onFinish={login} labelCol={{ span: 9 }} wrapperCol={{ span: 15 }}>
              <Form.Item label="Phone Number" name="phoneNumber" rules={[{ required: true, message: 'Please input your phone number' }]}>
                <Input.Search placeholder="+6289123456789" type="tel" enterButton={countdown ? `Re-send in ${countdown}s...` : phoneCodeHash ? 'Re-send' : 'Send'} loading={loadingSendCode} onSearch={sendCode} />
              </Form.Item>
              <Form.Item label="Code" name="phoneCode" rules={[{ required: true, message: 'Please input your code' }]}>
                <Input disabled={!phoneCodeHash || needPassword} />
              </Form.Item>
              <Form.Item label="Password 2FA" name="password" hidden={!needPassword}>
                <Input.Password />
              </Form.Item>
              <Form.Item style={{ marginTop: '50px' }} wrapperCol={{ span: 24 }}>
                <Button shape="round" block size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
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