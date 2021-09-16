import { Col, Layout, Row } from 'antd'
import React from 'react'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Pricing: React.FC = () => {
  return <>
    <Navbar />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Pricing