import {
  ArrowLeftOutlined,
  AudioOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  VideoCameraOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Descriptions,
  Divider,
  Input,
  Layout,
  message,
  Result,
  Row,
  Space,
  Typography
} from 'antd'
import * as clipboardy from 'clipboardy'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { useDebounce } from 'use-debounce/lib'
import { apiUrl, fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  const [collapsed, setCollapsed] = useState<boolean>()
  const history = useHistory()
  const { data, error } = useSWR(`/files/${match.params.id}`, fetcher)
  const { data: me, error: errorMe } = useSWRImmutable('/users/me', fetcher)
  const { data: user } = useSWRImmutable(data?.file ? `/users/${data.file.user_id}` : null, fetcher)
  const [links, setLinks] = useState<{ raw: string, download: string, share: string }>()
  const [showContent] = useDebounce(collapsed, 250)
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()

  useEffect(() => {
    if (data?.file) {
      setLinks({
        raw: `${apiUrl}/files/${match.params.id}?raw=1`,
        download: `${apiUrl}/files/${match.params.id}?raw=1&dl=1`,
        share: `${window.location.origin}/view/shared/${match.params.id}`
      })
    }
  }, [data])

  useEffect(() => {
    if (collapsed) {
      setContentStyle({ display: 'none' })
    }
  }, [collapsed])

  useEffect(() => {
    if (!showContent) {
      setContentStyle(undefined)
    }
  }, [showContent])

  const copy = (val: string) => {
    clipboardy.write(val)
    return message.info('Copied!')
  }

  const back = () => {
    if (errorMe) {
      return history.push('/')
    }
    if (me?.user.id === data?.file.user_id) {
      return history.push('/dashboard')
    } else {
      return history.push('/dashboard/shared')
    }
  }

  const Icon = ({ type }: { type: string }) => {
    if (type === 'image') {
      return <FileImageOutlined />
    } else if (type === 'video') {
      return <VideoCameraOutlined />
    } else if (type === 'document') {
      return <FilePdfOutlined />
    } else if (type === 'folder') {
      return <FolderOpenOutlined />
    } else if (type === 'audio') {
      return <AudioOutlined />
    } else {
      return <FileOutlined />
    }
  }

  if (error || data && data.file.upload_progress !== null) {
    return <>
      <Navbar />
      <Layout.Content className="container">
        <Row>
          <Col md={{ span: 20, offset: 2 }} span={24}>
            {error ? <Result status={error?.status || 500} title={error?.data.error || 'Something error'} extra={<Button type="primary" href="/">Home</Button>} />
              : <Result status={404} title="File not found" extra={<Button type="primary" href="/">Home</Button>} />}
          </Col>
        </Row>
      </Layout.Content>
      <Footer />
    </>
  }

  return <>
    <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Layout.Content>
        <iframe onLoad={(e: any) => {
          try {
            e.target.contentWindow.document.body.style.height = '100%'
            e.target.contentWindow.document.body.style.display = 'flex'
            e.target.contentWindow.document.body.style.justifyContent = 'center'
            e.target.contentWindow.document.body.style.alignItems = 'center'
          } catch (error) {
            // ignore
          }
        }} className="viewContent" style={{ height: '100%', width: '100%' }} src={links?.raw} frameBorder={0}>Browser not compatible.</iframe>
      </Layout.Content>
      <Layout.Sider width={340} trigger={null} collapsedWidth={0} breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        <Layout.Content className="container" style={{ ...contentStyle || {}, color: '#fff', margin: '70px 10px' }}>
          <Descriptions
            title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> &nbsp; {data?.file.name}</Typography.Text>}
            contentStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }} column={1}>

            <Descriptions.Item label="Size">{data?.file?.size && prettyBytes(data?.file?.size)}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).format('llll')}</Descriptions.Item>
            {user?.user && <Descriptions.Item label="Uploaded By">
              <a href={`https://t.me/${user?.user.username}`} target="_blank">@{user?.user.username}</a>
            </Descriptions.Item>}
          </Descriptions>
          <Divider />
          <Descriptions colon={false} layout="vertical"
            labelStyle={{ color: '#fff' }} column={1}>
            <Descriptions.Item label={<><LinkOutlined /> &nbsp; Raw URL</>}>
              <Input.Search readOnly enterButton={<CopyOutlined />} value={links?.raw} onSearch={copy} />
            </Descriptions.Item>
            <Descriptions.Item label={<><DownloadOutlined /> &nbsp; Download URL</>}>
              <Input.Search readOnly enterButton={<CopyOutlined />} value={links?.download} onSearch={copy} />
            </Descriptions.Item>
            {data?.file.sharing_options?.length && <Descriptions.Item label={<><ShareAltOutlined /> &nbsp; Share URL</>}>
              <Input.Search readOnly enterButton={<CopyOutlined />} value={links?.share} onSearch={copy} />
            </Descriptions.Item>}
          </Descriptions>
        </Layout.Content>
      </Layout.Sider>
      <div style={{ position: 'absolute', right: 20, top: 30 }}>
        <Space direction="horizontal">
          {!showContent && <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={back} />}
          <Button shape="circle" icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          {!showContent && <Button type="primary" shape="circle" icon={<DownloadOutlined />} onClick={() => location.replace(`${apiUrl}/files/${data?.file.id}?raw=1&dl=1`)} />}
        </Space>
      </div>
    </Layout>
  </>
}

export default View