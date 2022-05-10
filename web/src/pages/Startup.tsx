import { Col, Form, Input, Layout, Row, Typography } from 'antd'
import React from 'react'
import { useEffect } from 'react'

const Startup: React.FC = () => {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({
      apiUrl: `${window.location.origin}`,
    })
  }, [])

  return <Layout.Content className="container">
    <Row style={{ marginTop: '30px' }}>
      <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 8, offset: 8 }} lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={22} offset={1}>
        <Typography.Title level={2}>
          Welcome!
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
          We'll setup the TeleDrive Web on-premise variant for you first.
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item label="API Base URL" name="apiUrl">
            <Input />
          </Form.Item>
          <Form.Item label="API Key" name="apiKey">
            <Input />
          </Form.Item>
          <Form.Item label="API Hash" name="apiHash">
            <Input.Password />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  </Layout.Content>
}

export default Startup