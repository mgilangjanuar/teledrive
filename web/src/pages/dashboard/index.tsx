import {
  AudioOutlined, CopyOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined, InboxOutlined, ScissorOutlined, ShareAltOutlined, SnippetsOutlined, UploadOutlined,
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
  const PAGE_SIZE = 10

  const location = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null, name: string }>>([{ id: null, name: 'Home' }])
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [action, setAction] = useState<string>()
  const [selectDeleted, setSelectDeleted] = useState<any[]>([])
  const [keyword, setKeyword] = useState<string>()
  const [params, setParams] = useState<any>()
  const [upload, setUpload] = useState<boolean>()
  const [loadingRemove, setLoadingRemove] = useState<boolean>()
  const [loadingPaste, setLoadingPaste] = useState<boolean>()
  const [loadingAddFolder, setLoadingAddFolder] = useState<boolean>()
  const [loadingRename, setLoadingRename] = useState<boolean>()
  const [addFolder, setAddFolder] = useState<boolean>()
  const [fileRename, setFileRename] = useState<any>()
  const [formAddFolder] = useForm()
  const [formRename] = useForm()
  const [fileList, setFileList] = useState<any[]>(JSON.parse(localStorage.getItem('fileList') || '[]'))

  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)
  const { data: files, mutate: refetch } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher)
  const { data: filesUpload } = useSWR(fileList?.filter(file => file.response?.file)?.length && upload
    ? `/files?sort=created_at:desc&id.in=(${fileList?.filter(file => file.response?.file).map(file => `'${file.response.file.id}'`).join(',')})` : null, fetcher, {
    refreshInterval: 3000
  })

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
    setFileList(fileList?.filter(file => file.status !== 'success'))
  }, [upload])

  useEffect(() => {
    localStorage.setItem('fileList', JSON.stringify(fileList || []))
  }, [fileList])

  useEffect(() => {
    if (fileRename) {
      formRename.setFieldsValue({ name: fileRename.name })
    }
  }, [fileRename])

  useEffect(() => {
    fetch(dataChanges?.pagination, dataChanges?.filters, dataChanges?.sorter)
  }, [keyword, parent])

  useEffect(() => {
    if (action === 'copy') {
      message.info(`${selected?.length} ${selected?.length > 1 ? 'files are' : 'file is'} ready to copy`)
    } else if (action === 'cut') {
      message.info(`${selected?.length} ${selected?.length > 1 ? 'files are' : 'file is'} ready to move`)
    }
  }, [action])

  useEffect(() => {
    if (filesUpload?.files) {
      setFileList(fileList?.map(file => {
        if (!file.response?.file.id) return file
        const found = filesUpload.files.find((f: any) => f.id === file.response?.file.id)
        if (!found) {
          return null
        }
        const getPercent = (fixed?: number) => found.upload_progress ? Number(found.upload_progress * 100).toFixed(fixed) : 100
        return {
          ...file,
          name: `${getPercent(2)}% ${found.name} (${prettyBytes(found.size)})`,
          percent: getPercent(),
          status: found.upload_progress !== null ? 'uploading' : 'success',
          url: `/view/${found.id}`,
          response: { file: found }
        }
      }).filter(Boolean))
    }
  }, [filesUpload])

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[]) => {
    setParams({
      ...parent ? { parent_id: parent } : { 'parent_id.is': 'null' },
      ...keyword ? { 'name.ilike': `'%${keyword}%'` } : {},
      take: PAGE_SIZE,
      skip: ((pagination?.current || 1) - 1) * PAGE_SIZE,
      ...Object.keys(filters || {})?.reduce((res, key: string) => {
        return { ...res, ...filters?.[key]?.[0] !== undefined ? { [`${key}.in`]: `(${filters[key]?.map(val => `'${val}'`).join(',')})` } : {} }
      }, {}),
      ...(sorter as SorterResult<any>)?.order ? {
        sort: `${(sorter as SorterResult<any>).column?.dataIndex}:${(sorter as SorterResult<any>).order?.replace(/end$/gi, '')}`
      } : { sort: 'uploaded_at:desc' },
    })
  }

  const change = async (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[], _: TableCurrentDataSource<any>) => {
    setDataChanges({ pagination, filters, sorter })
    fetch(pagination, filters, sorter)
  }

  const remove = async (ids: string[]) => {
    setLoadingRemove(true)
    try {
      await Promise.all(ids.map(async id => await req.delete(`/files/${id}`)))
    } catch (error) {
      // ignore
    }
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

  const paste = async (rows: any[]) => {
    rows = rows?.filter(row => row.id !== parent)
    setLoadingPaste(true)
    try {
      if (action === 'copy') {
        await Promise.all(rows?.map(async row => await req.post('/files', { file: { ...row, parent_id: parent, id: undefined } })))
      } else if (action === 'cut') {
        await Promise.all(rows?.map(async row => await req.patch(`/files/${row.id}`, { file: { parent_id: parent } })))
      }
    } catch (error) {
      // ignore
    }
    refetch()
    setAction(undefined)
    setSelected([])
    setSelectDeleted([])
    setLoadingPaste(false)
    message.success('Files are moved successfully!')
  }

  const columns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'type',
      ...upload ? {} : {
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
      },
      ellipsis: true,
      render: (_: any, row: any) => {
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
            } else {
              location.push(`/view/${row.id}`)
            }
          }}>
            {component} {row.name}
          </Button>
        )
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      ...upload ? {} : {
        sorter: true,
        sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.key === 'size' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
      },
      responsive: ['md'],
      width: 100,
      align: 'center',
      render: (value: any) => value ? prettyBytes(value) : '-'
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      ...upload ? {} : {
        sorter: true,
        sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.key === 'uploaded_at' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
      },
      responsive: ['md'],
      width: 250,
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
        <Menu.Item icon={<EditOutlined />} key="rename" onClick={() => setFileRename(row)}>Rename</Menu.Item>
        <Menu.Item icon={<ShareAltOutlined />} key="share">Share</Menu.Item>
        <Menu.Item icon={<DeleteOutlined />} key="delete" danger onClick={() => setSelectDeleted([row])}>Delete</Menu.Item>
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
                  {crumb.id === parent ? <Button type="text" size="small">{crumb.name}</Button> :
                    <Button type="link" size="small" onClick={() => {
                      setParent(crumb.id)
                      const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
                      setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
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
              <Tooltip title="Add folder">
                <Button shape="circle" icon={<FolderAddOutlined />} onClick={() => setAddFolder(true)} />
              </Tooltip>
              <Tooltip title="Copy">
                <Button shape="circle" icon={<CopyOutlined />} disabled={!selected?.length} onClick={() => setAction('copy')} />
              </Tooltip>
              <Tooltip title="Cut">
                <Button shape="circle" icon={<ScissorOutlined />} disabled={!selected?.length} onClick={() => setAction('cut')} />
              </Tooltip>
              <Tooltip title="Paste">
                <Button shape="circle" icon={<SnippetsOutlined />} disabled={!action} loading={loadingPaste} onClick={() => paste(selected)} />
              </Tooltip>
              <Tooltip title="Delete">
                <Button shape="circle" icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length} onClick={() => setSelectDeleted(selected)} />
              </Tooltip>
              <Input.Search className="input-search-round" placeholder="Search..." enterButton onSearch={setKeyword} allowClear />
            </Space>
          </Typography.Paragraph>
          <Table loading={!files}
            rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
            dataSource={data}
            columns={columns as any} onChange={change} pagination={{
              current: dataChanges?.pagination?.current,
              pageSize: PAGE_SIZE,
              total: files?.length,
            }} scroll={{ x: 420 }} />
        </Col>
      </Row>

      <Drawer className="upload" title="Upload" visible={upload} onClose={() => setUpload(false)} placement="bottom">
        <Typography.Paragraph>
          <Upload.Dragger name="upload"
            beforeUpload={file => {
              if (file.size / 1_000_000_000 > 2) {
                message.error('Maximum file size is 2 GB')
                return false
              }
              return true
            }}
            action={`${apiUrl}/files/upload${parent ? `?parent_id=${parent}` : ''}`}
            withCredentials
            fileList={fileList}
            onRemove={file => {
              if (!file.response?.file) return true
              setSelectDeleted([file.response?.file])
              return false
            }}
            onChange={async ({ file, fileList }) => {
              setFileList(fileList)
              if (file.status === 'done') {
                message.info('Uploading to Telegram...')
              }
            }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Maximum file size is 2 GB
            </p>
          </Upload.Dragger>
        </Typography.Paragraph>
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