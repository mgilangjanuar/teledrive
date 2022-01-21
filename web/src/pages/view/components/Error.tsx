import { Button, Col, Layout, Result, Row } from 'antd'
import React from 'react'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'

const Error: React.FC<{ error: any, me: any }> = ({ error, me }) => {
  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container" style={{ minHeight: '80vh', paddingTop: '12vh' }}>
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          {error ? <Result status={[403, 404, 500].includes(error?.status) ? error?.status : 500} title={error?.data?.error || 'Something error'} extra={<Button type="primary" href="/">Home</Button>} />
            : <Result status={404} title="File not found" extra={<Button type="primary" href="/">Home</Button>} />}
        </Col>
      </Row>
    </Layout.Content>
    <Footer me={me} />
  </>
}

export default Error