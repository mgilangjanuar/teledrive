import { ArrowRightOutlined, LoginOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Layout, notification, Row, Spin, Steps, Typography } from 'antd'
import CountryPhoneInput, { ConfigProvider } from 'antd-country-phone-input'
import { useForm } from 'antd/lib/form/Form'
import base64url from 'base64url'
import JSCookie from 'js-cookie'
import React, { useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import OtpInput from 'react-otp-input'
import QRCode from 'react-qr-code'
import { useHistory } from 'react-router'
import useSWRImmutable from 'swr/immutable'
import { Api } from 'telegram'
import { generateRandomBytes } from 'telegram/Helpers'
import { computeCheck } from 'telegram/Password'
import en from 'world_countries_lists/data/countries/en/world.json'
import { fetcher, req } from '../utils/Fetcher'
import { anonymousTelegramClient, telegramClient } from '../utils/Telegram'

interface Props {
  me?: any
}

const Login: React.FC<Props> = ({ me }) => {
  const history = useHistory()
  const [formLogin] = useForm()
  const [formLoginQRCode] = useForm()
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
  const [qrCode, setQrCode] = useState<{ loginToken: string, accessToken?: string, session?: string }>()
  const { currentTheme } = useThemeSwitcher()

  // useEffect(() => {
  //   // init config
  //   req.get('/config')
  // }, [])

  const sendCode = async (phoneNumber?: string) => {
    phoneNumber = phoneNumber || phoneData.phone ? `+${phoneData.code}${phoneData.phone}` : ''
    if (!phoneNumber) {
      return notification.error({
        message: 'Error',
        description: 'Please input your valid phone number with country code'
      })
    }

    const fetch = async (phoneCodeHash?: string) => {
      let data: any = null
      if (localStorage.getItem('experimental')) {
        const client = await anonymousTelegramClient.connect()
        if (phoneCodeHash) {
          const { phoneCodeHash: newPhoneCodeHash, timeout } = await client.invoke(new Api.auth.ResendCode({
            phoneNumber, phoneCodeHash }))
          const session = client.session.save() as any
          localStorage.setItem('session', session)
          data = { phoneCodeHash: newPhoneCodeHash, timeout }
        } else {
          const { phoneCodeHash, timeout } = await client.invoke(new Api.auth.SendCode({
            apiId: Number(process.env.REACT_APP_TG_API_ID),
            apiHash: process.env.REACT_APP_TG_API_HASH,
            phoneNumber,
            settings: new Api.CodeSettings({
              allowFlashcall: true,
              currentNumber: true,
              allowAppHash: true,
            })
          }))
          const session = client.session.save() as any
          localStorage.setItem('session', session)
          data = { phoneCodeHash, timeout }
        }
      } else {
        const invitationCode = location.search.replace('?code=', '')
        const resp = phoneCodeHash ? await req.post('/auth/reSendCode', { phoneNumber, phoneCodeHash, invitationCode }) : await req.post('/auth/sendCode', { phoneNumber, invitationCode })
        data = resp.data
      }
      setPhoneCodeHash(data.phoneCodeHash)
      setCountdown(data.timeout)
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
        description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </>
      })
      if (error?.status === 400 || error?.response?.status === 400) {
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
      let data: any = null
      if (localStorage.getItem('experimental')) {
        const client = await anonymousTelegramClient.connect()
        let signIn: any
        if (password) {
          const dataLogin = await client.invoke(new Api.account.GetPassword())
          dataLogin.newAlgo['salt1'] = Buffer.concat([dataLogin.newAlgo['salt1'], generateRandomBytes(32)])
          signIn = await client.invoke(new Api.auth.CheckPassword({ password: await computeCheck(dataLogin, password) }))
        } else {
          signIn = await client.invoke(new Api.auth.SignIn({ phoneNumber, phoneCode, phoneCodeHash }))
        }
        const userAuth = signIn['user']
        if (!userAuth) {
          return notification.error({ message: 'User not found/authorized' })
        }
        const session = client.session.save() as any
        localStorage.setItem('session', session)
        try {
          const resp = await req.get('/users/me')
          data = resp?.data
        } catch (error) {
          // ignore
        }
      } else {
        const invitationCode = location.search.replace('?code=', '')
        const resp = await req.post('/auth/login', { ...needPassword ? { password, invitationCode } : { phoneNumber, phoneCode, phoneCodeHash, invitationCode } })
        data = resp.data
      }
      try {
        // req.post('/users/me/paymentSync')
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
      if (localStorage.getItem('experimental')) {
        window.close()
      } else {
        history.replace('/dashboard')
      }
    } catch (error: any) {
      setLoadingLogin(false)
      let errorMessage = error?.errorMessage
      if (error.response && error.response.data) {
        errorMessage = error.response.data.details?.errorMessage
      }
      if (errorMessage === 'SESSION_PASSWORD_NEEDED') {
        notification.info({
          message: 'Info',
          description: 'Please input your 2FA password'
        })
        setCurrentStep(currentStep + 1)
        return setNeedPassword(true)
      }
      return notification.error({
        message: 'Error',
        description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </>
      })
    }
  }

  const _qrCodeSignIn = async (password?: string) => {
    let data: any = null
    const sessionString = qrCode?.session
    if (password && sessionString) {
      const client = await telegramClient.connect(sessionString || '')
      const passwordData = await client.invoke(new Api.account.GetPassword())

      passwordData.newAlgo['salt1'] = Buffer.concat([passwordData.newAlgo['salt1'], generateRandomBytes(32)])
      const signIn = await client.invoke(new Api.auth.CheckPassword({
        password: await computeCheck(passwordData, password)
      }))

      const userAuth = signIn['user']
      if (!userAuth) {
        throw { status: 400, body: { error: 'User not found/authorized' } }
      }

      const session = client.session.save() as any
      localStorage.setItem('session', session)
      const resp = await req.get('/users/me')
      data = resp.data
    } else {
      // handle the second call for export login token, result case: success, need to migrate to other dc, or 2fa
      const client = await telegramClient.connect(sessionString || '')
      try {
        const dataLogin = await client.invoke(new Api.auth.ExportLoginToken({
          apiId: Number(process.env.REACT_APP_TG_API_ID),
          apiHash: process.env.REACT_APP_TG_API_HASH,
          exceptIds: []
        }))

        // handle to switch dc
        if (dataLogin instanceof Api.auth.LoginTokenMigrateTo) {
          await client._switchDC(dataLogin.dcId)
          const result = await client.invoke(new Api.auth.ImportLoginToken({
            token: dataLogin.token
          }))

          // result import login token success
          if (result instanceof Api.auth.LoginTokenSuccess && result.authorization instanceof Api.auth.Authorization) {
            const userAuth = result.authorization.user
            if (userAuth) {
              const session = client.session.save() as any
              localStorage.setItem('session', session)
              const resp = await req.get('/users/me')
              data = resp.data
            } else {
              // ignore
            }
          } else {
            // ignore
          }

          // handle if success
        } else if (dataLogin instanceof Api.auth.LoginTokenSuccess && (dataLogin as any).authorization instanceof Api.auth.Authorization) {
          const userAuth = (dataLogin as any).authorization.user
          if (userAuth) {
            const session = client.session.save() as any
            localStorage.setItem('session', session)
            const resp = await req.get('/users/me')
            data = resp.data
          } else {
            // ignore
          }
        }
        data = {
          session: client.session.save() as any,
          loginToken: base64url(dataLogin['token'])
        }

      } catch (error: any) {
        // handle if need 2fa password
        if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
          error.session = client.session.save() as any
        }
        throw error
      }
    }
    return data
  }

  const loginByQrCode = async () => {
    try {
      const { password } = formLoginQRCode.getFieldsValue()
      setLoadingLogin(true)
      const invitationCode = location.search.replace('?code=', '')
      const data = localStorage.getItem('experimental') ? await _qrCodeSignIn(password) : (await req.post('/auth/qrCodeSignIn', { password, session: qrCode?.session, invitationCode }))?.data
      try {
        // req.post('/users/me/paymentSync')
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
      if (localStorage.getItem('experimental')) {
        window.close()
      } else {
        history.replace('/dashboard')
      }
    } catch (error: any) {
      setLoadingLogin(false)
      return notification.error({
        message: 'Error',
        description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </>
      })
    }
  }

  useEffect(() => {
    if (JSCookie.get('authorization') && me?.user) {
      if (!localStorage.getItem('experimental')) {
        return history.replace('/dashboard')
      }
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
        if (localStorage.getItem('experimental')) {
          anonymousTelegramClient.connect()
            .then(client => {
              client.invoke(new Api.auth.ExportLoginToken({
                apiId: Number(process.env.REACT_APP_TG_API_ID),
                apiHash: process.env.REACT_APP_TG_API_HASH,
                exceptIds: []
              }))
                .then(data => {
                  const session = client.session.save() as any
                  localStorage.setItem('session', session)
                  setQrCode({
                    session: client.session.save() as any,
                    loginToken: base64url(data['token'])
                  })
                })
            })
        } else {
          req.get('/auth/qrCode').then(({ data }) => {
            setQrCode(data)
          })
        }
      }
    } else {
      setQrCode(undefined)
    }
  }, [method])

  useEffect(() => {
    if (qrCode && method === 'qrCode' && !needPassword) {
      const timeout = setTimeout(() => {
        if (method === 'qrCode' && !needPassword && qrCode?.loginToken) {
          new Promise((resolve, reject) => {
            if (localStorage.getItem('experimental')) {
              _qrCodeSignIn().then(resolve).catch(reject)
            } else {
              const invitationCode = location.search.replace('?code=', '')
              req.post('/auth/qrCodeSignIn', { invitationCode }, { headers: {
                'Authorization': `Bearer ${qrCode.accessToken}`
              } }).then(({ data }) => resolve(data)).catch(reject)
            }
          }).then((data: any) => {
            // console.log(data)
            if (data?.user) {
              clearTimeout(timeout)
              try {
                // req.post('/users/me/paymentSync')
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
                        duration: null,
                        message: 'Files data synced successfully',
                        description: 'Reload your browser to see the migrated files.',
                        btn: <Button type="primary" href={window.location.href}>Reload</Button>
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
              if (localStorage.getItem('experimental')) {
                window.close()
              } else {
                history.replace('/dashboard')
              }
            } else {
              setQrCode(data)
            }
          }).catch((error: any) => {
            let errorMessage = error?.errorMessage
            if (error.response && error.response.data) {
              errorMessage = error.response.data.details?.errorMessage
            }
            if (errorMessage === 'SESSION_PASSWORD_NEEDED') {
              notification.info({
                message: 'Info',
                description: 'Please input your 2FA password'
              })

              let session = error.session
              if (!session && error.response && error.response.data) {
                session = error.response.data.details?.session
              }
              setQrCode({ ...qrCode, session })
              setNeedPassword(true)
            } else {
              // notification.error({
              //   message: 'Error',
              //   description: response?.data?.error || 'Something error'
              // })
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
                    <OtpInput numInputs={5} value={otp as string || ''} onChange={setOtp} isInputNum containerStyle={{ justifyContent: 'center' }} inputStyle={{
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
                        <Typography.Paragraph style={{ textAlign: 'center', marginBottom: '20px', background: '#fff', padding: '20px' }}>
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