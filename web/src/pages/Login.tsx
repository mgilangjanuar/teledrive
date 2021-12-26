import { ArrowRightOutlined, LoginOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, notification, Row, Steps, Typography } from 'antd'
import CountryPhoneInput, { ConfigProvider } from 'antd-country-phone-input'
import { useForm } from 'antd/lib/form/Form'
import JSCookie from 'js-cookie'
import React, { useEffect, useState } from 'react'
import OtpInput from 'react-otp-input'
import { useHistory } from 'react-router'
import useSWRImmutable from 'swr/immutable'
import en from 'world_countries_lists/data/en/world.json'
import { fetcher, req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Login: React.FC = () => {
  const history = useHistory()
  const [formLogin] = useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [phoneData, setPhoneData] = useState<{ phone?: string, code?: number, short?: string }>({})
  const [otp, setOtp] = useState<string>()
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>()
  const [loadingLogin, setLoadingLogin] = useState<boolean>()
  const [countdown, setCountdown] = useState<number>()
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>()
  const [needPassword, setNeedPassword] = useState<boolean>()
  const { data: me } = useSWRImmutable('/users/me', fetcher)
  const { data: _ } = useSWRImmutable('/utils/ipinfo', fetcher, { onSuccess: ({ ipinfo }) => setPhoneData({ short: ipinfo?.country || 'ID' }) })

  const sendCode = async (phoneNumber?: string) => {
    phoneNumber = phoneNumber || phoneData.phone ? `+${phoneData.code}${phoneData.phone}` : ''
    if (!phoneNumber) {
      return notification.error({
        message: 'Error',
        description: 'Please input your valid phone number with country code'
      })
    }

    const fetch = async (phoneCodeHash?: string) => {
      const { data } = phoneCodeHash ? await req.post('/auth/reSendCode', { phoneNumber, phoneCodeHash }) : await req.post('/auth/sendCode', { phoneNumber })
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
      setCurrentStep(currentStep + 1)
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
      return sendCode()
    }
    setLoadingLogin(true)
    const phoneNumber = `+${phoneData.code}${phoneData.phone}`
    const phoneCode = otp
    const { password } = formLogin.getFieldsValue()
    try {
      const { data } = await req.post('/auth/login', { ...needPassword ? { password } : { phoneNumber, phoneCode, phoneCodeHash } })
      setLoadingLogin(false)
      notification.success({
        message: 'Success',
        description: `Welcome back, ${data.user.username}!`
      })
      history.replace('/dashboard')
      return notification.info({
        message: 'Info',
        description: 'Please wait a moment...'
      })
    } catch (error: any) {
      setLoadingLogin(false)
      const { data } = error?.response
      if (data?.details?.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        notification.info({
          message: 'Info',
          description: 'Please input your 2FA password'
        })
        setCurrentStep(currentStep + 1)
        return setNeedPassword(true)
      }
      return notification.error({
        message: 'Error',
        description: data?.error || 'Something error'
      })
    }
  }

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
          <Typography.Title level={2}>
            Login with Telegram
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
            Please download <a href="https://telegram.org/" target="_blank">Telegram</a> app and login with your account.
          </Typography.Paragraph>
          <Card>
            <Steps current={currentStep} style={{ marginBottom: '35px' }} responsive>
              <Steps.Step key="inputPhoneNumber" title="Phone Number" />
              <Steps.Step key="inputCode" title="Code" />
              {needPassword && <Steps.Step key="inputPassword" title="Password 2FA" />}
            </Steps>
            <Form layout="vertical" form={formLogin} onFinish={login}>

              {currentStep === 0 && <>
                <Form.Item>
                  <ConfigProvider locale={en}>
                    <CountryPhoneInput value={phoneData} type="tel" onChange={e => setPhoneData(e)} />
                  </ConfigProvider>
                  {/* <Input.Search placeholder="+6289123456789" type="tel" enterButton={countdown ? `Re-send in ${countdown}s...` : phoneCodeHash ? 'Re-send' : 'Send'} loading={loadingSendCode} onSearch={sendCode} /> */}
                </Form.Item>
                <Form.Item style={{ marginTop: '50px', textAlign: 'center' }} wrapperCol={{ span: 24 }}>
                  <Button type="primary" size="large" htmlType="submit" icon={<ArrowRightOutlined />} shape="round" loading={loadingSendCode}>{phoneCodeHash ? 'Re-send code' : 'Send code'}</Button>
                </Form.Item>
              </>}

              {currentStep === 1 && <>
                <Form.Item>
                  <OtpInput numInputs={5} value={otp} onChange={setOtp} isInputNum containerStyle={{ justifyContent: 'center' }} inputStyle={{
                    width: '2.7rem',
                    height: '2.7rem',
                    margin: '0 0.3rem 0 0',
                    borderRadius: '4px',
                    fontSize: '1.2rem',
                    border: '1px solid rgba(0, 0, 0, 0.3)' }} />
                  {/* <Input disabled={!phoneCodeHash} /> */}
                </Form.Item>
                <Form.Item style={{ marginTop: '50px' }} wrapperCol={{ span: 24 }}>
                  <Button shape="round" block size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
                </Form.Item>
              </>}

              {currentStep === 2 && <>
                <Form.Item name="password" hidden={!needPassword}>
                  <Input.Password size="large" />
                </Form.Item>
                <Form.Item style={{ marginTop: '50px' }} wrapperCol={{ span: 24 }}>
                  <Button shape="round" block size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
                </Form.Item>
              </>}


            </Form>
          </Card>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Login