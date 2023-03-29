import {
  ArrowLeftOutlined,
  BugOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  CrownOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExpandAltOutlined,
  ExperimentOutlined,
  FrownOutlined,
  InfoOutlined,
  ImportOutlined,
  LoginOutlined,
  LogoutOutlined,
  MobileOutlined,
  MonitorOutlined,
  ReloadOutlined,
  ExportOutlined,
  SkinOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Layout,
  List,
  Modal,
  notification,
  Popover,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
  Upload
} from 'antd'
import { useForm } from 'antd/es/form/Form'
import prettyBytes from 'pretty-bytes'
import pwaInstallHandler from 'pwa-install-handler'
import React, { useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { useHistory } from 'react-router-dom'
import useSWR from 'swr'
import { Api } from 'telegram'
import * as serviceWorkerRegistration from '../serviceWorkerRegistration'
import { VERSION } from '../utils/Constant'
import { apiUrl, fetcher, req } from '../utils/Fetcher'
import { telegramClient } from '../utils/Telegram'

interface Props {
  me?: any,
  mutate?: any,
  error?: any
}

const Settings: React.FC<Props> = ({ me, mutate, error }) => {
  const history = useHistory()
  const [expandableRows, setExpandableRows] = useState<boolean>()
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)
  const [removeConfirmation, setRemoveConfirmation] = useState<boolean>(false)
  const [expFeatures, setExpFeatures] = useState<boolean>(false)
  const [loadingChangeServer, setLoadingChangeServer] = useState<boolean>(false)
  const [loadingRemove, setLoadingRemove] = useState<boolean>(false)
  const [destroySession, setDestroySession] = useState<boolean>(false)
  const [reportBug, setReportBug] = useState<boolean>(false)
  const [pwa, setPwa] = useState<{ canInstall: boolean, install: () => Promise<boolean> }>()
  const [dc, setDc] = useState<string>()
  const [form] = useForm()
  const [formRemoval] = useForm()
  const { currentTheme } = useThemeSwitcher()
  const { data: dialogs } = useSWR('/dialogs?limit=75&offset=0', fetcher)
  const { data: stats } = useSWR('/files/stats', fetcher)

  const save = async (settings: any): Promise<void> => {
    try {
      await req.patch('/users/me/settings', { settings })
      notification.success({ message: 'Saved' })
      mutate()
    } catch ({ response }) {
      if ((response as any).status === 402) {
        return notification.error({
          message: 'Premium Feature',
          description: 'Please upgrade your plan for using this feature'
        })
      }
      return notification.error({ message: 'Something error. Please try again.' })
    }
  }

  useEffect(() => {
    if (me) {
      setExpandableRows(me.user?.settings?.expandable_rows)
    }
  }, [me])

  useEffect(() => {
    if (error) {
      return history.push('/login')
    }
  }, [error])

  useEffect(() => {
    pwaInstallHandler.addListener(canInstall => {
      setPwa({ canInstall, install: pwaInstallHandler.install })
    })
  }, [])

  useEffect(() => {
    if (window.location.host === 'ge.teledriveapp.com') {
      setDc('ge')
      localStorage.setItem('dc', 'ge')
    } else if (window.location.host === 'us.teledriveapp.com') {
      setDc('us')
      localStorage.setItem('dc', 'us')
    } else {
      setDc('sg')
      localStorage.setItem('dc', 'sg')
    }
  }, [])

  useEffect(() => {
    if (dc) {
      form.setFieldsValue({ change_server: dc })
    }
  }, [dc])

  useEffect(() => {
    if (me) {
      form.setFieldsValue({ saved_location: me?.user.settings?.saved_location || 'me' })
    }
  }, [me])

  const logout = async () => {
    await req.post('/auth/logout', {}, destroySession ? { params: { destroySession: 1 } } : undefined)
    window.localStorage.removeItem('experimental')
    return window.location.replace('/')
  }

  const remove = async () => {
    setLoadingRemove(true)
    const { agreement, reason } = formRemoval.getFieldsValue()
    try {
      await req.post('/users/me/delete', { agreement, reason })
      setRemoveConfirmation(false)
      setLoadingRemove(false)
      return window.location.replace('/')
    } catch (error: any) {
      setLoadingRemove(false)
      return notification.error({ message: 'Error', description: <>
        <Typography.Paragraph>
          {error?.response?.data?.error || error.message || 'Something error'}
        </Typography.Paragraph>
        <Typography.Paragraph code>
          {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
        </Typography.Paragraph>
      </> })
    }
  }

  const exportFilesData = async () => {
    setLoadingChangeServer(true)
    const { data } = await req.get('/files', { params: {
      full_properties: 1,
      sort: 'created_at',
      offset: 0,
      limit: 10
    } })
    const files = data?.files || []
    while (files?.length < data.length) {
      const { data } = await req.get('/files', { params: {
        full_properties: 1,
        sort: 'created_at',
        offset: 0,
        limit: 10
      } })
      files.push(...data.files)
    }

    const hiddenElement = document.createElement('a')

    hiddenElement.href = 'data:attachment/text,' + encodeURI(JSON.stringify(files) || '')
    hiddenElement.target = '_blank'
    hiddenElement.download = 'files.json'
    hiddenElement.click()

    setLoadingChangeServer(false)
  }

  const downloadLogs = async () => {
    const hiddenElement = document.createElement('a')

    hiddenElement.href = 'data:attachment/text,' + encodeURI(sessionStorage.getItem('requests') || '')
    hiddenElement.target = '_blank'
    hiddenElement.download = 'logs.json'
    hiddenElement.click()
  }

  const emailLink = () => `mailto:bug@teledriveapp.com?subject=TeleDrive%20-%20Bug%20Report&body=User%3A%20${decodeURIComponent(me?.user.username)}%0D%0AOrigin%3A%20${decodeURIComponent(window.location.origin)}%0D%0ADevice%3A%20${decodeURIComponent(navigator.userAgent)}%0D%0AProblem%3A%20%3CPlease%20describe%20your%20problem%20here%3E%0D%0AExpectation%3A%20%3CPlease%20describe%20your%20expectation%20here%3E`

  const buildPathDialog = (dialog: any) => {
    const peerType = dialog.isUser ? 'user' : dialog.isChannel ? 'channel' : 'chat'
    return `${peerType}/${dialog.entity?.id}/_${dialog.entity?.accessHash ? `/${dialog.entity?.accessHash}` : ''}`
  }

  return <>
    <Layout.Content>
      <Row style={{ margin: '50px 12px 100px' }}>
        <Col xxl={{ span: 8, offset: 8 }} xl={{ span: 10, offset: 7 }} lg={{ span: 12, offset: 6 }} md={{ span: 14, offset: 5 }} span={24}>
          <Typography.Title>
            Settings
          </Typography.Title>
          <Card loading={!me && !error} title={<Card.Meta avatar={<Avatar size="large" src={`${apiUrl}/users/me/photo`} />} title={<>{me?.user.name} {me?.user?.plan === 'premium' && <Popover placement="top" content={<Layout style={{ padding: '7px 13px' }}>Premium</Layout>}>
            <CrownOutlined />
          </Popover>}</>} description={me?.user.username} />} actions={[<Row style={{ marginTop: '15px' }}>
            <Col span={22} offset={1} md={{ span: 12, offset: 6 }}>
              <Typography.Paragraph style={{ textAlign: 'center' }}>
                <Button block icon={<LogoutOutlined />} danger shape="round"
                  onClick={() => setLogoutConfirmation(true)}>
                  Logout
                </Button>
              </Typography.Paragraph>
              <Typography.Paragraph style={{ textAlign: 'center' }}>
                <Button block icon={<ArrowLeftOutlined />} type="link"
                  onClick={() => history.push('/dashboard')}>
                  Back to Dashboard
                </Button>
              </Typography.Paragraph>
              <Typography.Paragraph style={{ textAlign: 'center' }} type="secondary">
                v{VERSION}
              </Typography.Paragraph>
            </Col>
          </Row>]}>
            <Form form={form} layout="horizontal" labelAlign="left" labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
              {stats?.stats && <List header="Stats Info" bordered={false}>
                <List.Item key="fileTotalSize">
                  <List.Item.Meta title="Uploaded Files" description={<Space direction="horizontal" align="center" style={{ marginTop: '13px' }}>
                    <Progress width={150} type="circle" status="active" format={() => <>
                      <Typography.Title level={3}>{prettyBytes(Number(stats.stats.totalUserFilesSize))}</Typography.Title>
                      <Typography.Paragraph style={{ fontSize: '12px' }} type="secondary">User Files Size</Typography.Paragraph>
                    </>} percent={Number((Number(stats.stats.totalUserFilesSize) / Number(stats.stats.totalFilesSize) * 100).toFixed(1))} />
                    <Progress width={150} type="circle" status="success" format={() => <>
                      <Typography.Title level={3}>{prettyBytes(Number(stats.stats.totalFilesSize))}</Typography.Title>
                      <Typography.Paragraph style={{ fontSize: '12px' }} type="secondary">Total Files Size</Typography.Paragraph>
                    </>} percent={100} />
                  </Space>} />
                </List.Item>

                <List.Item key="system">
                  <List.Item.Meta title="System Disk Usage" description={<Tooltip title={`Available ${prettyBytes(stats.stats.system.free)}/${prettyBytes(stats.stats.system.size)}`}>
                    <Progress status="active" percent={Number((stats.stats.system.free / stats.stats.system.size * 100).toFixed(1))} />
                  </Tooltip>} />
                </List.Item>

                <List.Item key="cached">
                  <List.Item.Meta title="Cached Total Size" description={<Tooltip title={prettyBytes(stats.stats.cachedSize)}>
                    <Progress status="active" percent={Number((stats.stats.cachedSize / stats.stats.system.size * 100).toFixed(1))} />
                  </Tooltip>} />
                </List.Item>
              </List>}
              <List header="Interface" bordered={false}>
                {pwa?.canInstall && <List.Item key="install" actions={[<Form.Item>
                  <Button shape="round" icon={<MobileOutlined />} onClick={pwa?.install}>Install</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><DownloadOutlined /><>Install App</></Space>} description="Install TeleDrive to your device" />
                </List.Item>}

                <List.Item key="expandable-rows" actions={[<Form.Item name="expandable_rows">
                  <Switch onChange={val => {
                    setExpandableRows(val)
                    save({ expandable_rows: val })
                  }} checked={expandableRows} defaultChecked={expandableRows} />
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><ExpandAltOutlined /><>Expandable Rows</></Space>} description="Show file details in row table" />
                </List.Item>

                <List.Item key="dark-mode" actions={[<Form.Item name="dark_mode">
                  <Switch onChange={(val: boolean) => save({ theme: val ? 'dark' : 'light' }).then(window.location.reload)} checked={currentTheme === 'dark'} defaultChecked={currentTheme === 'dark'} />
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><SkinOutlined /><>Dark Mode</></Space>} description="Join the dark side" />
                </List.Item>
              </List>

              <List header="Operational">
                {dialogs?.dialogs && <List.Item key="saved-location" actions={[<Form.Item name="saved_location">
                  <Select className="saved-location ghost" showSearch
                    filterOption={(input, option: any) => !option.children.toLowerCase().indexOf(input.toLowerCase())}
                    onChange={saved_location => save({ saved_location: saved_location === 'me' ? null : saved_location })}>
                    <Select.Option key="me" value="me">Saved Messages</Select.Option>
                    {dialogs?.dialogs.filter((d: any) => d.entity.id != me?.user.tg_id).map((dialog: any) => <Select.Option key={dialog.entity.id} value={buildPathDialog(dialog)}>{dialog.title}</Select.Option>)}
                  </Select>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><CloudUploadOutlined /><>Upload Destination</></Space>} description="Select where to save files" />
                </List.Item>}

                <List.Item key="check-for-updates" actions={[<Form.Item>
                  <Button shape="round" icon={<ReloadOutlined />} onClick={() => {
                    serviceWorkerRegistration.unregister();
                    (window.location as any).reload(true)
                  }}>Reload</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><SyncOutlined /><>Check Updates</></Space>} description="Reload to checking for updates" />
                </List.Item>

                <List.Item key="report-bugs" actions={[<Form.Item>
                  <Button shape="round" icon={<BugOutlined />} onClick={() => window.open('https://github.com/mgilangjanuar/teledrive/issues/new?assignees=&labels=bug&template=bug_report.md&title=', '_blank')}>Report</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><MonitorOutlined /><>Report Bug</></Space>} description="Send your activities for reporting" />
                </List.Item>
              </List>

              <List header="Data">
                <List.Item key="export" actions={[<Form.Item>
                  <Button shape="round" loading={loadingChangeServer} icon={<CloudDownloadOutlined />} onClick={exportFilesData}>Export</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><ExportOutlined /><>Save Data</></Space>} description="Export your files ref data as JSON" />
                </List.Item>

                <List.Item key="import" actions={[<Form.Item>
                  <Button shape="round" icon={<CloudUploadOutlined />}>
                    <Upload name="upload" fileList={[]} multiple={false} beforeUpload={file => {
                      const fileReader = new FileReader()
                      fileReader.readAsText(file, 'UTF-8')
                      fileReader.onload = async ({ target }) => {
                        await req.post('/files/filesSync', { files: JSON.parse(target?.result as string || '[]') })
                        notification.success({
                          message: 'Import Successfully',
                          description: 'Your files has been imported successfully but you need to reshare your files again to update your shared files',
                        })
                      }
                    }}>Import</Upload>
                  </Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><ImportOutlined /><>Import Data</></Space>} description="Import your files ref data" />
                </List.Item>
              </List>

              <List header="Danger Zone">
                <List.Item key="join-exp" actions={[<Form.Item>
                  <Button shape="round" icon={localStorage.getItem('experimental') && localStorage.getItem('session') ? <LogoutOutlined /> : <LoginOutlined />} onClick={async () => {
                    if (localStorage.getItem('experimental') && localStorage.getItem('session')) {
                      const client = await telegramClient.connect()
                      localStorage.removeItem('experimental')
                      localStorage.removeItem('session')
                      location.reload()
                      try {
                        await client.invoke(new Api.auth.LogOut())
                      } catch (error) {
                        // ignore
                      }
                    } else {
                      setExpFeatures(true)
                    }
                  }}>{localStorage.getItem('experimental') && localStorage.getItem('session') ? 'Revoke' : 'Join'}</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Space><ExperimentOutlined /><>Experimental</></Space>} description="Join to the experimental features" />
                </List.Item>

                <List.Item key="delete-account" actions={[<Form.Item>
                  <Button shape="round" danger type="primary" icon={<FrownOutlined />} onClick={() => setRemoveConfirmation(true)}>Delete</Button>
                </Form.Item>]}>
                  <List.Item.Meta title={<Typography.Text type="danger"><Space><DeleteOutlined /><>Delete Account</></Space></Typography.Text>} description="Delete your account permanently" />
                </List.Item>
              </List>

            </Form>
          </Card>
        </Col>
      </Row>
    </Layout.Content>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Logout Confirmation
    </Typography.Text>}
    visible={logoutConfirmation}
    onCancel={() => setLogoutConfirmation(false)}
    onOk={logout}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round' }}>
      <Typography.Paragraph>
        Are you sure to logout?
      </Typography.Paragraph>
      <Form.Item help="All files you share will not be able to download once you sign out">
        <Checkbox checked={destroySession} onChange={({ target }) => setDestroySession(target.checked)}>
          Also delete my active session
        </Checkbox>
      </Form.Item>
    </Modal>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> This action cannot be undone
    </Typography.Text>}
    visible={removeConfirmation}
    onCancel={() => setRemoveConfirmation(false)}
    onOk={formRemoval.submit}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round', loading: loadingRemove }}>
      <Form form={formRemoval} onFinish={remove} layout="vertical">
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please input your reason' }]}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="agreement" label={<Typography.Text>Please type <Typography.Text type="danger">permanently removed</Typography.Text> for your confirmation</Typography.Text>} rules={[{ required: true, message: 'Please input the confirmation' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>

    {/* <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Change Server Confirmation
    </Typography.Text>}
    visible={!!changeDCConfirmation}
    onCancel={() => setChangeDCConfirmation(undefined)}
    onOk={changeServer}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round', loading: loadingChangeServer }}>
      <Typography.Paragraph>
        Are you sure to change the server region to {changeDCConfirmation === 'ge' ? 'Frankfurt' : changeDCConfirmation === 'us' ? 'New York' : 'Singapore'}?
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        You'll be logged out and redirected to the new server. Please login again to that new server.
      </Typography.Paragraph>
    </Modal> */}

    <Modal title={<Typography.Text>
      <Typography.Text><InfoOutlined /></Typography.Text> Report Bugs
    </Typography.Text>}
    visible={reportBug}
    onCancel={() => setReportBug(false)}
    onOk={undefined}
    okText="Send Email"
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ type: 'primary', shape: 'round', href: emailLink() }}>
      <Typography.Paragraph>
        Please follow these instructions:
      </Typography.Paragraph>
      <ol>
        <li>
          Download <a onClick={downloadLogs}>your logs</a>
        </li>
        <li>
          Send an email to <a href={emailLink()}>bug@teledriveapp.com</a> with logs and additional screenshots in the attachment
        </li>
      </ol>
    </Modal>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Join Experimental
    </Typography.Text>}
    visible={expFeatures}
    onCancel={() => {
      localStorage.removeItem('experimental')
      setExpFeatures(false)
    }}
    onOk={() => {
      localStorage.setItem('experimental', 'true')
      setExpFeatures(false)
      window.open(`${window.location.origin}/login`, '_blank', 'location=yes,height=720,width=520,scrollbars=yes,status=yes,top=100,left=300')
    }}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ type: 'primary', shape: 'round' }}>
      <Typography.Paragraph>
        You will get this experimental features:
      </Typography.Paragraph>
      <ul>
        <li>
          <strong>Ultra Upload</strong>
          <Typography.Paragraph>
            Your files will directly upload to the Telegram servers and the speed will follow your internet connection.
          </Typography.Paragraph>
        </li>
        <li>
          <strong>Fast Download</strong>
          <Typography.Paragraph>
            Same like Ultra Upload, your files will be downloaded directly from the Telegram servers. But, it will have some limitations:
            <ul>
              <li>Only works with chrome-based browsers</li>
              <li>The max download size is 2GB for free users or follows your device memory</li>
            </ul>
          </Typography.Paragraph>
        </li>
      </ul>
      <Typography.Paragraph>
        Note. Those features may have bugs please report them to <a href={emailLink()}>bug@teledriveapp.com</a> and you can always revoke from experimental features anytime.
      </Typography.Paragraph>

      <Typography.Paragraph strong>
        You need to be logged in again to TeleDrive. Continue?
      </Typography.Paragraph>
    </Modal>
  </>
}

export default Settings
