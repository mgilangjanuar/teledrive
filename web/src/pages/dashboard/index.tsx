import {
  AudioOutlined, CopyOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined, HomeOutlined, InboxOutlined, MinusCircleOutlined, ScissorOutlined, ShareAltOutlined, SnippetsOutlined, VideoCameraOutlined, WarningOutlined
} from '@ant-design/icons'
import {
  AutoComplete,
  Breadcrumb,
  Button,
  Col, Dropdown, Form, Input,
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
import useSWRImmutable from 'swr/immutable'
import { useDebounce } from 'use-debounce'
import { apiUrl, fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const PAGE_SIZE = 10

  const location = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null, name: string | React.ReactElement }>>([{ id: null, name: <><HomeOutlined /> Home</> }])
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [action, setAction] = useState<string>()
  const [selectDeleted, setSelectDeleted] = useState<any[]>([])
  const [selectShare, setSelectShare] = useState<any>()
  const [keyword, setKeyword] = useState<string>()
  const [params, setParams] = useState<any>()
  const [loadingRemove, setLoadingRemove] = useState<boolean>()
  const [loadingPaste, setLoadingPaste] = useState<boolean>()
  const [loadingAddFolder, setLoadingAddFolder] = useState<boolean>()
  const [loadingRename, setLoadingRename] = useState<boolean>()
  const [loadingShare, setLoadingShare] = useState<boolean>()
  const [username, setUsername] = useState<string>()
  const [getUser] = useDebounce(username, 500)
  const [users, setUsers] = useState<any[]>([])
  const [addFolder, setAddFolder] = useState<boolean>()
  const [fileRename, setFileRename] = useState<any>()
  const [formAddFolder] = useForm()
  const [formRename] = useForm()
  const [formShare] = useForm()
  const [fileList, setFileList] = useState<any[]>(JSON.parse(localStorage.getItem('fileList') || '[]'))

  const { data: me, error: errorMe } = useSWRImmutable('/users/me', fetcher)
  const { data: files, mutate: refetch } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher)
  const { data: filesUpload } = useSWR(fileList?.filter(file => file.response?.file)?.length
    ? `/files?sort=created_at:desc&id.in=(${fileList?.filter(file => file.response?.file).map(file => `'${file.response.file.id}'`).join(',')})` : null, fetcher, {
    refreshInterval: 3000
  })

  useEffect(() => {
    if (errorMe) {
      location.replace('/login')
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
    if (getUser) {
      req.get('/users/search', {
        params: {
          username: getUser
        }
      }).then(({ data }) => {
        setUsers(data.users?.filter((user: any) => user.id !== Number(me?.user.tg_id)))
      })
    }
  }, [getUser])

  useEffect(() => {
    if (selectShare) {
      formShare.setFieldsValue({
        id: selectShare.id,
        users: ['']
      })
    }
  }, [selectShare])

  useEffect(() => {
    if (filesUpload?.files) {
      setFileList(fileList?.map(file => {
        if (!file.response?.file.id) return file
        const found = filesUpload.files.find((f: any) => f.id === file.response?.file.id)
        if (!found) {
          return null
        }
        const getPercent = (fixed?: number) => found.upload_progress !== null ? Number(found.upload_progress * 100).toFixed(fixed) : 100
        return {
          ...file,
          name: `${getPercent(2)}% ${found.name} (${prettyBytes(found.size)})`,
          percent: getPercent(),
          status: found.upload_progress !== null ? 'uploading' : 'success',
          url: found.upload_progress === null ? `/view/${found.id}` : undefined,
          response: { file: found }
        }
      }).filter(file => file && file?.status !== 'success'))
      refetch()
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

  const share = async () => {
    setLoadingShare(true)
    const { id, users } = formShare.getFieldsValue()
    let results: any[] = []
    try {
      results = await Promise.all(users?.map(async (user: any) => await req.post(`/files/forward/${id}/${user}`, {})))
    } catch (error) {
      // ignore
    }
    formShare.resetFields()
    setLoadingShare(false)
    setSelectShare(undefined)
    message.success(`Shared to ${results.filter(Boolean).length} user(s) successfully!`)
  }

  const columns = [
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
      sorter: true,
      sortOrder: (dataChanges?.sorter as SorterResult<any>)?.column?.key === 'size' ? (dataChanges?.sorter as SorterResult<any>).order : undefined,
      responsive: ['md'],
      width: 100,
      align: 'center',
      render: (value: any) => value ? prettyBytes(value) : '-'
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
      render: (value: any, row: any) => row.upload_progress !== null ? <>Uploading {Number((row.upload_progress * 100).toFixed(2))}%</> : moment(value).format('llll')
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
        {row.type !== 'folder' ? <Menu.Item icon={<ShareAltOutlined />} key="share" onClick={() => setSelectShare(row)}>Share</Menu.Item> : ''}
        <Menu.Item icon={<DeleteOutlined />} key="delete" danger onClick={() => setSelectDeleted([row])}>Delete</Menu.Item>
      </Menu>}>
        <Button type="link" size="small" icon={<EllipsisOutlined />}/>
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

      <Modal visible={selectShare}
        onCancel={() => setSelectShare(undefined)}
        okText="Share"
        title={`Share ${selectShare?.name}`}
        onOk={() => formShare.submit()}
        okButtonProps={{ loading: loadingShare }}>
        <Form form={formShare} layout="vertical" onFinish={share}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.List name="users">
            {(fields, { add, remove }) => <>
              {fields.map((field, i) => <Row gutter={14} key={i}>
                <Col span={22}>
                  <Form.Item {...field} rules={[{ required: true, message: 'Username is required' }]}>
                    <AutoComplete options={users?.map((user: any) => ({ value: user.username }))}>
                      <Input placeholder="username" prefix="@" onChange={e => setUsername(e.target.value)} />
                    </AutoComplete>
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Button icon={<MinusCircleOutlined />} type="link" danger onClick={() => remove(field.name)} />
                </Col>
              </Row>)}
              <Form.Item style={{ marginTop: '10px' }}>
                <Button block shape="round" onClick={() => add()}>Add user</Button>
              </Form.Item>
            </>}
          </Form.List>
        </Form>
      </Modal>
    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard