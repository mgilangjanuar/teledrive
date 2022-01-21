import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import {
  Button, Descriptions,
  Divider,
  Dropdown, Input,
  Layout, Menu, message, notification, Space, Typography
} from 'antd'
import * as clipboardy from 'clipboardy'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { useDebounce } from 'use-debounce/lib'
import { apiUrl, fetcher } from '../../../utils/Fetcher'
import Remove from '../../dashboard/components/Remove'
import Rename from '../../dashboard/components/Rename'
import Share from '../../dashboard/components/Share'
import Icon from './Icon'

interface Props {
  me: any,
  data: any,
  error: any,
  mutate: () => void,
  pageParams: { id: string }
}

const Viewer: React.FC<Props> = ({ data, me, error, mutate, pageParams }) => {
  const history = useHistory()
  const [collapsed, setCollapsed] = useState<boolean>()
  const { data: user } = useSWRImmutable(data?.file ? `/users/${data.file.user_id}` : null, fetcher)
  const { data: datafilesParts } = useSWR(data?.file.name && /\.part0*\d+$/.test(data.file.name) ? `/files?name.match=${encodeURIComponent('\.part0*[0-9]+$')}&name.like=${data.file.name.replace(/\.part0*\d+$/, '')}%&user_id=${data.file.user_id}${me?.user.id !== data.file.user_id ? '&shared=1' : ''}&parent_id${data.file.parent_id ? `=${data.file.parent_id}` : '.is=null'}` : null, fetcher)
  const [links, setLinks] = useState<{ raw: string, download: string, share: string }>()
  const [showContent] = useDebounce(collapsed, 250)
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()
  const [selectShare, setSelectShare] = useState<any>()
  const [fileRename, setFileRename] = useState<any>()
  const [selectDeleted, setSelectDeleted] = useState<any>()

  useEffect(() => {
    if (data?.file) {
      setLinks({
        raw: `${process.env.REACT_APP_API_URL || window.location.origin}/api/v1/files/${pageParams.id}?raw=1`,
        download: `${process.env.REACT_APP_API_URL || window.location.origin}/api/v1/files/${pageParams.id}?raw=1&dl=1`,
        share: `${window.location.origin}/view/${pageParams.id}`
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

  useEffect(() => {
    if (error?.status === 402) {
      notification.error({
        message: 'Premium Feature',
        description: error.data?.error || 'Upgrade your plan to view this file',
      })
      return history.replace('/pricing')
    }
  }, [error])

  const copy = (val: string) => {
    clipboardy.write(val)
    return message.info('Copied!')
  }

  const back = () => {
    // if (errorMe) {
    //   return history.push('/login')
    // }
    return history.goBack()
  }

  return <>
    <Layout style={{ minHeight: '100vh', overflow: 'hidden', background: '#2a2a2a', color: 'rgb(251,251,254)' }}>
      <Layout.Content>
        {data?.file.type === 'image' ? <img style={{ maxHeight: '100%', maxWidth: '100%', position: 'absolute', margin: 'auto', top: 0, right: 0, bottom: 0, left: 0, imageOrientation: 'from-image' }} src={links?.raw} /> : <iframe onLoad={(e: any) => {
          try {
            e.target.contentWindow.document.body.style.margin = 0
            e.target.contentWindow.document.body.style.color = 'rgb(251,251,254)'
          } catch (error) {
            // ignore
          }
        }} className="viewContent" style={{ height: '100%', width: '100%', position: 'absolute' }} src={links?.raw} frameBorder={0}>Browser not compatible.</iframe> }

      </Layout.Content>
      <Layout.Sider width={320} trigger={null} collapsedWidth={0} breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        <Layout.Content className="container" style={{ ...contentStyle || {}, color: '#fff', margin: '70px 10px' }}>
          <Descriptions
            title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> &nbsp; {data?.file.name.replace(/\.part0*\d+$/, '')}</Typography.Text>}
            contentStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }} column={1}>

            <Descriptions.Item label="Size">
              {datafilesParts?.length ? prettyBytes(datafilesParts?.files.reduce((res: number, file: any) => res + Number(file.size), 0)) + ` (${datafilesParts?.length} parts)` : data?.file.size && prettyBytes(Number(data?.file.size || 0))}
            </Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).local().format('lll')}</Descriptions.Item>
            {user?.user && <Descriptions.Item label="Uploaded By">
              <a href={`https://t.me/${user?.user.username}`} target="_blank">@{user?.user.username}</a>
            </Descriptions.Item>}
          </Descriptions>
          <Divider />
          <Descriptions colon={false} layout="vertical"
            labelStyle={{ color: '#fff' }} column={1}>
            <Descriptions.Item label={<><LinkOutlined /> &nbsp; Raw URL</>}>
              <Input.Search className="input-search-round" readOnly enterButton={<CopyOutlined />} value={links?.raw} onSearch={copy} />
            </Descriptions.Item>
            <Descriptions.Item label={<><DownloadOutlined /> &nbsp; Download URL</>}>
              <Input.Search className="input-search-round" readOnly enterButton={<CopyOutlined />} value={links?.download} onSearch={copy} />
            </Descriptions.Item>
            {data?.file.sharing_options?.length && <Descriptions.Item label={<><ShareAltOutlined /> &nbsp; Share URL</>}>
              <Input.Search className="input-search-round" readOnly enterButton={<CopyOutlined />} value={links?.share} onSearch={copy} />
            </Descriptions.Item>}
          </Descriptions>
        </Layout.Content>
      </Layout.Sider>
      <div style={{ position: 'absolute', right: 20, top: 30 }}>
        <Space direction="horizontal">
          {!showContent && <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={back} />}
          {!showContent && me?.user.id === data?.file.user_id ? <Dropdown placement="bottomCenter" trigger={['click']} overlay={<Menu>
            <Menu.Item key="rename" onClick={() => setFileRename(data?.file)} icon={<EditOutlined />}>Rename</Menu.Item>
            <Menu.Item key="share" onClick={() => setSelectShare({ action: 'share', row: data?.file })} icon={<ShareAltOutlined />}>Share</Menu.Item>
            <Menu.Item key="send" onClick={() => setSelectShare({ action: 'forward', row: data?.file })} icon={<ArrowRightOutlined />}>Send to</Menu.Item>
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
  </>
}

export default Viewer