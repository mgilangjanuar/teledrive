import {
  ArrowLeftOutlined,
  AudioOutlined,
  BranchesOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  HomeOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,
  ShareAltOutlined,
  TeamOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import {
  Button, Col,
  Descriptions,
  Divider,
  Dropdown, Input,
  Layout, Menu, message,
  Modal,
  notification,
  Result,
  Row,
  Space,
  Spin,
  Table,
  TablePaginationConfig,
  Typography
} from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import * as clipboardy from 'clipboardy'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { useDebounce } from 'use-debounce/lib'
import { apiUrl, fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Breadcrumb from './dashboard/components/Breadcrumb'
import Remove from './dashboard/components/Remove'
import Rename from './dashboard/components/Rename'
import Share from './dashboard/components/Share'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps> = ({ match }) => {
  const { data: me } = useSWRImmutable('/users/me', fetcher)
  const [collapsed, setCollapsed] = useState<boolean>()
  const history = useHistory()
  const { data, error, mutate } = useSWR(`/files/${match.params.id}`, fetcher)
  const { data: user } = useSWRImmutable(data?.file ? `/users/${data.file.user_id}` : null, fetcher)
  const [links, setLinks] = useState<{ raw: string, download: string, share: string }>()
  const [showContent] = useDebounce(collapsed, 250)
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()
  const [selectShare, setSelectShare] = useState<any>()
  const [fileRename, setFileRename] = useState<any>()
  const [selectDeleted, setSelectDeleted] = useState<any>()

  const [dataChanges, setDataChanges] = useState<{
    pagination?: TablePaginationConfig,
    filters?: Record<string, FilterValue | null>,
    sorter?: SorterResult<any> | SorterResult<any>[]
  }>()
  const [parent, setParent] = useState<Record<string, any> | null>()
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([data?.file || { id: null, name: <><HomeOutlined /></> }])
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [keyword, setKeyword] = useState<string>()
  const [filesData, setFilesData] = useState<any>()
  const [params, setParams] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [showDetails, setShowDetails] = useState<any>()
  const [popup, setPopup] = useState<{ visible: boolean, x?: number, y?: number, row?: any }>()
  const { data: files, mutate: _refetch } = useSWR(data?.file.type === 'folder' && data?.file.sharing_options?.includes('*') && params ? `/files?${qs.stringify(params)}` : null, fetcher, { onSuccess: files => {
    setLoading(false)
    if (files?.files) {
      let newData: any[] = []
      if (!params?.offset || !dataChanges?.pagination?.current || dataChanges?.pagination?.current === 1) {
        newData = files.files.map((file: any) => ({ ...file, key: file.id }))
      } else {
        newData = [
          ...filesData.map(row => files.files.find((file: any) => file.id === row.id) || row).map(file => ({ ...file, key: file.id })),
          ...files.files.map((file: any) => ({ ...file, key: file.id }))
        ].reduce((res, row) => [
          ...res, !res.filter(Boolean).find((r: any) => r.id === row.id) ? row : null
        ], []).filter(Boolean)
      }

      setFilesData(newData)
    }
  } })

  useEffect(() => {
    if (data?.file.type === 'folder') {
      if (me?.user) {
        if (data.file.user_id === me.user.id) {
          return history.replace(`/dashboard?parent=${data.file.id}`)
        } else if (data.file.shared_options?.includes(me.user.id)) {
          return history.replace(`/dashboard/shared?parent=${data.file.id}`)
        }
      } else if (data.file.sharing_options?.includes('*')) {
        setParent(data.file)
        // setBreadcrumbs([...breadcrumbs, data.file])
        // const searchParams = new URLSearchParams(window.location.search)
        // searchParams.set('parent', data.file.id)
        // return history.replace(`${location.pathname}?${searchParams.toString()}`)
      }
    }
  }, [data, me])

  useEffect(() => {
    if (data?.file) {
      setLinks({
        raw: `${process.env.REACT_APP_API_URL || window.location.origin}/api/v1/files/${match.params.id}?raw=1`,
        download: `${process.env.REACT_APP_API_URL || window.location.origin}/api/v1/files/${match.params.id}?raw=1&dl=1`,
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

  const PAGE_SIZE = 10

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setLoading(true)
    setParams({
      // ...parent?.id ? { parent_id: parent.link_id || parent.id } : { 'parent_id.is': 'null' },
      parent_id: parent?.link_id || parent?.id || data?.file.id,
      ...keyword ? { 'name.ilike': `'%${keyword}%'` } : {},
      shared: 1,
      'parent_id.is': undefined,
      limit: PAGE_SIZE,
      offset: pagination?.current === 1 || actions?.action || keyword && params?.offset ? 0 : filesData?.length,
      ...Object.keys(filters || {})?.reduce((res, key: string) => {
        if (!filters) return res
        if (key === 'type' && filters[key]?.length) {
          return { ...res, [`${key}.in`]: `(${filters[key]?.map(val => `'${val}'`).join(',')})` }
        }
        return { ...res, [key]: filters[key]?.[0] }
      }, {}),
      ...(sorter as SorterResult<any>)?.order ? {
        sort: `${(sorter as SorterResult<any>).column?.dataIndex}:${(sorter as SorterResult<any>).order?.replace(/end$/gi, '')}`
      } : { sort: 'created_at:desc' },
      t: new Date().getTime()
    })
  }

  const onChange = async (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setDataChanges({ pagination, filters, sorter })
    fetch(pagination, filters, sorter, actions)
  }

  const onRowClick = (row: any) => {
    if (row.type === 'folder') {
      setParent(row)
      setBreadcrumbs([...breadcrumbs, row])

      const searchParams = new URLSearchParams(window.location.search)
      searchParams.set('parent', row.id)
      return history.push(`${location.pathname}?${searchParams.toString()}`)
    } else {
      return history.push(`/view/${row.id}`)
    }
  }

  useEffect(() => {
    const nextPage = () => {
      setScrollTop(document.body.scrollTop)
    }
    nextPage()
    document.body.addEventListener('scroll', nextPage)
  }, [])

  useEffect(() => {
    const footer = document.querySelector('.ant-layout-footer')
    if (scrollTop >= document.body.scrollHeight - document.body.clientHeight - (footer?.clientHeight || 0) && files?.files.length >= PAGE_SIZE) {
      onChange({ ...dataChanges?.pagination, current: (dataChanges?.pagination?.current || 1) + 1 }, dataChanges?.filters, dataChanges?.sorter)
    }
  }, [scrollTop])

  useEffect(() => {
    if (parent !== undefined || keyword !== undefined) {
      onChange({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      setScrollTop(0)
    }
  }, [keyword, parent])

  const ContextMenu = () => {
    const baseProps = {
      style: { margin: 0 }
    }
    if (!popup?.visible) return <></>
    if (popup?.row) {
      return <Menu style={{ zIndex: 1, position: 'absolute', left: `${popup?.x}px`, top: `${popup?.y}px`, boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' }}>
        <Menu.Item {...baseProps}
          icon={<ProfileOutlined />}
          key="details"
          onClick={() => setShowDetails(popup?.row)}>Details</Menu.Item>
      </Menu>
    }
    return <></>
  }

  return <>{!data && !error ? <Layout style={{ marginTop: '45vh' }}><Spin /></Layout> : error && [403, 404, 500].includes(error?.status) || data && data.file.upload_progress !== null ? <>
    <Navbar user={me?.user} />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          {error ? <Result status={error?.status || 500} title={error?.data.error || 'Something error'} extra={<Button type="primary" href="/">Home</Button>} />
            : <Result status={404} title="File not found" extra={<Button type="primary" href="/">Home</Button>} />}
        </Col>
      </Row>
    </Layout.Content>
    <Footer me={me} />
  </> : data?.file.type === 'folder' && data?.file.sharing_options?.includes('*') ? <Layout>
    <Layout.Content>
      <Navbar user={me?.user} />
      <Row style={{ minHeight: '80vh', marginBottom: '100px', padding: '20px 12px 0' }}>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph style={{ float: 'left' }}>
            <Breadcrumb dataSource={[breadcrumbs, setBreadcrumbs]} dataParent={[parent, setParent]} />
          </Typography.Paragraph>
          <Typography.Paragraph style={{ textAlign: 'right' }}>
            <Input.Search style={{ width: '210px' }} className="input-search-round" placeholder="Search..." enterButton onSearch={setKeyword} allowClear />
          </Typography.Paragraph>
          <Table
            className="tableFiles"
            loading={!data || loading}
            showSorterTooltip={false}
            dataSource={filesData}
            columns={[
              {
                title: 'File',
                dataIndex: 'name',
                key: 'type',
                sorter: true,
                sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.dataIndex === 'name' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
                filters: [
                  {
                    text: 'Folder',
                    value: 'folder'
                  },
                  {
                    text: 'Image',
                    value: 'image'
                  },
                  {
                    text: 'Video',
                    value: 'video'
                  },
                  {
                    text: 'Audio',
                    value: 'audio'
                  },
                  {
                    text: 'Document',
                    value: 'document'
                  },
                  {
                    text: 'Unknown',
                    value: 'unknown'
                  }
                ],
                ellipsis: true,
                onCell: (row: any) => ({
                  onClick: () => onRowClick(row)
                }),
                render: (_: any, row: any) => {
                  let type
                  if (row.sharing_options?.includes('*')) {
                    type = <GlobalOutlined />
                  } else if (row.sharing_options?.length) {
                    type = <TeamOutlined />
                  }

                  return <>
                    {row.link_id ? <BranchesOutlined /> : '' } {type} <Icon type={row.type} /> {row.name}
                  </>
                }
              },
              {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
                sorter: true,
                sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.key === 'size' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
                responsive: ['md'],
                width: 100,
                align: 'center',
                render: (value: any) => value ? prettyBytes(Number(value)) : '-'
              },
              {
                title: 'Uploaded At',
                dataIndex: 'uploaded_at',
                key: 'uploaded_at',
                sorter: true,
                sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.key === 'uploaded_at' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
                responsive: ['md'],
                width: 250,
                align: 'center',
                render: (value: any, row: any) => row.upload_progress !== null ? <>Uploading {Number((row.upload_progress * 100).toFixed(2))}%</> : moment(value).local().format('llll')
              }
            ]}
            onChange={onChange}
            pagination={false}
            scroll={{ x: 330 }}
            onRow={(row, index) => ({
              index,
              onContextMenu: e => {
                // if (tab !== 'mine') return

                e.preventDefault()
                if (!popup?.visible) {
                  document.addEventListener('click', function onClickOutside() {
                    setPopup({ visible: false })
                    document.removeEventListener('click', onClickOutside)
                  })
                }
                // const parent = document.querySelector('.ant-col-24.ant-col-md-20.ant-col-md-offset-2')
                setPopup({
                  row,
                  visible: true,
                  x: e.clientX,
                  y: e.clientY
                  // x: e.clientX - (parent?.getBoundingClientRect().left || 0),
                  // y: e.clientY - (parent?.getBoundingClientRect().top || 0)
                })
              }
            })} />
        </Col>
      </Row>
    </Layout.Content>
    <Footer me={me} />
    <ContextMenu />
    <Modal title={<><Icon type={showDetails?.type} /> {showDetails?.name}</>}
      visible={Boolean(showDetails)}
      onCancel={() => setShowDetails(undefined)}
      okText="View"
      onOk={() => onRowClick(showDetails)}
      cancelButtonProps={{ shape: 'round' }}
      okButtonProps={{ shape: 'round' }}>
      <Descriptions column={1}>
        <Descriptions.Item label="Size">{showDetails?.size && prettyBytes(Number(showDetails?.size || 0))}</Descriptions.Item>
        <Descriptions.Item label="Uploaded At">{moment(showDetails?.uploaded_at).local().format('llll')}</Descriptions.Item>
      </Descriptions>
    </Modal>
  </Layout> : <>
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
            title={<Typography.Text style={{ color: '#fff' }}><Icon type={data?.file.type} /> &nbsp; {data?.file.name}</Typography.Text>}
            contentStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }} column={1}>

            <Descriptions.Item label="Size">{data?.file?.size && prettyBytes(Number(data?.file?.size))}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{moment(data?.file.uploaded_at).local().format('lll')}</Descriptions.Item>
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
  </>}</>
}

export default View