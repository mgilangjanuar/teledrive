import {
  AudioOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ScissorOutlined,
  ShareAltOutlined,
  SnippetsOutlined,
  VideoCameraOutlined,
  WarningOutlined
} from '@ant-design/icons'
import {
  AutoComplete,
  Breadcrumb,
  Button,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  Layout,
  Menu,
  message,
  Modal,
  notification,
  Popconfirm,
  Row,
  Space,
  Spin,
  Switch,
  Table,
  TablePaginationConfig,
  Typography,
  Upload
} from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import * as clipboardy from 'clipboardy'
import moment from 'moment'
import mime from 'mime-types'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useRef, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { useDebounce } from 'use-debounce'
import { fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

interface PageProps extends RouteComponentProps<{
  type?: string
}> {}

const Dashboard: React.FC<PageProps> = ({ match }) => {
  const PAGE_SIZE = 10

  const history = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null, name: string | React.ReactElement }>>([{ id: null, name: <><HomeOutlined /> Home</> }])
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [action, setAction] = useState<string>()
  const [selectDeleted, setSelectDeleted] = useState<any[]>([])
  const [selectShare, setSelectShare] = useState<any>()
  const [keyword, setKeyword] = useState<string>()
  const [tab, setTab] = useState<string | undefined>(match.params.type)
  const [params, setParams] = useState<any>()
  const [loadingRemove, setLoadingRemove] = useState<boolean>()
  const [loadingPaste, setLoadingPaste] = useState<boolean>()
  const [loadingAddFolder, setLoadingAddFolder] = useState<boolean>()
  const [loadingRename, setLoadingRename] = useState<boolean>()
  const [loadingShare, setLoadingShare] = useState<boolean>(false)
  const [username, setUsername] = useState<string>()
  const [getUser] = useDebounce(username, 500)
  const [users, setUsers] = useState<any[]>([])
  const [addFolder, setAddFolder] = useState<boolean>()
  const [fileRename, setFileRename] = useState<any>()
  const [formAddFolder] = useForm()
  const [formRename] = useForm()
  const [formShare] = useForm()
  const [isPublic, setIsPublic] = useState<boolean>()
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [sharingOptions, setSharingOptions] = useState<string[]>()
  const [fileList, setFileList] = useState<any[]>(JSON.parse(localStorage.getItem('fileList') || '[]'))
  const cancelUploading = useRef<string | null>(null)

  const { data: me, error: errorMe } = useSWRImmutable('/users/me', fetcher)
  const { data: filesUpload } = useSWR(fileList?.filter(file => file.response?.file)?.length
    ? `/files?sort=created_at:desc&id.in=(${fileList?.filter(file => file.response?.file).map(file => `'${file.response.file.id}'`).join(',')})` : null, fetcher, {
    refreshInterval: 5000
  })
  const { data: files, mutate: refetch } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher, { onSuccess: files => {
    if (files?.files) {
      if (!params?.skip || !dataChanges?.pagination?.current || dataChanges?.pagination?.current === 1) {
        return setData(files.files.map((file: any) => ({ ...file, key: file.id })))
      }
      const filters = [
        ...data.map(row => files.files.find((file: any) => file.id === row.id) || row).map(file => ({ ...file, key: file.id })),
        ...files.files.map((file: any) => ({ ...file, key: file.id }))
      ].reduce((res, row) => [
        ...res, !res.filter(Boolean).find((r: any) => r.id === row.id) ? row : null
      ], []).filter(Boolean)
      setData(filters)
    }
  } })

  useEffect(() => {
    if (errorMe) {
      history.replace('/login')
    }
  }, [errorMe])

  useEffect(() => {
    fetch({}, {}, { column: { key: 'uploaded_at' }, order: 'descend' })
  }, [])

  useEffect(() => {
    const nextPage = () => {
      setScrollTop(document.body.scrollTop)
    }
    nextPage()
    document.body.addEventListener('scroll', nextPage)
  }, [])

  useEffect(() => {
    if (scrollTop === document.body.scrollHeight - document.body.clientHeight && files?.files.length >= PAGE_SIZE) {
      change({ ...dataChanges?.pagination, current: (dataChanges?.pagination?.current || 1) + 1 }, dataChanges?.filters, dataChanges?.sorter)
    }
  }, [scrollTop])

  useEffect(() => {
    localStorage.setItem('fileList', JSON.stringify(fileList || []))
  }, [fileList])

  useEffect(() => {
    if (fileRename) {
      formRename.setFieldsValue({ name: fileRename.name })
    }
  }, [fileRename])

  useEffect(() => {
    change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
    setScrollTop(0)
  }, [keyword, parent])


  useEffect(() => {
    history.replace(`/dashboard${tab === 'shared' ? '/shared' : ''}`)
    setBreadcrumbs(breadcrumbs.slice(0, 1))
    if (parent !== null) {
      setParent(null)
    } else {
      change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      setScrollTop(0)
    }
  }, [tab])

  useEffect(() => {
    if (action === 'copy') {
      notification.info({
        message: 'Ready to copy',
        description: 'Please select a folder to copy these files.'
      })
    } else if (action === 'cut') {
      notification.info({
        message: 'Ready to move',
        description: 'Please select a folder to move these files to.'
      })
    }
  }, [action])

  useEffect(() => {
    if (getUser) {
      req.get('/users/search', {
        params: {
          username: getUser
        }
      }).then(({ data }) => {
        setUsers(data.users?.filter((user: any) => user.username !== me?.user.username))
      })
    }
  }, [getUser])

  useEffect(() => {
    if (selectShare) {
      const isPublic = (selectShare.sharing_options || [])?.includes('*')
      setIsPublic(isPublic)
      setSharingOptions(selectShare.sharing_options)
      formShare.setFieldsValue({
        id: selectShare.id,
        message: 'Hey, please check this out! 👆',
        public: isPublic,
        sharing_options: selectShare.sharing_options?.length ? selectShare.sharing_options.filter((opt: string) => opt !== '*') : [''],
        link: `${window.location.origin}/view/${selectShare.id}`
      })
    } else {
      formShare.resetFields()
    }
  }, [selectShare])

  useEffect(() => {
    if (filesUpload?.files) {
      const list = fileList?.map(file => {
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
      }).filter(file => file && file?.status !== 'success')
      setFileList(list)
      setData([...filesUpload.files?.map((file: any) => ({ ...file, key: file.id })), ...data].reduce((res, row) => [
        ...res, !res.filter(Boolean).find((r: any) => r.id === row.id) ? row : null
      ], []).filter(Boolean))
    }
  }, [filesUpload])

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[]) => {
    setParams({
      ...parent ? { parent_id: parent } : { 'parent_id.is': 'null' },
      ...keyword ? { 'name.ilike': `'%${keyword}%'` } : {},
      ...tab === 'shared' ? { shared: 1, 'parent_id.is': undefined } : {},
      take: PAGE_SIZE,
      skip: ((pagination?.current || 1) - 1) * PAGE_SIZE,
      ...Object.keys(filters || {})?.reduce((res, key: string) => {
        return { ...res, ...filters?.[key]?.[0] !== undefined ? { [`${key}.in`]: `(${filters[key]?.map(val => `'${val}'`).join(',')})` } : {} }
      }, {}),
      ...(sorter as SorterResult<any>)?.order ? {
        sort: `${(sorter as SorterResult<any>).column?.dataIndex}:${(sorter as SorterResult<any>).order?.replace(/end$/gi, '')}`
      } : { sort: 'created_at:desc' },
    })
  }

  const change = async (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], _?: TableCurrentDataSource<any>) => {
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
    const newData = data.filter(datum => !ids.includes(datum.id))
    setData(newData)
    if (!newData?.length) {
      if ((dataChanges?.pagination?.current || 0) > 1) {
        change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      } else {
        refetch()
      }
    }
    setSelected([])
    setSelectDeleted([])
    setLoadingRemove(false)
  }

  const createFolder = async () => {
    setLoadingAddFolder(true)
    const { name } = formAddFolder.getFieldsValue()
    try {
      const { data: result } = await req.post('/files/addFolder', {
        file: { name, parent_id: parent }
      })
      notification.success({
        message: 'Success',
        description: `Folder ${result.file.name} created successfully!`
      })
      formAddFolder.resetFields()
      setData([{ ...result.file, key: result.file.id }, ...data])
      setAddFolder(false)
      setLoadingAddFolder(false)
    } catch (error) {
      console.error(error)
      setLoadingAddFolder(false)
      return notification.error({
        message: 'Error',
        description: 'Failed to create new folder. Please try again!'
      })
    }
  }

  const renameFile = async () => {
    setLoadingRename(true)
    const { name } = formRename.getFieldsValue()
    try {
      const { data: result } = await req.patch(`/files/${fileRename?.id}`, {
        file: { name }
      })
      notification.success({
        message: 'Success',
        description: `${name} renamed successfully!`
      })
      setData(data.map((datum: any) => datum.id === result.file.id ? { ...datum, name } : datum))
      setFileRename(undefined)
      setLoadingRename(false)
      formRename.resetFields()
    } catch (error) {
      setLoadingRename(false)
      return notification.error({
        message: 'Error',
        description: 'Failed to rename a file. Please try again!'
      })
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
    // refetch()
    if ((dataChanges?.pagination?.current || 0) > 1) {
      change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
    } else {
      refetch()
    }
    setAction(undefined)
    setSelected([])
    setSelectDeleted([])
    setLoadingPaste(false)
    notification.success({
      message: 'Success',
      description: 'Files are moved successfully!'
    })
  }

  const copy = (val: string) => {
    clipboardy.write(val)
    return message.info('Copied!')
  }

  const share = async () => {
    setLoadingShare(true)
    const { id, public: isPublic, sharing_options: sharingOpts } = formShare.getFieldsValue()

    const sharing = [
      ...new Set([...sharingOpts === undefined ? sharingOptions : sharingOpts, isPublic ? '*' : null]
        .filter(sh => isPublic ? sh : sh !== '*').filter(Boolean)) as any
    ]
    setSharingOptions(sharing)

    await req.patch(`/files/${id}`, { file: { sharing_options: sharing } })
    setLoadingShare(false)
  }

  const upload = async ({ onSuccess, onError, onProgress, file }: any) => {
    notification.warn({
      message: 'Warning',
      description: 'Please don\'t close/reload this browser'
    })
    notification.info({
      key: `upload-${file.uid}`,
      message: 'Preparing to upload',
      description: <>Uploading (0%) {file.name}</>,
      duration: null
    })
    const chunkSize = 512 * 1024
    const parts = Math.ceil(file.size / chunkSize)
    let firstResponse: any

    try {
      for (let i = 0; i < parts; i++) {
        if (firstResponse?.file && cancelUploading.current && file.uid === cancelUploading.current) {
          await req.delete(`/files/${firstResponse?.file.id}`)
          cancelUploading.current = null
          break
        }
        const blobPart = file.slice(i * chunkSize, Math.min(i * chunkSize + chunkSize, file.size))
        const data = new FormData()
        data.append('upload', blobPart)

        const { data: response } = await req.post(`/files/upload${firstResponse?.file?.id ? `/${firstResponse?.file.id}` : ''}`, data, {
          params: {
            ...parent ? { parent_id: parent } : {},
            name: file.name,
            size: file.size,
            mime_type: file.type || mime.lookup(file.name) || 'application/octet-stream',
            part: i,
            total_part: parts,
          },
        })

        if (!firstResponse) {
          firstResponse = response
        }

        const percent = ((i + 1) / parts * 100).toFixed(2)
        notification.info({
          key: `upload-${file.uid}`,
          message: 'On it!',
          description: <>Uploading ({percent}%) {file.name}</>,
          duration: null
        })
        onProgress({ percent }, file)
      }
      notification.close(`upload-${file.uid}`)
      notification.success({
        message: 'Success',
        description: `File ${file.name} uploaded successfully`
      })
      return onSuccess(firstResponse, file)
    } catch (error: any) {
      console.error(error)
      notification.close(`upload-${file.uid}`)
      notification.error({
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: error.response.data.error } : {}
      })
      return onError(error.response?.data || error.response || { error: error.message }, file)
    }
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
          <Button type="link" onClick={() => {
            if (row.type === 'folder') {
              setParent(row.id)
              setBreadcrumbs([...breadcrumbs, { id: row.id, name: row.name }])
            } else {
              history.push(`/view/${row.id}`)
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
    ...!tab ? [{
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: 95,
      align: 'center',
      render: (_: any, row: any) => row.upload_progress !== null ? <Popconfirm placement="topRight" onConfirm={() => remove([row.id])} title={`Are you sure to cancel ${row.name}?`}>
        <Button type="link">Cancel</Button>
      </Popconfirm> : <Dropdown placement="bottomRight" overlay={<Menu>
        <Menu.Item icon={<EditOutlined />} key="rename" onClick={() => setFileRename(row)}>Rename</Menu.Item>
        {row.type !== 'folder' ? <Menu.Item icon={<ShareAltOutlined />} key="share" onClick={() => setSelectShare(row)}>Share</Menu.Item> : ''}
        <Menu.Item icon={<DeleteOutlined />} key="delete" danger onClick={() => setSelectDeleted([row])}>Delete</Menu.Item>
      </Menu>}>
        <Button type="link" icon={<EllipsisOutlined />}/>
      </Dropdown>
    }] : []
  ]

  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container" style={{ paddingTop: 0 }}>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph>
            <Menu mode="horizontal" selectedKeys={[params?.shared ? 'shared' : 'mine']} onClick={({ key }) => setTab(key === 'mine' ? undefined : key)}>
              <Menu.Item key="mine">My Files</Menu.Item>
              <Menu.Item key="shared">Shared</Menu.Item>
            </Menu>
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Upload.Dragger name="upload"
              customRequest={upload}
              beforeUpload={file => {
                if (file.size / 1_000_000_000 > 2) {
                  notification.error({
                    message: 'Error',
                    description: 'Maximum file size is 2 GB'
                  })
                  return false
                }
                return true
              }}
              fileList={fileList}
              onRemove={file => {
                if (!file.response?.file) {
                  cancelUploading.current = file.uid
                  return true
                }
                if (file.response?.file) {
                  setSelectDeleted([file.response?.file])
                }
                return false
              }}
              onChange={async ({ fileList }) => setFileList(fileList)}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Maximum file size is 2 GB
              </p>
            </Upload.Dragger>
          </Typography.Paragraph>
          <Typography.Paragraph style={{ float: 'left' }}>
            <Breadcrumb>
              {breadcrumbs.slice(0, 1).map(crumb =>
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
              {breadcrumbs.length > 2 ? <Breadcrumb.Item key="ellipsis">
                <Dropdown placement="bottomCenter" overlay={<Menu>
                  {breadcrumbs.slice(1, breadcrumbs.length - 1).map(crumb => <Menu.Item key={crumb.id} onClick={() => {
                    setParent(crumb.id)
                    const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
                    setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
                  }}>
                    {crumb.name}
                  </Menu.Item>)}
                </Menu>}>
                  <Button type="text" size="small"><EllipsisOutlined /></Button>
                </Dropdown>
              </Breadcrumb.Item> : ''}
              {breadcrumbs.length > 1 ? breadcrumbs.slice(breadcrumbs.length - 1).map(crumb =>
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
              ) : ''}
            </Breadcrumb>
          </Typography.Paragraph>
          <Typography.Paragraph style={{ textAlign: 'right' }}>
            <Space wrap>
              {!tab ? <>
                <Button shape="circle" icon={<FolderAddOutlined />} onClick={() => setAddFolder(true)} />
                <Button shape="circle" icon={<CopyOutlined />} disabled={!selected?.length} onClick={() => setAction('copy')} />
                <Button shape="circle" icon={<ScissorOutlined />} disabled={!selected?.length} onClick={() => setAction('cut')} />
                <Button shape="circle" icon={<SnippetsOutlined />} disabled={!action} loading={loadingPaste} onClick={() => paste(selected)} />
                <Button shape="circle" icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length} onClick={() => setSelectDeleted(selected)} />
              </> : ''}
              <Input.Search className="input-search-round" placeholder="Search..." enterButton onSearch={setKeyword} allowClear />
            </Space>
          </Typography.Paragraph>
          <Table loading={!files} showSorterTooltip={false}
            rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
            dataSource={data}
            columns={columns as any} onChange={change}
            pagination={false}
            scroll={{ x: 420 }} />
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
        footer={null}
        title={`Share ${selectShare?.name}`}>
        <Form form={formShare} layout="horizontal">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          {selectShare?.type !== 'folder' ? <Form.Item name="public" label="Make public">
            <Switch checked={isPublic} onClick={val => {
              setIsPublic(val)
              share()
            }} />
          </Form.Item> : ''}
          {!isPublic && <Form.List name="sharing_options">
            {(fields, { add, remove }) => <>
              {fields.map((field, i) => <Row gutter={14} key={i}>
                <Col span={22}>
                  <Form.Item {...field} rules={[{ required: true, message: 'Username is required' }]}>
                    <AutoComplete notFoundContent={<Empty />} options={users?.map((user: any) => ({ value: user.username }))}>
                      <Input onBlur={() => share()} placeholder="username" prefix="@" onChange={e => setUsername(e.target.value)} />
                    </AutoComplete>
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Button icon={<MinusCircleOutlined />} type="link" danger onClick={() => {
                    remove(field.name)
                    share()
                  }} />
                </Col>
              </Row>)}
              <Form.Item style={{ textAlign: 'left' }}>
                <Button shape="round" onClick={() => {
                  add()
                  share()
                }} icon={<PlusOutlined />}>Add user</Button>
              </Form.Item>
            </>}
          </Form.List>}
          <Divider />
          <Spin spinning={loadingShare}>
            <Typography.Paragraph type="secondary">
              <InfoCircleOutlined /> You are shared {isPublic ? 'with anyone.' :
                `with ${formShare.getFieldValue('sharing_options')?.[0] || 'no one'}
                  ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length > 1 ? ` and ${formShare.getFieldValue('sharing_options')?.filter(Boolean).length - 1} people` : ''}`}
            </Typography.Paragraph>
            {sharingOptions?.[0] ? <Form.Item label={<><LinkOutlined /> &nbsp;Share URL</>} name="link">
              <Input.Search readOnly contentEditable={false} enterButton={<CopyOutlined />} onSearch={copy} />
            </Form.Item> : ''}
          </Spin>
        </Form>
      </Modal>
    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard