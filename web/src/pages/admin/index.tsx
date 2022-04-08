import { ReloadOutlined } from '@ant-design/icons'
import { Card, Col, Form, Input, Layout, notification, Row, Switch, Table, Tag, Typography } from 'antd'
import moment from 'moment'
import QueryString from 'qs'
import { FC, useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher, req } from '../../utils/Fetcher'

interface Props {
  me?: any
}

const Admin: FC<Props> = ({ me }) => {
  const { data: dataConfig, mutate: refetchConfig } = useSWR('/config', fetcher)
  const [configForm] = Form.useForm()

  const PAGE_SIZE = 10
  const [params, setParams] = useState<Record<string, any>>()
  const { data: dataUsers, error } = useSWR(params ? `/users?${QueryString.stringify(params)}` : null, fetcher)

  useEffect(() => {
    if (me?.user && me.user.role !== 'admin') {
      window.location.replace('/dashboard')
    }
  }, [me])

  useEffect(() => {
    if (dataConfig?.config) {
      configForm.setFieldsValue({
        ...dataConfig.config,
        invitation_code: `${location.host}/login?code=${dataConfig.config.invitation_code || ''}`
      })
    }
  }, [dataConfig])

  useEffect(() => {
    setParams({
      offset: 0,
      limit: PAGE_SIZE,
      sort: 'created_at:desc',
    })
  }, [])

  const updateConfig = async () => {
    const values = configForm.getFieldsValue()
    try {
      await req.patch('/config', { config: {
        ...values,
        invitation_code: values.invitation_code || null
      } })
      return notification.success({
        message: 'Updated'
      })
    } catch (error: any) {
      return notification.error({
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: error.response.data.error } : {}
      })
    }
  }

  return <Layout>
    <Layout>
      <Layout.Content>
        <Row style={{ minHeight: '100vh', marginBottom: '100px', marginTop: '50px', padding: '0 12px' }}>
          <Col xxl={{ span: 16, offset: 4 }} xl={{ span: 18, offset: 3 }} lg={{ span: 20, offset: 2 }} md={{ span: 22, offset: 1 }} span={24}>

            <Card>
              <Form form={configForm} onFinish={updateConfig}>
                <Form.Item name="disable_signup" label="Disable Signup" valuePropName="checked">
                  <Switch onChange={() => updateConfig()} />
                </Form.Item>
                <Form.Item name="invitation_code" label="Invitation Code">
                  <Input.Search enterButton={<><ReloadOutlined /> Reset</>} onSearch={() => {
                    req.post('/config/resetInvitationCode').then(refetchConfig)
                  }} />
                </Form.Item>
              </Form>
            </Card>

            <div style={{ marginTop: '20px' }}>
              <Layout.Content>
                <Form.Item style={{ float: 'right' }}>
                  <Input.Search allowClear placeholder="Search by username or name..."  onSearch={val => {
                    setParams({
                      ...params,
                      search: val || undefined
                    })
                  }} />
                </Form.Item>
                <Typography.Title level={2}>Users</Typography.Title>
              </Layout.Content>
              <Table loading={!dataUsers && !error} columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                  width: 350,
                  // responsive: ['md'],
                },
                {
                  title: 'Username',
                  dataIndex: 'username',
                  key: 'username',
                  render: (value: string, record) => <>{record.role && <Tag color="red">{record.role}</Tag>} {value}</>
                },
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                  // responsive: ['md'],
                },
                {
                  title: 'Registered At',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  width: 230,
                  sorter: true,
                  // responsive: ['md'],
                  render: (value: any) => moment(value).local().format('llll')
                },
              ]}
              dataSource={dataUsers?.users}
              scroll={{ x: 900 }}
              pagination={{
                total: dataUsers?.length,
                pageSize: PAGE_SIZE,
                showSizeChanger: false
              }}
              onChange={(page, _, sorter: any) => {
                setParams({
                  ...params,
                  offset: ((page.current || 1) - 1) * PAGE_SIZE,
                  sort: sorter?.order ? `${sorter?.field}:${sorter?.order === 'ascend' ? 'asc' : 'desc'}` : 'created_at:desc',
                })
              }} />
            </div>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  </Layout>
}

export default Admin