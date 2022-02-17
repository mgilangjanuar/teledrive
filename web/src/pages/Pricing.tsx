import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Form, Input, Layout, notification, Row, Switch, Tooltip, Typography } from 'antd'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { req } from '../utils/Fetcher'

interface Props {
  me?: any
}

const Pricing: React.FC<Props> = ({ me }) => {
  const history = useHistory()
  const [loading, setLoading] = useState<boolean>()
  const [email, setEmail] = useState<string>()
  const [isIDR, setIsIDR] = useState<boolean>(false)

  const select = (plan: 'free' | 'premium' | 'professional' | 'donation', provider?: string, emailVal?: string) => {
    if (plan === 'free' || me?.user.plan === plan) {
      return history.push('/login')
    }
    if (plan === 'premium') {
      if (me) {
        if (isIDR && !email && !emailVal) {
          return notification.error({ message: 'Please fill your email' })
        }
        setLoading(true)
        return req.post('/subscriptions', { email: emailVal || email }, provider ? { params: { provider } } : {})
          .then(({ data }) => window.location.replace(data.link))
          .catch(() => setLoading(false))
      }
      return history.push('/login')
    }

    return window.open('https://www.buymeacoffee.com/mgilangjanuar', '_blank')
  }

  const Free = () => <Card color="warning" hoverable title="FREE" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large" onClick={() => select('free')}>Select <ArrowRightOutlined /></Button>]}>
    <Typography.Title style={{ textAlign: 'center', fontSize: '4.8em', fontWeight: 300 }}>
      <Typography.Text style={{ fontSize: '0.35em' }}>{isIDR ? 'Rp' : '$'}</Typography.Text>
      0
    </Typography.Title>
    <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
      <li><strong>Unlimited</strong> total files</li>
      <li><strong>Unlimited</strong> total files size</li>
      <li><strong>1.5GB</strong> daily bandwidth</li>
      <li><strong>2GB</strong> upload &amp; download max</li>
      <li><strong>All basic features</strong></li>
    </ul>
  </Card>

  const Premium = () => <Card color="warning" hoverable title="Premium" style={{ fontSize: '1rem' }} actions={[
    <>
      {isIDR && <Form.Item style={{ margin: '15px 20px' }}>
        <Tooltip placement="topLeft" title="This is required for sending the invoice to your email">
          <Input.Search disabled type="email" size="large" placeholder="Type your email here..." required defaultValue={email}
            onBlur={({ target }) => setEmail(target.value)} enterButton={<ArrowRightOutlined />}
            onSearch={val => select('premium', 'midtrans', val)} />
        </Tooltip>
      </Form.Item>}
      <Button disabled block loading={loading} type="text" size="large" onClick={() => isIDR ? select('premium', 'midtrans') : select('premium')}>
        {isIDR ? <>Powered by<strong> Midtrans</strong></> : <>Subscribe with<strong> PayPal</strong></>} <ArrowRightOutlined />
      </Button>
    </>
  ]}>
    <Typography.Title style={{ textAlign: 'center', fontSize: '4.8em', fontWeight: 300 }}>
      {isIDR ? <>
        <Typography.Text style={{ fontSize: '0.35em' }}>Rp</Typography.Text>144k
      </> : <>
        <Typography.Text style={{ fontSize: '0.35em' }}>$</Typography.Text>10
      </>}
      <Typography.Text style={{ fontSize: '0.35em' }}>/year</Typography.Text>
    </Typography.Title>
    <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
      <li><strong>Unlimited</strong> total files</li>
      <li><strong>Unlimited</strong> total files size</li>
      <li><strong>Unlimited</strong> bandwidth</li>
      <li><strong>Unlimited</strong> upload &amp; download</li>
      <li><strong>All features</strong></li>
    </ul>
  </Card>

  const Donation = () => <div style={{ textAlign: 'center' }}>
    <Typography.Title level={2}>
      Support us to keep this service running
    </Typography.Title>
    <br />
    <Typography.Paragraph>
      <a href="https://opencollective.com/teledrive/contribute" target="_blank">
        <img src="https://opencollective.com/teledrive/contribute/button@2x.png?color=blue" style={{ width: '100%', maxWidth: '300px' }} />
      </a>
    </Typography.Paragraph>
    <Typography.Paragraph>
      or, via <a href="https://paypal.me/mgilangjanuar" target="_blank">PayPal</a>.
    </Typography.Paragraph>
    <br />
    <Typography.Paragraph type="secondary">
      Feel free to <Link to="/contact?intent=sponsor">contact us</Link> if you have any questions or become a sponsor &mdash; or if you would like to help us in other ways.
    </Typography.Paragraph>
    {/* <script src="https://opencollective.com/teledrive/banner.js"></script> */}
  </div>

  return <>
    <Layout.Content className="container" style={{ marginTop: '80px' }}>
      <Row>
        <Col xxl={{ span: 14, offset: 5 }} xl={{ span: 16, offset: 4 }} lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: '70px' }}>
            USD &#127482;&#127480; &nbsp; <Switch onChange={e => setIsIDR(e)} /> &nbsp; IDR &#127470;&#127465;
          </Typography.Title>
          <Row gutter={24} align="middle">
            <Col lg={{ span: 10, offset: 2 }} span={24} style={{ marginBottom: '35px' }}>
              <Free />
            </Col>
            <Col lg={{ span: 10 }} span={24} style={{ marginBottom: '35px' }}>
              <Premium />
            </Col>
          </Row>
          <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: '100px' }}>
            <Link to="/contact?intent=help">Contact us</Link> if you need help with the payment.
          </Typography.Paragraph>
          <Divider />
          <Row>
            <Col lg={{ span: 10, offset: 7 }} span={24}>
              <Donation />
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout.Content>
  </>
}

export default Pricing
