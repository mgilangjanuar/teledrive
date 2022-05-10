import { RocketOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Layout, Row, Typography } from 'antd'
import React from 'react'

const Startup: React.FC = () => {
  const [form] = Form.useForm()

  const finish = () => {
    let value = form.getFieldValue('baseUrl')
    if (!/^http/.test(value)) {
      value = `https://${value}`
    }
    localStorage.setItem('BASE_URL', value)
    return window.location.replace(value)
  }

  return <Layout.Content className="container">
    <Row style={{ marginTop: '30px' }}>
      <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 8, offset: 8 }} lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={22} offset={1}>
        <Typography.Title level={2}>
          Welcome!
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
          We'll redirect you to your TeleDrive application.
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={finish}>
          <Form.Item label="Base URL" name="baseUrl">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<RocketOutlined />}>
              Start
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  </Layout.Content>
}

export default Startup