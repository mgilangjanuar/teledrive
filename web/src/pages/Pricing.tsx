import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Card, Col, Layout, Row, Typography } from 'antd'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Pricing: React.FC = () => {
  const history = useHistory()
  const [annually, _setAnnually] = useState<boolean>(false)
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  const select = (plan: 'free' | 'premium' | 'professional' | 'donation') => {
    if (plan === 'free' || me?.user.plan === plan) {
      return history.push('/login')
    }

    return window.open('https://www.buymeacoffee.com/mgilangjanuar', '_blank')

    // TODO
    if (plan === 'premium') {
      if (annually) {
        return location.replace('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-4BD33083VE669652KMFECHVA')
      } else {
        return location.replace('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-28D75402Y57908242MFECFZI')
      }
    }
    if (plan === 'professional') {
      if (annually) {
        return location.replace('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-78C63659PP7746600MFECJNA')
      } else {
        return location.replace('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-4DM00548652517045MFECJCQ')
      }
    }
  }

  const Free = () => <Card color="warning" hoverable title="FREE" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select <ArrowRightOutlined /></Button>]} onClick={() => select('free')}>
    <Typography.Title style={{ textAlign: 'center', fontSize: '5em', fontWeight: 300 }}>
      <Typography.Text style={{ fontSize: '0.35em' }}>$ </Typography.Text>
      0
    </Typography.Title>
    <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
      <li><strong>Unlimited</strong> files size</li>
      <li><strong>Unlimited</strong> total files</li>
      <li><strong>All basic features</strong></li>
    </ul>
  </Card>

  const _Premium = () => <Card hoverable title="Premium" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select <ArrowRightOutlined /></Button>]} onClick={() => select('premium')}>
    <Typography.Title style={{ textAlign: 'center', fontSize: '5em', fontWeight: 300 }}>
      <Typography.Text style={{ fontSize: '0.35em' }}>$ </Typography.Text>
      {!annually ? '1' : '10'}
    </Typography.Title>
    <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
      <li><strong>Unlimited</strong> files size</li>
      <li><strong>Unlimited</strong> total files</li>
      <li>Up to <strong>400</strong> shared files</li>
      <li>Up to <strong>200</strong> public files</li>
      <li>Up to <strong>60</strong> sharing users</li>
    </ul>
  </Card>

  const _Professional = () => <Card hoverable title="Professional" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select <ArrowRightOutlined /></Button>]} onClick={() => select('professional')}>
    <Typography.Title style={{ textAlign: 'center', fontSize: '5em', fontWeight: 300 }}>
      <Typography.Text style={{ fontSize: '0.35em' }}>$ </Typography.Text>
      {!annually ? '10' : '110'}
    </Typography.Title>
    <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
      <li><strong>Unlimited</strong> files size</li>
      <li><strong>Unlimited</strong> total files</li>
      <li><strong>Unlimited</strong> shared files</li>
      <li><strong>Unlimited</strong> public files</li>
      <li><strong>Unlimited</strong> sharing users</li>
    </ul>
  </Card>

  const Donation = () => <div style={{ textAlign: 'center' }}>
    <Typography.Title level={2}>
      Support us to keep this service running 🚀
    </Typography.Title>
    <br />
    <Typography.Paragraph>
      <a href="https://www.buymeacoffee.com/mgilangjanuar" target="_blank">
        <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style={{ width: '100%', maxWidth: '170px' }} />
      </a>
    </Typography.Paragraph>
    <br />
    <Typography.Paragraph type="secondary">
      Feel free to <Link to="/contact?intent=sponsor">contact us</Link> if you have any questions or become a sponsor &mdash; or if you would like to help us in other ways.
    </Typography.Paragraph>
  </div>

  return <>
    <Navbar user={me} />
    <Layout.Content className="container" style={{ marginTop: '80px' }}>
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          {/* <Typography.Paragraph style={{ textAlign: 'center' }}>
            <Form.Item style={{ fontSize: '1.125rem' }}>
              Monthly &nbsp; <Switch checked={annually} onChange={setAnnually} /> &nbsp; Annually
            </Form.Item>
          </Typography.Paragraph> */}
          <Row gutter={48} align="middle">
            <Col lg={{ span: 8, offset: 4 }} span={24} style={{ marginBottom: '72px' }}>
              <Donation />
            </Col>
            <Col lg={{ span: 8 }} span={24} style={{ marginBottom: '72px' }}>
              <Free />
            </Col>
            {/* <Col lg={8} span={24} style={{ marginBottom: '72px' }}>
              {me?.user.plan === 'free' ? <Badge.Ribbon text="Current" children={<Free />} /> : <Free />}
            </Col>
            <Col lg={8} span={24} style={{ marginBottom: '72px' }}>
              {me?.user.plan === 'premium' ? <Badge.Ribbon text="Current" children={<Premium />} /> : <Badge.Ribbon color="red" text="Popular" children={<Premium />} />}
            </Col>
            <Col lg={8} span={24} style={{ marginBottom: '72px' }}>
              {me?.user.plan === 'professional' ? <Badge.Ribbon text="Current" children={<Professional />} /> : <Professional />}
            </Col> */}
          </Row>
          {/* <Row gutter={48} align="middle">
            <Col lg={{ span: 16, offset: 4 }} span={24} style={{ marginBottom: '72px' }}>
              <Typography.Paragraph style={{ textAlign: 'center' }} type="secondary">
                Please don't hesitate to <Link to="/contact">contact us</Link> if you have any questions or problems with the payment &mdash; or if you want to support us in another way.
              </Typography.Paragraph>
            </Col>
          </Row> */}
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Pricing