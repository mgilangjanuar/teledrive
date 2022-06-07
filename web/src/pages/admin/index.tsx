import { CloseCircleFilled, DeleteOutlined, ReloadOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Layout, notification, Popconfirm, Row, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import moment from 'moment'
import QueryString from 'qs'
import { FC, useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher, req } from '../../utils/Fetcher'

interface Props {
  me?: any,
  errorMe?: any
}

const Admin: FC<Props> = ({ me, errorMe }) => {
  const { data: dataConfig, mutate: refetchConfig } = useSWR('/config', fetcher)
  const [configForm] = Form.useForm()
  const [loading, setLoading] = useState<boolean>()
  const [selectedRows, setSelectedRows] = useState<any[]>()

  const PAGE_SIZE = 10
  const [params, setParams] = useState<Record<string, any>>()
  const { data: dataUsers, error, mutate: refetchUsers } = useSWR(params ? `/users?${QueryString.stringify(params)}` : null, fetcher)

  useEffect(() => {
    if (me?.user && me.user.role !== 'admin') {
      window.location.replace('/dashboard')
    }
  }, [me])

  useEffect(() => {
    if (errorMe) {
      window.localStorage.clear()
      window.location.replace('/login')
    }
  }, [errorMe])

  useEffect(() => {
    if (dataConfig?.config) {
      setLoading(false)
      configForm.setFieldsValue({
        ...dataConfig.config,
        invitation_code: dataConfig.config.invitation_code ? `${location.host}/login?code=${dataConfig.config.invitation_code || ''}` : null
      })
    }
  }, [dataConfig])

  useEffect(() => {
    if (dataUsers?.users) {
      dataUsers.users = dataUsers.users.map((user: any) => ({ ...user, key: user.id }))
    }
  }, [dataUsers])

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
      const { data } = await req.patch('/config', { config: {
        ...values,
        invitation_code: values.invitation_code || null
      } })
      refetchConfig()
      return notification.success({
        key: 'update',
        message: 'Updated',
        description: data.config.disable_signup ? 'Signup is disabled for everyone' : data.config.invitation_code ? 'Signup is enabled by invitation code' : 'Signup is enabled for everyone',
      })
    } catch (error: any) {
      return notification.error({
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </> } : {}
      })
    }
  }

  return <Layout>
    <Layout>
      <Layout.Content>
        <Row style={{ minHeight: '100vh', marginBottom: '100px', marginTop: '50px', padding: '0 12px' }}>
          <Col xxl={{ span: 16, offset: 4 }} xl={{ span: 18, offset: 3 }} lg={{ span: 20, offset: 2 }} md={{ span: 22, offset: 1 }} span={24}>
            <Typography.Title level={2}>Users Management</Typography.Title>
            <Form form={configForm} onFinish={updateConfig}>
              <Form.Item name="disable_signup" label="Disable Signup" valuePropName="checked">
                <Switch onChange={() => updateConfig()} />
              </Form.Item>
              {!dataConfig?.config.disable_signup && <Form.Item name="invitation_code" label="Invitation Code">
                {dataConfig?.config.invitation_code ? <Input.Search suffix={<Button size="small" type="text" icon={<CloseCircleFilled />} onClick={() => {
                  setLoading(true)
                  req.patch('/config', { config: { clear_invitation_code: true } }).then(({ data }) => {
                    refetchConfig()
                    notification.success({
                      key: 'update',
                      message: 'Updated',
                      description: data.config.disable_signup ? 'Signup is disabled for everyone' : data.config.invitation_code ? 'Signup is enabled by invitation code' : 'Signup is enabled for everyone',
                    })
                  })
                }} />} loading={loading} enterButton={<><ReloadOutlined /> Generate</>} onSearch={() => {
                  setLoading(true)
                  req.post('/config/resetInvitationCode').then(({ data }) => {
                    refetchConfig()
                    notification.success({
                      key: 'update',
                      message: 'Updated',
                      description: data.config.disable_signup ? 'Signup is disabled for everyone' : data.config.invitation_code ? 'Signup is enabled by invitation code' : 'Signup is enabled for everyone',
                    })
                  })
                }} /> : <Button loading={loading} type="primary" icon={<ReloadOutlined />} onClick={() => {
                  setLoading(true)
                  req.post('/config/resetInvitationCode').then(({ data }) => {
                    refetchConfig()
                    notification.success({
                      key: 'update',
                      message: 'Updated',
                      description: data.config.disable_signup ? 'Signup is disabled for everyone' : data.config.invitation_code ? 'Signup is enabled by invitation code' : 'Signup is enabled for everyone',
                    })
                  })
                }}>Generate</Button>}
              </Form.Item>}
            </Form>

            <div style={{ marginTop: '20px' }}>
              <Layout.Content>
                <Form.Item style={{ float: 'right', marginLeft: '15px' }}>
                  <Input.Search allowClear placeholder="Search by username or name..."  onSearch={val => {
                    setParams({
                      ...params,
                      offset: 0,
                      search: val || undefined
                    })
                  }} />
                </Form.Item>
                <Popconfirm title="Are you sure?" onConfirm={() => {
                  Promise.all((selectedRows || [])?.map(async (user: any) => {
                    try {
                      await req.delete(`/users/${user.id}`)
                    } catch (error) {
                      //
                    }
                  })).then(() => {
                    refetchUsers()
                    setSelectedRows(undefined)
                    notification.success({
                      message: `Delete ${selectedRows?.length} users`
                    })
                  })
                }}>
                  <Button disabled={!selectedRows?.length} danger style={{ float: 'right' }} icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
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
                  title: 'Role',
                  dataIndex: 'role',
                  key: 'role',
                  render: (value: string, record) => <>{<Tag color="blue">{record.role}</Tag>}</>
                },
                {
                  title: 'Username',
                  dataIndex: 'username',
                  key: 'username',
                  render: (value: string, record) => <>{value}</>
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
                {
                  title: '',
                  dataIndex: 'actions',
                  key: 'actions',
                  // responsive: ['md'],
                  render: (_, record) => <Space>
                    <Tooltip title={`Switch to ${record.role === 'admin' ? 'user' : 'admin'}`}>
                      <Button icon={<UserSwitchOutlined />} size="small" type="link" onClick={() => {
                        req.patch(`/users/${record.id}`, { user: { role: record.role === 'admin' ? null : 'admin' } }).then(() => {
                          notification.success({ message: `Switch ${record.username} to ${record.role === 'admin' ? 'user' : 'admin'}` })
                          refetchUsers()
                        }).catch(error => {
                          notification.error({
                            message: error?.response?.status || 'Something error',
                            ...error?.response?.data ? { description: <>
                              <Typography.Paragraph>
                                {error?.response?.data?.error || error.message || 'Something error'}
                              </Typography.Paragraph>
                              <Typography.Paragraph code>
                                {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
                              </Typography.Paragraph>
                            </> } : {}
                          })
                        })
                      }} />
                    </Tooltip>
                    <Popconfirm className="normal" title="Are you sure?" onConfirm={() => {
                      req.delete(`/users/${record.id}`).then(() => {
                        notification.success({ message: `Delete ${record.username} successfully!` })
                        refetchUsers()
                      }).catch(error => {
                        notification.error({
                          message: error?.response?.status || 'Something error',
                          ...error?.response?.data ? { description: <>
                            <Typography.Paragraph>
                              {error?.response?.data?.error || error.message || 'Something error'}
                            </Typography.Paragraph>
                            <Typography.Paragraph code>
                              {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
                            </Typography.Paragraph>
                          </> } : {}
                        })
                      })
                    }}>
                      <Button danger icon={<DeleteOutlined />} type="link" size="small" />
                    </Popconfirm>
                  </Space>
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
              }}
              rowSelection={{
                type: 'checkbox',
                onChange: (_, selectedRows) => {
                  setSelectedRows(selectedRows)
                }
              }} />
            </div>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  </Layout>
}

export default Admin
