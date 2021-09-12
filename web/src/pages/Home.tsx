import { CloudOutlined, DollarCircleOutlined, RightOutlined, SecurityScanOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Layout, message, Row, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React from 'react'
import { Follow } from 'react-twitter-widgets'
import { req } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Home: React.FC = () => {
  const [form] = useForm()

  const submit = async () => {
    const { email } = form.getFieldsValue()
    try {
      await req.post('/waitings', { email })
      form.resetFields()
      return message.success(`${email} successfully joined in the waiting list.`)
    } catch (error) {
      return message.error('Something error! Please try again a few moments.')
    }
  }

  return <>
    <Navbar />
    <Layout.Content>
      <Row align="middle" style={{ marginTop: '50px' }}>
        <Col lg={{ span: 10, offset: 2 }} md={{ span: 20, offset: 2 }} span={22} offset={1}>
          <Layout.Content>
            <Typography.Title level={1}>
              <Typography.Text style={{ fontWeight: 'lighter' }}>
                The Free Unlimited
              </Typography.Text>
              <br style={{ 'lineHeight': 1.5 }} />
              <Typography.Text style={{ background: '#0088CC', color: '#fff', padding: '4px 53px 7px 10px' }}>
                Cloud Storage
              </Typography.Text>
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: '30px' }}>
              The open source project to give you what you deserve.
              Using the <strong>Telegram API</strong> as your unlimited storage.
              So, you can upload as many as you want without any limit.
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Follow username="teledriveapp" />
            </Typography.Paragraph>
            <Layout.Content style={{ marginTop: '40px' }}>
              <Form form={form} layout="inline" onFinish={submit}>
                <Form.Item name="email" rules={[{ required: true, message: 'Please input your email' }]}>
                  <Input size="large" type="email" placeholder="Email" />
                </Form.Item>
                <Form.Item>
                  <Button shape="round" size="large" htmlType="submit" style={{ background: '#0088CC', color: '#fff' }}>
                    Get Early Access <RightOutlined />
                  </Button>
                </Form.Item>
              </Form>
            </Layout.Content>
          </Layout.Content>
        </Col>
        <Col lg={{ span: 10 }} span={24} style={{ textAlign: 'center' }}>
          <Layout.Content>
            <img style={{ width: '100%', maxWidth: '560px' }} src="./Illustration.svg" alt="Illustration.svg" />
          </Layout.Content>
        </Col>
      </Row>

      <Row style={{ marginTop: '50px', padding: '50px 0', background: '#f0f2f5' }}>
        <Col span={20} offset={2}>
          <Typography.Title level={2}>Want to know why we can do this?</Typography.Title>
          <Typography.Paragraph>
            In Aug 20, 2021, <a href="https://telegram.org/">Telegram</a> said that they give an unlimited cloud storage for free via their official <a href="https://twitter.com/telegram/status/1428703364737507332" target="_blank">Twitter account</a>.
            So, we're using their API to build TeleDrive 🚀
          </Typography.Paragraph>
          <Typography.Paragraph>
            <a href="https://twitter.com/telegram/status/1428703364737507332" target="_blank">
              <img style={{ width: '100%', maxWidth: '620px' }} src="https://drive.google.com/uc?id=1o2HnKglEF0-cvtNmQqWZicJnSCSmnoEr" />
            </a>
          </Typography.Paragraph>
        </Col>
      </Row>

      <Row style={{ marginTop: '50px', padding: '50px 0' }}>
        <Col span={20} offset={2}>
          <Row gutter={72}>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <DollarCircleOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Free</Typography.Title>
              <Typography.Paragraph>
                Seriously, you can use this service FREE with no limit. Everyone can even do a self-hosted for TeleDrive.
              </Typography.Paragraph>
            </Col>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <CloudOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Unlimited</Typography.Title>
              <Typography.Paragraph>
                Because Telegram promises us to give the unlimited cloud storage from their <a href="https://twitter.com/telegram/status/1428703364737507332" target="_blank">tweet</a>. So, here we go 🚀
              </Typography.Paragraph>
            </Col>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <SecurityScanOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Secure</Typography.Title>
              <Typography.Paragraph>
                You can control the sharing options for every file that you upload on TeleDrive. By default, it's private for you.
              </Typography.Paragraph>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Home