import {
  AudioOutlined, DeleteOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined, InboxOutlined, SyncOutlined,
  UploadOutlined,
  VideoCameraOutlined, WarningOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Drawer,
  Dropdown,
  Input,
  Layout, Menu, message, Modal, Popconfirm, Row,
  Space,
  Table,
  TablePaginationConfig,
  Tooltip,
  Typography,
  Upload
} from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWR, { mutate } from 'swr'
import { apiUrl, fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const PAGE_SIZE = 10

  const location = useHistory()
  const [parent, _setParent] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [selectDeleted, setSelectDeleted] = useState<any[]>([])
  const [keyword, setKeyword] = useState<string>()
  const [params, setParams] = useState<any>()
  const [upload, setUpload] = useState<boolean>()
  const [loadingSync, setLoadingSync] = useState<boolean>()

  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)
  const { data: files, error: errorFiles } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher)
  const { data: filesUpload, error: errorFilesUpload } = useSWR(
    upload ? '/files?upload_progress.is=not null&sort=created_at:desc' : null,
    fetcher, { refreshInterval: 3000 })

  useEffect(() => {
    if (errorMe) {
      location.replace('/')
    }
  }, [errorMe])

  useEffect(() => {
    fetch({}, {}, { column: { key: 'uploaded_at' }, order: 'descend' })
  }, [])

  useEffect(() => {
    if (files?.files) {
      setData(files.files.map((file: any) => ({ ...file, key: file.id })))
    }
  }, [files])

  useEffect(() => {
    if (!upload) {
      mutate(`/files?${qs.stringify(params)}`)
    }
  }, [upload])

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[]) => {
    setParams({
      parent_id: parent || undefined,
      take: PAGE_SIZE,
      skip: ((pagination?.current || 1) - 1) * PAGE_SIZE,
      ...Object.keys(filters || {})?.reduce((res, key: string) => {
        return { ...res, ...filters?.[key]?.[0] !== undefined ? { [key]: filters[key]?.[0] } : {} }
      }, {}),
      ...(sorter as SorterResult<any>)?.order ? { sort: `${(sorter as SorterResult<any>).column?.key}:${(sorter as SorterResult<any>).order?.replace(/end$/gi, '')}` } : {},
      ...keyword ? { 'name.ilike': `'%${keyword}%'` } : {}
    })
  }

  const change = async (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[], _: TableCurrentDataSource<any>) => {
    setDataChanges({ pagination, filters, sorter })
    fetch(pagination, filters, sorter)
  }

  const sync = async () => {
    setLoadingSync(true)
    await req.post('/files/sync')
    await new Promise(res => setTimeout(res, 2000))
    mutate(`/files?${qs.stringify(params)}`)
    setLoadingSync(false)
  }

  const search = async (value: string) => {
    setKeyword(value)
    setParams({
      parent_id: parent || undefined,
      take: PAGE_SIZE,
      skip: 0,
      'name.ilike': `'%${value}%'`
    })
  }

  const remove = async (ids: string[]) => {
    await Promise.all(ids.map(async id => await req.delete(`/files/${id}`)))
    mutate(`/files?${qs.stringify(params)}`)
    setSelected([])
    setSelectDeleted([])
  }

  const columns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (value: any, row: any) => {
        let component
        if (row.type === 'image') {
          component = <FileImageOutlined />
        } else if (row.type === 'video') {
          component = <VideoCameraOutlined />
        } else if (row.type === 'document') {
          component = <FilePdfOutlined />
        } else if (row.type === 'folder') {
          component = <FolderOpenOutlined />
        } else if (row.type === 'audio') {
          component = <AudioOutlined />
        } else {
          component = <FileOutlined />
        }
        return <Button type="link" size="small">{component} {value}</Button>
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      responsive: ['md'],
      width: 100,
      align: 'center',
      render: (value: any) => prettyBytes(value)
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      responsive: ['md'],
      width: 220,
      align: 'center',
      render: (value: any, row: any) => row.upload_progress ? <>Uploading {Number((row.upload_progress * 100).toFixed(2))}%</> : moment(value).format('llll')
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_: any, row: any) => row.upload_progress ? <Popconfirm placement="topRight" onConfirm={() => remove([row.id])} title={`Are you sure to cancel ${row.name}?`}>
        <Button size="small" type="link">Cancel</Button>
      </Popconfirm> : <Dropdown placement="bottomRight" overlay={<Menu>
        <Menu.Item key="download">Download</Menu.Item>
        <Menu.Item key="rename">Rename</Menu.Item>
        <Menu.SubMenu key="submenu" title="Move to">

        </Menu.SubMenu>
        <Menu.Item key="share">Share</Menu.Item>
        <Menu.Item key="delete" danger onClick={() => setSelectDeleted([row])}>Delete</Menu.Item>
      </Menu>}>
        <EllipsisOutlined />
      </Dropdown>
    }
  ]

  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph style={{ textAlign: 'right' }}>
            <Space wrap>
              <Tooltip title="Upload">
                <Button onClick={() => setUpload(true)} shape="circle" icon={<UploadOutlined />} type="primary" />
              </Tooltip>
              <Tooltip title="Sync">
                <Button shape="circle" icon={<SyncOutlined />} onClick={sync} loading={loadingSync} />
              </Tooltip>
              <Tooltip title="Add folder">
                <Button shape="circle" icon={<FolderAddOutlined />} />
              </Tooltip>
              <Tooltip title="Delete">
                <Button shape="circle" icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length} onClick={() => setSelectDeleted(selected)} />
              </Tooltip>
              <Input.Search className="input-search-round" placeholder="Search..." enterButton onSearch={search} allowClear />
            </Space>
          </Typography.Paragraph>
          <Table loading={!files && !errorFiles}
            rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
            dataSource={data}
            columns={columns as any} onChange={change} pagination={{
              current: dataChanges?.pagination.current,
              pageSize: PAGE_SIZE,
              total: files?.length,
              showTotal: (total: any, range: any) => `${range[0]}-${range[1]} of ${total} items`
            }} scroll={{ x: 480 }} />
        </Col>
      </Row>

      <Drawer className="upload" title="Upload" visible={upload} onClose={() => setUpload(false)} placement="bottom">
        <Typography.Paragraph>
          <Upload.Dragger name="upload"
            action={`${apiUrl}/files/upload`}
            withCredentials
            maxCount={1}
            onChange={({ file }) => {
              if (file.status === 'done') {
                message.info('Uploading to Telegram...')
              }
            }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
          </Upload.Dragger>
        </Typography.Paragraph>
        <Table loading={!filesUpload && !errorFilesUpload}
          columns={columns as any}
          dataSource={filesUpload?.files}
          pagination={false} />
      </Drawer>

      <Modal visible={!!selectDeleted?.length}
        title={<><WarningOutlined /> Confirmation</>}
        onCancel={() => setSelectDeleted([])}
        onOk={() => remove(selectDeleted.map(data => data.id))}
        okText="Remove"
        okButtonProps={{ danger: true, type: 'primary' }}>
        <Typography.Paragraph>
          Are you to delete this?
        </Typography.Paragraph>
        <ul>
          {selectDeleted?.map(data => <li>{data.name}</li>)}
        </ul>
      </Modal>
    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard