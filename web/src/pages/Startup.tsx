import { RocketOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Layout, Row, Typography } from 'antd'
import React from 'react'
import { useEffect } from 'react'

const Startup: React.FC = () => {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({
      baseUrl: window.location.origin,
      apiUrl: localStorage.getItem('API_URL') || process.env.REACT_APP_API_URL || window.location.origin
    })
  }, [])

  const finish = () => {
    let { baseUrl } = form.getFieldsValue()
    if (!/^http/.test(baseUrl)) {
      baseUrl = `https://${baseUrl}`
    }
    // if (!/^http/.test(apiUrl)) {
    //   apiUrl = `https://${apiUrl}`
    // }
    localStorage.setItem('BASE_URL', baseUrl)
    // localStorage.setItem('API_URL', apiUrl)
    return window.location.replace(baseUrl)
  }

  return <Layout.Content className="container" style={{ minHeight: '87vh' }}>
    <Row style={{ paddingTop: '100px' }}>
      <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 8, offset: 8 }} lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={22} offset={1}>
        <Typography.Title level={2}>
          Welcome!
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: '14px' }}>
          We'll redirect you to your TeleDrive application.
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={finish}>
          <Form.Item label="Web URL" name="baseUrl">
            <Input />
          </Form.Item>
          {/* <Form.Item label="Server URL" name="apiUrl">
            <Input />
          </Form.Item> */}
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