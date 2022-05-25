import { Button, Col, Layout, Result, Row } from 'antd'
import React from 'react'

const Error: React.FC<{ error: any, me: any }> = ({ error }) => {
  return <>
    <Layout.Content className="container" style={{ minHeight: '100vh', paddingTop: '12vh' }}>
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          {error ? <Result status={[403, 404, 500].includes(error?.status) ? error?.status : 500} title={error?.status === 400 ? 'Unauthorized' : error?.data?.error || 'Something error'} extra={<Button type="primary" href={window.location.href}>Reload</Button>} />
            : <Result status={404} title="File not found" extra={<Button type="primary" href={window.location.href}>Reload</Button>} />}
        </Col>
      </Row>
    </Layout.Content>
  </>
}

export default Error