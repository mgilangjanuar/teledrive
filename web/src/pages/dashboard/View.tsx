import {
  AudioOutlined, DownloadOutlined, FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined, ShareAltOutlined, VideoCameraOutlined
} from '@ant-design/icons'
import { Button, Col, Descriptions, Layout, Result, Row, Space, Typography } from 'antd'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router'
import useSWR from 'swr'
import { apiUrl, fetcher } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  const [collapsed, setCollapsed] = useState<boolean>()
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

  if (error || data?.file.upload_progress) {
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
        <iframe style={{ height: '100%', width: '100%' }} src={`${apiUrl}/files/${match.params.id}?raw=1`} frameBorder={0}>Browser not compatible.</iframe>
        <div style={{ position: 'absolute', right: 16, top: 16, zIndex: 99999 }}>
          <Button type="primary" shape="circle" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
        </div>
      </Layout.Content>
      <Layout.Sider width={420} trigger={null} collapsedWidth={0} breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        {!collapsed && <Layout.Content className="container" style={{ color: '#fff', margin: '40px 10px' }}>
          <Descriptions title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> {data?.file.name}</Typography.Text>} contentStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} column={1}>
            <Descriptions.Item label="Size">{data?.file?.size && prettyBytes(data?.file?.size)}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).format('llll')}</Descriptions.Item>
          </Descriptions>
          <Space>
            <Button type="primary" loading={!data && !error} icon={<DownloadOutlined />} href={`${apiUrl}/files/${data?.file.id}?raw=1&dl=1`}>Download</Button>
            <Button loading={!data && !error} icon={<ShareAltOutlined />}>Share</Button>
          </Space>
        </Layout.Content>}
      </Layout.Sider>
    </Layout>
  </>
}

export default View