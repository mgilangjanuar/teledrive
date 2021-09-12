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
  Breadcrumb,
  Button,
  Col,
  Drawer,
  Dropdown, Form, Input,
  Layout, Menu, message, Modal, Popconfirm, Row,
  Space,
  Table,
  TablePaginationConfig,
  Tooltip,
  Typography,
  Upload
} from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWR from 'swr'
import { apiUrl, fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const PAGE_SIZE = 12

  const location = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null, name: string }>>([{ id: null, name: 'Home' }])
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [selectDeleted, setSelectDeleted] = useState<any[]>([])
  const [keyword, setKeyword] = useState<string>()
  const [params, setParams] = useState<any>()
  const [upload, setUpload] = useState<boolean>()
  const [loadingSync, setLoadingSync] = useState<boolean>()
  const [loadingRemove, setLoadingRemove] = useState<boolean>()
  const [loadingAddFolder, setLoadingAddFolder] = useState<boolean>()
  const [loadingRename, setLoadingRename] = useState<boolean>()
  const [addFolder, setAddFolder] = useState<boolean>()
  const [fileRename, setFileRename] = useState<any>()
  const [formAddFolder] = useForm()
  const [formRename] = useForm()

  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)
  const { data: files, error: errorFiles, mutate: refetch } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher)
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
      refetch()
    }
  }, [upload])

  useEffect(() => {
    refetch()
  }, [parent, params])

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[]) => {
    setParams({
      parent_id: parent || undefined,
      take: PAGE_SIZE,
      skip: ((pagination?.current || 1) - 1) * PAGE_SIZE,
      ...Object.keys(filters || {})?.reduce((res, key: string) => {
        return { ...res, ...filters?.[key]?.[0] !== undefined ? { [key]: filters[key]?.[0] } : {} }
      }, {}),
      ...(sorter as SorterResult<any>)?.order ? {
        sort: `${(sorter as SorterResult<any>).column?.key}:${(sorter as SorterResult<any>).order?.replace(/end$/gi, '')}`
      } : { sort: 'uploaded_at:desc' },
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
    await new Promise(res => setTimeout(res, 3000))
    refetch()
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
    setLoadingRemove(true)
    await Promise.all(ids.map(async id => await req.delete(`/files/${id}`)))
    refetch()
    setSelected([])
    setSelectDeleted([])
    setLoadingRemove(false)
  }

  const createFolder = async () => {
    setLoadingAddFolder(true)
    const { name } = formAddFolder.getFieldsValue()
    try {
      const { data } = await req.post('/files/addFolder', {
        file: { name, parent_id: parent }
      })
      message.success(`Folder ${data.file.name} created successfully!`)
      formAddFolder.resetFields()
      refetch()
      setAddFolder(false)
      setLoadingAddFolder(false)
    } catch (error) {
      setLoadingAddFolder(false)
      return message.error('Failed to create new folder')
    }
  }

  const renameFile = async () => {
    setLoadingRename(true)
    const { name } = formRename.getFieldsValue()
    try {
      const { data } = await req.patch(`/files/${fileRename?.id}`, {
        file: { name }
      })
      message.success(`${data.file.name} renamed successfully!`)
      formRename.resetFields()
      refetch()
      setFileRename(undefined)
      setLoadingRename(false)
    } catch (error) {
      setLoadingRename(false)
      return message.error('Failed to rename a file')
    }
  }

  useEffect(() => {
    if (fileRename) {
      formRename.setFieldsValue({ name: fileRename.name })
    }
  }, [fileRename])

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

        return (
          <Button type="link" size="small" onClick={() => {
            if (row.type === 'folder') {
              setParent(row.id)
              setBreadcrumbs([...breadcrumbs, { id: row.id, name: row.name }])
              setParams({ ...params, parent_id: row.id || undefined })
            }
          }}>
            {component} {value}
          </Button>
        )
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      responsive: ['md'],
      width: 100,
      align: 'center',
      render: (value: any) => value ? prettyBytes(value) : '-'
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
        <Menu.Item key="rename" onClick={() => setFileRename(row)}>Rename</Menu.Item>
        <Menu.Item key="share">Share</Menu.Item>
        <Menu.SubMenu key="submenu" title="Move to">

        </Menu.SubMenu>
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
          <Typography.Paragraph>
            <Breadcrumb>
              {breadcrumbs.map(crumb =>
                <Breadcrumb.Item key={crumb.id}>
                  {crumb.id === parent ? crumb.name :
                    <Button type="link" size="small" onClick={() => {
                      setParent(crumb.id)
                      const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
                      setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
                      setParams({ ...params, parent_id: crumb.id || undefined })
                    }}>
                      {crumb.name}
                    </Button>
                  }
                </Breadcrumb.Item>
              )}
            </Breadcrumb>
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Space wrap>
              <Tooltip title="Upload">
                <Button onClick={() => setUpload(true)} shape="circle" icon={<UploadOutlined />} type="primary" />
              </Tooltip>
              <Tooltip title="Sync">
                <Button shape="circle" icon={<SyncOutlined />} onClick={sync} loading={loadingSync} />
              </Tooltip>
              <Tooltip title="Add folder">
                <Button shape="circle" icon={<FolderAddOutlined />} onClick={() => setAddFolder(true)} />
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
              // showTotal: (total: any) => `${total} items`
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
        okButtonProps={{ danger: true, type: 'primary', loading: loadingRemove }}>
        <Typography.Paragraph>
          Are you sure to delete {selectDeleted?.length > 1 ? `${selectDeleted?.length} objects` : selectDeleted?.[0]?.name }?
        </Typography.Paragraph>
      </Modal>

      <Modal visible={addFolder}
        onCancel={() => setAddFolder(false)}
        okText="Add"
        title="Add Folder"
        onOk={() => formAddFolder.submit()}
        okButtonProps={{ loading: loadingAddFolder }}>
        <Form form={formAddFolder} layout="vertical" onFinish={createFolder}>
          <Form.Item name="name" label="Name">
            <Input placeholder="New Folder" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal visible={fileRename}
        onCancel={() => setFileRename(undefined)}
        okText="Add"
        title={`Rename ${fileRename?.name}`}
        onOk={() => formRename.submit()}
        okButtonProps={{ loading: loadingRename }}>
        <Form form={formRename} layout="vertical" onFinish={renameFile}>
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard