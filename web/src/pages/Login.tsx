import { Button, Card, Col, Form, Input, Layout, message, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import JSCookie from 'js-cookie'
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
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  const sendCode = async (phoneNumber: string) => {
    if (!phoneNumber) {
      return message.error('Please input your valid phone number with country code')
    }
    const token = localStorage.getItem('invitationCode')
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
    const token = localStorage.getItem('invitationCode')
    const { phoneNumber, phoneCode, password } = formLogin.getFieldsValue()
    try {
      const { data } = needPassword ? await req.post('/auth/checkPassword', { token, password }) : await req.post('/auth/login', { token, phoneNumber, phoneCode, phoneCodeHash })
      setLoadingLogin(false)
      message.success(`Welcome back, ${data.user.username}!`)
      return history.replace('/dashboard')
    } catch (error: any) {
      setLoadingLogin(false)
      const { data } = error?.response
      if (data?.details?.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        message.info('Please input your 2FA password')
        return setNeedPassword(true)
      }
      return message.error(data?.error || 'Something error')
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('invitationCode')) {
      message.error('Oops, you don\'t have an invitation code')
      message.info('Please wait and always check your inbox 🍻')
      return history.replace('/')
    }
  }, [])

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
    <Layout.Content>
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
                <Input.Search placeholder="6289123456789" type="tel" enterButton={countdown ? `Re-send in ${countdown}s...` : phoneCodeHash ? 'Re-send' : 'Send'} loading={loadingSendCode} onSearch={sendCode} />
              </Form.Item>
              <Form.Item label="Code" name="phoneCode" rules={[{ required: true, message: 'Please input your code' }]}>
                <Input disabled={!phoneCodeHash} />
              </Form.Item>
              <Form.Item label="Password 2FA" name="password" hidden={!needPassword}>
                <Input.Password />
              </Form.Item>
              <Form.Item style={{ marginTop: '50px' }} wrapperCol={{ span: 24 }}>
                <Button block size="large" type="primary" htmlType="submit" loading={loadingLogin}>Login</Button>
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