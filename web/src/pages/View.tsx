import {
  ArrowLeftOutlined,
  AudioOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import {
  Button, Col,
  Descriptions,
  Divider,
  Dropdown, Input,
  Layout, Menu, message,
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
import Messaging from './dashboard/components/Messaging'
import Remove from './dashboard/components/Remove'
import Rename from './dashboard/components/Rename'
import Share from './dashboard/components/Share'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  const [collapsed, setCollapsed] = useState<boolean>()
  const history = useHistory()
  const { data, error, mutate } = useSWR(`/files/${match.params.id}`, fetcher)
  const { data: me, error: errorMe } = useSWRImmutable('/users/me', fetcher)
  const { data: user } = useSWRImmutable(data?.file ? `/users/${data.file.user_id}` : null, fetcher)
  const [links, setLinks] = useState<{ raw: string, download: string, share: string }>()
  const [showContent] = useDebounce(collapsed, 250)
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()
  const [selectShare, setSelectShare] = useState<any>()
  const [fileRename, setFileRename] = useState<any>()
  const [selectDeleted, setSelectDeleted] = useState<any>()
  const [collapsedMessaging, setCollapsedMessaging] = useState<boolean>(true)

  useEffect(() => {
    if (data?.file) {
      setLinks({
        raw: `${apiUrl}/files/${match.params.id}?raw=1`,
        download: `${apiUrl}/files/${match.params.id}?raw=1&dl=1`,
        share: `${window.location.origin}/view/${match.params.id}`
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
      return history.push('/login')
    }

    return history.goBack()
    // if (me?.user.id === data?.file.user_id) {
    //   return history.replace(`/dashboard${data?.file.parent_id ? `?parent=${data?.file.parent_id}` : ''}`)
    // } else {
    //   return history.replace('/dashboard/shared')
    // }
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
    <Layout style={{ minHeight: '100vh', overflow: 'hidden', background: '#2a2a2a', color: 'rgb(251,251,254)' }}>
      <Layout.Content>
        {data?.file.type === 'image' ? <img style={{ maxHeight: '100%', maxWidth: '100%', position: 'absolute', margin: 'auto', top: 0, right: 0, bottom: 0, left: 0, imageOrientation: 'from-image' }} src={links?.raw} /> : <iframe onLoad={(e: any) => {
          try {
            e.target.contentWindow.document.body.style.margin = 0
            e.target.contentWindow.document.body.style.color = 'rgb(251,251,254)'

            // e.target.contentWindow.document.img.style.textAlign = 'center'
            // e.target.contentWindow.document.img.style.position = 'absolute'
            // e.target.contentWindow.document.img.style.margin = 'auto'
            // e.target.contentWindow.document.img.style.top = 0
            // e.target.contentWindow.document.img.style.right = 0
            // e.target.contentWindow.document.img.style.bottom = 0
            // e.target.contentWindow.document.img.style.left = 0

            // e.target.contentWindow.document.body.style.height = '100%'
            // e.target.contentWindow.document.body.style.display = 'flex'
            // e.target.contentWindow.document.body.style.justifyContent = 'center'
            // e.target.contentWindow.document.body.style.alignItems = 'center'
          } catch (error) {
            // ignore
          }
        }} className="viewContent" style={{ height: '100%', width: '100%', position: 'absolute' }} src={links?.raw} frameBorder={0}>Browser not compatible.</iframe> }

      </Layout.Content>
      <Layout.Sider width={340} trigger={null} collapsedWidth={0} breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        <Layout.Content className="container" style={{ ...contentStyle || {}, color: '#fff', margin: '70px 10px' }}>
          <Descriptions
            title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> &nbsp; {data?.file.name}</Typography.Text>}
            contentStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }} column={1}>

            <Descriptions.Item label="Size">{data?.file?.size && prettyBytes(data?.file?.size)}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).local().format('llll')}</Descriptions.Item>
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
          {!showContent && me?.user.id === data?.file.user_id ? <Dropdown placement="bottomCenter" trigger={['click']} overlay={<Menu>
            <Menu.Item key="rename" onClick={() => setFileRename(data?.file)} icon={<EditOutlined />}>Rename</Menu.Item>
            <Menu.Item key="share" onClick={() => setSelectShare(data?.file)} icon={<ShareAltOutlined />}>Share</Menu.Item>
            <Menu.Item key="download" onClick={() => location.replace(`${apiUrl}/files/${data?.file.id}?raw=1&dl=1`)} icon={<DownloadOutlined />}>Download</Menu.Item>
            <Menu.Item key="remove" danger onClick={() => setSelectDeleted([data?.file])} icon={<DeleteOutlined />}>Delete</Menu.Item>
          </Menu>}>
            <Button shape="circle" icon={<EllipsisOutlined />} />
          </Dropdown> : <Button shape="circle" onClick={() => location.replace(`${apiUrl}/files/${data?.file.id}?raw=1&dl=1`)} icon={<DownloadOutlined />} />}
          <Button shape="circle" icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
        </Space>
      </div>
    </Layout>

    <Rename
      dataSelect={[fileRename, setFileRename]}
      onFinish={mutate} />

    <Remove
      dataSelect={[selectDeleted, setSelectDeleted]}
      onFinish={() => {
        if (me?.user.id === data?.file.user_id) {
          return history.replace(`/dashboard${data?.file.parent_id ? `?parent=${data?.file.parent_id}` : ''}`)
        } else {
          return history.replace('/dashboard/shared')
        }
      }} />

    <Share
      me={me}
      dataSelect={[selectShare, setSelectShare]}
      onFinish={mutate} />

    {me && <Messaging me={me} collapsed={collapsedMessaging} setCollapsed={setCollapsedMessaging} />}
  </>
}

export default View