import { Button, Card, Col, Form, Layout, Row, Switch, Typography } from 'antd'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Pricing: React.FC = () => {
  const history = useHistory()
  const [annually, setAnnually] = useState<boolean>(false)
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  const select = (plan: 'free' | 'premium' | 'professional') => {
    if (plan === 'free' || me?.user.plan === plan) {
      return history.push('/dashboard')
    }
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

  return <>
    <Navbar user={me} />
    <Layout.Content className="container" style={{ marginTop: '50px' }}>
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph style={{ textAlign: 'center' }}>
            <Form.Item style={{ fontSize: '1.125rem' }}>
              Monthly &nbsp; <Switch checked={annually} onChange={setAnnually} /> &nbsp; Annually
            </Form.Item>
          </Typography.Paragraph>
          <Row gutter={48}>
            <Col lg={8} span={24} style={{ marginBottom: '24px' }}>
              <Card color="warning" hoverable title="FREE" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select</Button>]} onClick={() => select('free')}>
                <Typography.Title style={{ textAlign: 'center', fontSize: '5em', fontWeight: 300 }}>
                  <Typography.Text style={{ fontSize: '0.35em' }}>$ </Typography.Text>
                  0
                </Typography.Title>
                <ul style={{ textAlign: 'center', listStyleType: 'none' }}>
                  <li><strong>Unlimited</strong> files size</li>
                  <li><strong>Unlimited</strong> total files</li>
                  <li>Up to <strong>30</strong> shared files</li>
                  <li>Up to <strong>10</strong> public files</li>
                  <li>Up to <strong>5</strong> sharing users</li>
                </ul>
              </Card>
            </Col>
            <Col lg={8} span={24} style={{ marginBottom: '24px' }}>
              <Card hoverable title="Premium" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select</Button>]} onClick={() => select('premium')}>
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
            </Col>
            <Col lg={8} span={24} style={{ marginBottom: '24px' }}>
              <Card hoverable title="Professional" style={{ fontSize: '1rem' }} actions={[<Button block type="text" size="large">Select</Button>]} onClick={() => select('professional')}>
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
            </Col>
          </Row>
          <br />
          <Typography.Paragraph style={{ textAlign: 'center' }} type="secondary">
            Please don't hesitate to <Link to="/contact">contact us</Link> if you have any questions or problems with the payment.
          </Typography.Paragraph>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Pricing