import { FolderAddOutlined, HomeOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Col,
  Input,
  Layout,
  Menu,
  notification,
  Row,
  Space,
  TablePaginationConfig,
  Typography
} from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import AddFolder from './components/AddFolder'
import Breadcrumb from './components/Breadcrumb'
import Remove from './components/Remove'
import Rename from './components/Rename'
import Share from './components/Share'
import TableFiles from './components/TableFiles'
import Upload from './components/Upload'

interface PageProps extends RouteComponentProps<{
  type?: string
}> {}

const Dashboard: React.FC<PageProps> = ({ match }) => {
  const PAGE_SIZE = 10

  const history = useHistory()
  const [parent, setParent] = useState<Record<string, any> | null>()
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([{ id: null, name: <><HomeOutlined /> Home</> }])
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{
    pagination?: TablePaginationConfig,
    filters?: Record<string, FilterValue | null>,
    sorter?: SorterResult<any> | SorterResult<any>[]
  }>()
  const [selected, setSelected] = useState<any[]>([])
  const [action, setAction] = useState<string>()
  const [selectShare, setSelectShare] = useState<any>()
  const [selectDeleted, setSelectDeleted] = useState<any>()
  const [keyword, setKeyword] = useState<string>()
  const [tab, setTab] = useState<string>(match.params.type || 'mine')
  const [params, setParams] = useState<any>()
  const [addFolder, setAddFolder] = useState<boolean>()
  const [fileRename, setFileRename] = useState<any>()
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [fileList, setFileList] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>()

  const { data: me, error: errorMe } = useSWRImmutable('/users/me', fetcher)
  const { data: filesUpload } = useSWR(fileList?.filter(file => file.response?.file)?.length
    ? `/files?sort=created_at:desc&id.in=(${fileList?.filter(file => file.response?.file).map(file => `'${file.response.file.id}'`).join(',')})` : null, fetcher, {
    refreshInterval: 5000
  })
  const { data: files, mutate: refetch } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher, { onSuccess: files => {
    setLoading(false)
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
    const nextPage = () => {
      setScrollTop(document.body.scrollTop)
    }
    nextPage()
    document.body.addEventListener('scroll', nextPage)
  }, [])

  useEffect(() => {
    const parentId = new URLSearchParams(location.search).get('parent') || null
    if (parentId) {
      req.get(`/files/${parentId}`).then(({ data }) => {
        setParent(data.file)
        req.get(`/files/breadcrumbs/${data.file.id}`)
          .then(({ data }) => {
            setBreadcrumbs([...breadcrumbs, ...data.breadcrumbs])
          })
      })
    } else {
      setParent(null)
    }
  }, [])

  useEffect(() => {
    if (scrollTop === document.body.scrollHeight - document.body.clientHeight && files?.files.length >= PAGE_SIZE) {
      change({ ...dataChanges?.pagination, current: (dataChanges?.pagination?.current || 1) + 1 }, dataChanges?.filters, dataChanges?.sorter)
    }
  }, [scrollTop])

  useEffect(() => {
    if (parent !== undefined || keyword !== undefined) {
      change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      setScrollTop(0)
    }
  }, [keyword, parent])

  useEffect(() => {
    if (parent?.id) {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.set('parent', parent?.id)
      history.replace(`/dashboard${tab === 'shared' ? `/${tab}` : ''}?${searchParams.toString()}`)
    }
  }, [parent])

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
    if (parent === null && dataChanges?.pagination?.current !== 1) {
      change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      setScrollTop(0)
    }
  }, [tab])

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

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setLoading(true)
    setParams({
      ...parent?.id ? { parent_id: parent.link_id || parent.id } : { 'parent_id.is': 'null' },
      ...keyword ? { 'name.ilike': `'%${keyword}%'` } : {},
      ...tab === 'shared' ? { shared: 1, 'parent_id.is': undefined } : {},
      take: PAGE_SIZE,
      // skip: ((pagination?.current || 1) - 1) * PAGE_SIZE,
      skip: pagination?.current === 1 || actions?.action || keyword ? 0 : data?.length,
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

  const changeTab = (key: string) => {
    setTab(key)
    setBreadcrumbs(breadcrumbs.slice(0, 1))
    history.replace(`/dashboard${key === 'shared' ? '/shared' : ''}`)

    if (parent) {
      setParent(null)
    } else {
      setScrollTop(0)
      const pagination = {
        ...dataChanges?.pagination, current: 1
      }
      const filters = {
        ...dataChanges?.filters,
        ...(parent as any)?.id ? { parent_id: [(parent as any).id] } : { 'parent_id.is': ['null'] },
        ...key === 'shared' ? {
          shared: [1],
          'parent_id.is': [undefined as any]
        } : {
          shared: [undefined as any]
        }
      }
      const sorter = dataChanges?.sorter

      if (dataChanges?.pagination?.current === 1) {
        fetch(pagination, filters, sorter)
      } else {
        // change(pagination, dataChanges?.filters, dataChanges?.sorter)
      }
    }
  }

  const change = async (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setDataChanges({ pagination, filters, sorter })
    fetch(pagination, filters, sorter, actions)
  }

  const paste = async (rows: any[]) => {
    rows = rows?.filter(row => row.id !== parent?.id)
    setLoading(true)
    try {
      if (action === 'copy') {
        await Promise.all(rows?.map(async row => {
          if (row.type === 'folder') {
            const name = `Link of ${row.name}`
            await req.post('/files', { file: { ...row, name, link_id: row.id, parent_id: parent?.link_id || parent?.id, id: undefined } })
          } else {
            const name = data?.find(datum => datum.name === row.name) ? `Copy of ${row.name}` : row.name
            await req.post('/files', { file: { ...row, name, parent_id: parent?.link_id || parent?.id, id: undefined } })
          }
        }))
      } else if (action === 'cut') {
        await Promise.all(rows?.map(async row => await req.patch(`/files/${row.id}`, { file: { parent_id: parent?.link_id || parent?.id } })))
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
    setSelected([])
    setLoading(false)
    notification.success({
      message: 'Success',
      description: `Files are ${action === 'cut' ? 'moved' : 'copied'} successfully!`
    })
    setAction(undefined)
  }

  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container" style={{ paddingTop: 0 }}>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph>
            <Menu mode="horizontal" selectedKeys={[params?.shared ? 'shared' : 'mine']} onClick={({ key }) => changeTab(key)}>
              <Menu.Item disabled={!files} key="mine">My Files</Menu.Item>
              <Menu.Item disabled={!files} key="shared">Shared</Menu.Item>
            </Menu>
          </Typography.Paragraph>
          <Typography.Paragraph>
            {tab === 'mine' ? <Upload
              onCancel={file => setSelectDeleted([file])}
              parent={parent}
              dataFileList={[fileList, setFileList]} /> : <Alert
              message={<>
                These are all files that other users share with you. If you find any suspicious, spam, or etc, please <Link to="/contact?intent=report">report it to us</Link>.
              </>}
              type="warning"
              showIcon
              closable/>}
          </Typography.Paragraph>
          <Typography.Paragraph style={{ float: 'left' }}>
            <Breadcrumb dataSource={[breadcrumbs, setBreadcrumbs]} dataParent={[parent, setParent]} />
          </Typography.Paragraph>
          <Typography.Paragraph style={{ textAlign: 'right' }}>
            <Space wrap>
              {tab === 'mine' ? <>
                <Button shape="circle" icon={<FolderAddOutlined />} onClick={() => setAddFolder(true)} />
              </> : ''}
              <Input.Search className="input-search-round" placeholder="Search..." enterButton onSearch={setKeyword} allowClear />
            </Space>
          </Typography.Paragraph>
          <TableFiles
            files={files}
            tab={tab}
            onChange={change}
            onDelete={row => {
              if (!selected?.find(select => select.id === row.id)) {
                setSelected([row])
                return setSelectDeleted([row])
              }
              setSelectDeleted(selected)
            }}
            onRename={row => {
              setSelected([row])
              setFileRename(row)
            }}
            onShare={row => {
              setSelected([row])
              setSelectShare(row)
            }}
            onRowClick={row => {
              if (row.type === 'folder') {
                setParent(row)
                setBreadcrumbs([...breadcrumbs, row])
                if (selected?.find(select => select.id === row.id)) {
                  setSelected([])
                }
              } else {
                history.push(`/view/${row.id}`)
              }
            }}
            onCopy={row => {
              if (!selected?.find(select => select.id === row.id)) {
                setSelected([row])
              }
              setAction('copy')
            }}
            onCut={row => {
              if (!selected?.find(select => select.id === row.id)) {
                setSelected([row])
              }
              setAction('cut')
            }}
            onPaste={rows => paste(rows)}
            dataSource={data}
            sorterData={dataChanges?.sorter as SorterResult<any>}
            dataSelect={[selected, setSelected]}
            action={action}
            loading={loading} />
        </Col>
      </Row>

      <Remove
        dataSource={[data, setData]}
        dataSelect={[selectDeleted, setSelectDeleted]}
        onFinish={newData => {
          if (!newData?.length) {
            if ((dataChanges?.pagination?.current || 0) > 1) {
              change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
              setScrollTop(0)
            } else {
              refetch()
            }
          }
          setSelected([])
        }} />

      <AddFolder
        dataSource={[data, setData]}
        dataActivate={[addFolder, setAddFolder]}
        parent={parent} />

      <Rename
        dataSource={[data, setData]}
        dataSelect={[fileRename, setFileRename]} />

      <Share
        me={me}
        dataSource={[data, setData]}
        dataSelect={[selectShare, setSelectShare]} />
    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard