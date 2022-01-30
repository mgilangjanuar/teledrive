import { ArrowRightOutlined, CheckCircleTwoTone, GlobalOutlined, LoginOutlined } from '@ant-design/icons'
import { Button, Card, Col, Collapse, Form, Input, Layout, notification, Row, Spin, Steps, Typography } from 'antd'
import CountryPhoneInput, { ConfigProvider } from 'antd-country-phone-input'
import { useForm } from 'antd/lib/form/Form'
import JSCookie from 'js-cookie'
import React, { useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import OtpInput from 'react-otp-input'
import QRCode from 'react-qr-code'
import { useHistory } from 'react-router'
import useSWRImmutable from 'swr/immutable'
import en from 'world_countries_lists/data/en/world.json'
import { fetcher, req } from '../utils/Fetcher'

interface Props {
  me?: any
}

const Login: React.FC<Props> = ({ me }) => {
  const history = useHistory()
  const [formLogin] = useForm()
  const [formLoginQRCode] = useForm()
  const [dc, setDc] = useState<string>()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [phoneData, setPhoneData] = useState<{ phone?: string, code?: number, short?: string }>({})
  const [otp, setOtp] = useState<string>()
  const [loadingSendCode, setLoadingSendCode] = useState<boolean>()
  const [loadingLogin, setLoadingLogin] = useState<boolean>()
  const [countdown, setCountdown] = useState<number>()
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>()
  const [needPassword, setNeedPassword] = useState<boolean>()
  const [method, setMethod] = useState<'phoneNumber' | 'qrCode'>('phoneNumber')
  const { data: _ } = useSWRImmutable('/utils/ipinfo', fetcher, { onSuccess: ({ ipinfo }) => setPhoneData(phoneData?.short ? phoneData : { short: ipinfo?.country || 'ID' }) })
  const [qrCode, setQrCode] = useState<{ loginToken: string, accessToken: string, session?: string }>()
  const { currentTheme } = useThemeSwitcher()

  useEffect(() => {
    if (window.location.host === 'ge.teledriveapp.com') {
      setDc('ge')
      localStorage.setItem('dc', 'ge')
    } else if (window.location.host === 'us.teledriveapp.com') {
      setDc('us')
      localStorage.setItem('dc', 'us')
    } else {
      setDc('sg')
      localStorage.setItem('dc', 'sg')
    }
  }, [])

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
      setCountdown(170)
      notification.info({
        message: 'Sent!',
        description: 'Please check your Telegram app and input the code'
      })
    }

    try {
      setLoadingSendCode(true)
      await fetch(phoneCodeHash)
      setCurrentStep(1)
      setLoadingSendCode(false)
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
      try {
        req.post('/users/me/paymentSync')
        if (localStorage.getItem('files')) {
          notification.info({
            key: 'sync',
            duration: null,
            message: 'Sync files data...',
            description: 'Please wait, we found your files data from another server.'
          })
          req.post('/files/filesSync', { files: JSON.parse(localStorage.getItem('files') || '[]') })
            .then(() => {
              notification.success({
                key: 'sync',
                duration: 4.5,
                message: 'Files data synced successfully',
                description: 'Reload your browser to see the migrated files.',
                btn: <Button href={window.location.href}>Reload</Button>
              })
              localStorage.removeItem('files')
            })
        }
      } catch (error) {
        // ignore
      }
      setLoadingLogin(false)
      notification.success({
        message: 'Success',
        description: `Welcome back, ${data.user.name || data.user.username}! Please wait a moment...`
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
        setCurrentStep(currentStep + 1)
        return setNeedPassword(true)
      }
      return notification.error({
        message: 'Error',
        description: data?.error || 'Something error'
      })
    }
  }

  const loginByQrCode = async () => {
    try {
      const { password } = formLoginQRCode.getFieldsValue()
      setLoadingLogin(true)
      const { data } = await req.post('/auth/qrCodeSignIn', { password, session: qrCode?.session })
      try {
        req.post('/users/me/paymentSync')
        if (localStorage.getItem('files')) {
          notification.info({
            key: 'sync',
            duration: null,
            message: 'Sync files data...',
            description: 'Please wait, we found your files data from another server.'
          })
          req.post('/files/filesSync', { files: JSON.parse(localStorage.getItem('files') || '[]') })
            .then(() => {
              notification.success({
                key: 'sync',
                duration: 4.5,
                message: 'Files data synced successfully',
                description: 'Reload your browser to see the migrated files.',
                btn: <Button href={window.location.href}>Reload</Button>
              })
              localStorage.removeItem('files')
            })
        }
      } catch (error) {
        // ignore
      }
      notification.success({
        message: 'Success',
        description: `Welcome back, ${data.user.name || data.user.username}! Please wait a moment...`
      })
      setLoadingLogin(false)
      return history.replace('/dashboard')
    } catch (error: any) {
      setLoadingLogin(false)
      return notification.error({
        message: 'Error',
        description: error.response?.data?.error || 'Something error'
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

  useEffect(() => {
    if (method === 'qrCode') {
      if (!qrCode?.loginToken) {
        req.get('/auth/qrCode').then(({ data }) => {
          setQrCode(data)
        })
      }
    } else {
      setQrCode(undefined)
    }
  }, [method])

  useEffect(() => {
    if (qrCode && method === 'qrCode' && !needPassword) {
      setTimeout(() => {
        if (method === 'qrCode' && !needPassword && qrCode?.loginToken && qrCode?.accessToken) {
          req.post('/auth/qrCodeSignIn', {}, { headers: {
            'Authorization': `Bearer ${qrCode.accessToken}`
          } }).then(({ data }) => {
            if (data?.user) {
              try {
                req.post('/users/me/paymentSync')
                if (localStorage.getItem('files')) {
                  notification.info({
                    key: 'sync',
                    duration: null,
                    message: 'Sync files data...',
                    description: 'Please wait, we found your files data from another server.'
                  })
                  req.post('/files/filesSync', { files: JSON.parse(localStorage.getItem('files') || '[]') })
                    .then(() => {
                      notification.success({
                        key: 'sync',
                        duration: 4.5,
                        message: 'Files data synced successfully',
                        description: 'Reload your browser to see the migrated files.',
                        btn: <Button href={window.location.href}>Reload</Button>
                      })
                      localStorage.removeItem('files')
                    })
                }
              } catch (error) {
                // ignore
              }
              notification.success({
                message: 'Success',
                description: `Welcome back, ${data.user.name || data.user.username}! Please wait a moment...`
              })
              history.replace('/dashboard')
            } else {
              setQrCode(data)
            }
          }).catch(({ response }: any) => {
            if (response?.data?.details?.errorMessage === 'SESSION_PASSWORD_NEEDED') {
              notification.info({
                message: 'Info',
                description: 'Please input your 2FA password'
              })
              setQrCode({ ...qrCode, session: response.data.details.session })
              setNeedPassword(true)
            } else {
              notification.error({
                message: 'Error',
                description: response?.data?.error || 'Something error'
              })
            }
          })
        }
      }, 3000)
    }
  }, [qrCode, method])

  return <>
    <Layout.Content className="container">
      <Row style={{ marginTop: '30px' }}>
        <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 8, offset: 8 }} lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={22} offset={1}>
          <Collapse>
            <Collapse.Panel key="1" showArrow={false} header={<Typography.Text>
              <GlobalOutlined /> Data center region
            </Typography.Text>}>
              <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
                This will affect your upload and download speed, choose the nearest datacenter region to you.
              </Typography.Paragraph>
              <Row gutter={12} justify="center">
                <Col span={24} md={8} style={{ textAlign: 'center' }}>
                  <Card hoverable style={{ marginBottom: '12px' }} onClick={() => {
                    setDc('sg')
                    localStorage.setItem('dc', 'sg')
                    return window.location.replace('https://teledriveapp.com/login')
                  }}>
                    <Typography.Paragraph style={dc === 'sg' || !dc ? {} : { visibility: 'hidden' }}>
                      <CheckCircleTwoTone />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      <img style={{ width: '100%', maxWidth: '80px' }} src="https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Singapore.svg" />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      Singapore
                    </Typography.Paragraph>
                  </Card>
                </Col>
                <Col span={24} md={8} style={{ textAlign: 'center' }}>
                  <Card hoverable style={{ marginBottom: '12px' }} onClick={() => {
                    setDc('ge')
                    localStorage.setItem('dc', 'ge')
                    return window.location.replace('https://ge.teledriveapp.com/login')
                  }}>
                    <Typography.Paragraph style={dc === 'ge' ? {} : { visibility: 'hidden' }}>
                      <CheckCircleTwoTone />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      <img style={{ width: '100%', maxWidth: '80px' }} src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Flag_of_Germany.svg" />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      Frankfurt
                    </Typography.Paragraph>
                  </Card>
                </Col>
                <Col span={24} md={8} style={{ textAlign: 'center' }}>
                  <Card hoverable style={{ marginBottom: '12px' }} onClick={() => {
                    setDc('us')
                    localStorage.setItem('dc', 'us')
                    return window.location.replace('https://us.teledriveapp.com/login')
                  }}>
                    <Typography.Paragraph style={dc === 'us' ? {} : { visibility: 'hidden' }}>
                      <CheckCircleTwoTone />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      <img style={{ width: '100%', maxWidth: '80px' }} src="https://upload.wikimedia.org/wikipedia/commons/0/05/US_flag_51_stars.svg" />
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      New York
                    </Typography.Paragraph>
                  </Card>
                </Col>
              </Row>
            </Collapse.Panel>
          </Collapse>
          <br /><br />

          <Typography.Title level={2}>
            Login with Telegram
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
            Please download <a href="https://telegram.org/" target="_blank">Telegram</a> app and login with your account.
          </Typography.Paragraph>
          <Card>
            {method === 'phoneNumber' && <>
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
                    <Button disabled={!phoneData?.phone} type="primary" size="large" htmlType="submit" icon={<ArrowRightOutlined />} shape="round" loading={loadingSendCode}>{phoneCodeHash ? 'Re-send code' : 'Send code'}</Button>
                  </Form.Item>
                  <Typography.Paragraph style={{ textAlign: 'center' }}>
                    <Button type="link" onClick={() => setMethod('qrCode')}>Login by QR Code</Button>
                  </Typography.Paragraph>
                </>}

                {currentStep === 1 && <>
                  <Form.Item style={{ textAlign: 'center' }}>
                    <Typography.Paragraph type="secondary">
                      Authentication code sent to <b>+{phoneData.code}&bull;&bull;&bull;&bull;&bull;&bull;&bull;{phoneData.phone?.substring(phoneData.phone.length - 4)}</b>
                    </Typography.Paragraph>
                    <OtpInput numInputs={5} value={otp} onChange={setOtp} isInputNum containerStyle={{ justifyContent: 'center' }} inputStyle={{
                      width: '2.7rem',
                      height: '2.7rem',
                      margin: '0 0.3rem 1rem 0',
                      borderRadius: '4px',
                      fontSize: '1.2rem',
                      background: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : undefined,
                      border: '1px solid rgba(0, 0, 0, 0.3)' }} />
                    {countdown ? <Typography.Paragraph type="secondary">Re-send in {countdown}s...</Typography.Paragraph> : <Typography.Paragraph>
                      <Button type="link" onClick={() => sendCode()}>Re-send code</Button>
                    </Typography.Paragraph>}
                  </Form.Item>
                  <Form.Item style={{ marginTop: '50px', textAlign: 'center' }} wrapperCol={{ span: 24 }}>
                    <Typography.Paragraph>
                      <Button disabled={otp?.length !== 5} shape="round" size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                      <Button type="link" onClick={() => {
                        setPhoneCodeHash(undefined)
                        setCurrentStep(currentStep - 1)
                      }}>Or, change phone number</Button>
                    </Typography.Paragraph>
                  </Form.Item>
                </>}

                {currentStep === 2 && <>
                  <Form.Item name="password" hidden={!needPassword}>
                    <Input.Password size="large" placeholder="password" />
                  </Form.Item>
                  <Form.Item style={{ marginTop: '50px', textAlign: 'center' }} wrapperCol={{ span: 24 }}>
                    <Button shape="round" size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
                  </Form.Item>
                </>}
              </Form>
            </>}
            {method === 'qrCode' && <>
              <Layout>
                <Layout.Content>
                  {!needPassword ? <>
                    <Row align="middle" gutter={24}>
                      <Col span={24} lg={12}>
                        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: '20px' }}>
                          {qrCode?.loginToken ? <QRCode size={165} value={`tg://login?token=${qrCode?.loginToken}`} /> : <Spin />}
                        </Typography.Paragraph>
                      </Col>
                      <Col span={24} lg={12}>
                        <Typography.Title level={5}>
                          Login to Telegram by QR Code
                        </Typography.Title>
                        <Typography.Paragraph>
                          <ol>
                            <li>Open Telegram on your phone</li>
                            <li>Go to <strong>Settings &gt; Devices &gt; Link Desktop Device</strong></li>
                            <li>Point your phone at this screen to confirm login</li>
                          </ol>
                          {/* <Collapse>
                            <Collapse.Panel key="1" header="How to log in">
                            </Collapse.Panel>
                          </Collapse> */}
                        </Typography.Paragraph>
                        <Typography.Paragraph style={{ textAlign: 'center' }}>
                          <Button type="link" onClick={() => setMethod('phoneNumber')}>Login by Phone Number</Button>
                        </Typography.Paragraph>
                      </Col>
                    </Row>
                    {/* <Row>
                      <Col lg={{ span: 14, offset: 5 }} md={{ span: 18, offset: 3 }} sm={{ span: 20, offset: 2 }} span={24}>
                      </Col>
                    </Row> */}
                  </> : <>
                    <Form form={formLoginQRCode} onFinish={loginByQrCode} layout="horizontal">
                      <Form.Item label="Password 2FA" name="password" hidden={!needPassword}>
                        <Input.Password placeholder="password" size="large" />
                      </Form.Item>
                      <Form.Item style={{ marginTop: '50px', textAlign: 'center' }} wrapperCol={{ span: 24 }}>
                        <Button shape="round" size="large" type="primary" htmlType="submit" loading={loadingLogin} icon={<LoginOutlined />}>Login</Button>
                      </Form.Item>
                    </Form>
                  </>}
                </Layout.Content>
              </Layout>
            </>}
          </Card>
        </Col>
      </Row>
    </Layout.Content>
  </>
}

export default Login