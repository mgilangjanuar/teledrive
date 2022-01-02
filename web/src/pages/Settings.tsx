import { Col, Form, Layout, Row, Switch, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

const Settings: React.FC = () => {
  const history = useHistory()
  const [form] = useForm()
  const { data: me } = useSWRImmutable('/users/me', fetcher)

  useEffect(() => {
    if (!me?.user) {
      return history.replace('/login')
    }
  }, [me])

  useEffect(() => {
    if (me) {
      form.setFieldsValue(me.settings || {})
    }
  }, [me])

  return <>
    <Navbar page="settings" user={me} />
    <Layout.Content className="container">
      <Row style={{ marginTop: '30px' }}>
        <Col lg={{ span: 10, offset: 7 }} md={{ span: 14, offset: 5 }} span={20} offset={2}>
          <Typography.Title level={2}>
            Settings
          </Typography.Title>
          <Form form={form} layout="vertical">
            <Form.Item label="Expandable Rows" name="expandable_rows">
              <Switch />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Layout.Content>
    <Footer />
  </>
}

export default Settings