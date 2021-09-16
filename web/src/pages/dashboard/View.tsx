import {
  ArrowLeftOutlined, AudioOutlined, DownloadOutlined, FileImageOutlined,
  FileOutlined, FilePdfOutlined,
  FolderOpenOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, VideoCameraOutlined
} from '@ant-design/icons'
import { Button, Col, Descriptions, Layout, Result, Row, Space, Typography } from 'antd'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import useSWR from 'swr'
import { apiUrl, fetcher } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  const [collapsed, setCollapsed] = useState<boolean>()
  const history = useHistory()
  const { data, error } = useSWR(match.params.id ? `/files/${match.params.id}` : null, fetcher)

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
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content className="container">
        <iframe onLoad={(e: any) => {
          try {
            e.target.contentWindow.document.body.style.height = '100%'
            e.target.contentWindow.document.body.style.display = 'flex'
            e.target.contentWindow.document.body.style.justifyContent = 'center'
            e.target.contentWindow.document.body.style.alignItems = 'center'
          } catch (error) {
            // ignore
          }
        }} className="viewContent" style={{ height: '100%', width: '100%' }} src={`${apiUrl}/files/${match.params.id}?raw=1`} frameBorder={0}>Browser not compatible.</iframe>
      </Layout.Content>
      <Layout.Sider width={420} trigger={null} collapsedWidth={0} breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        {!collapsed && <Layout.Content className="container" style={{ color: '#fff', margin: '20px 10px' }}>
          <Descriptions title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> {data?.file.name}</Typography.Text>} contentStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} column={1}>
            <Descriptions.Item label="Size">{data?.file?.size && prettyBytes(data?.file?.size)}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).format('llll')}</Descriptions.Item>
          </Descriptions>
        </Layout.Content>}
      </Layout.Sider>
      <div style={{ position: 'absolute', right: 20, bottom: 50 }}>
        <Space direction="vertical">
          <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={history.goBack} />
          <Button shape="circle" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Button type="primary" shape="circle" icon={<DownloadOutlined />} onClick={() => location.replace(`${apiUrl}/files/${data?.file.id}?raw=1&dl=1`)} />
        </Space>
      </div>
    </Layout>
  </>
}

export default View