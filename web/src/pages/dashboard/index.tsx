import {
  FolderAddOutlined,
  HomeOutlined,
  PlusOutlined,
  SyncOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Col, Dropdown,
  Input,
  Layout,
  Menu, Modal,
  notification,
  Row,
  Space,
  TablePaginationConfig,
  Typography
} from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory, useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { fetcher, req } from '../../utils/Fetcher'
import View from '../view'
import AddFolder from './components/AddFolder'
import Breadcrumb from './components/Breadcrumb'
import Messaging from './components/Messaging'
import Remove from './components/Remove'
import Rename from './components/Rename'
import Share from './components/Share'
import TableFiles from './components/TableFiles'
import Upload from './components/Upload'

interface PageProps extends RouteComponentProps<{
  type?: string
}> {}

const Dashboard: React.FC<PageProps & { me?: any, errorMe?: any }> = ({ match }) => {
  const PAGE_SIZE = 10

  const history = useHistory()
  const location = useLocation()
  const [parent, setParent] = useState<Record<string, any> | null>()
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([{ id: null, name: <><HomeOutlined /></> }])
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
  const [loadingSync, setLoadingSync] = useState<boolean>()
  const [syncConfirmation, setSyncConfirmation] = useState<boolean>()
  const [collapsedMessaging, setCollapsedMessaging] = useState<boolean>(true)
  const [collapsedView, setCollapsedView] = useState<string>()
  const [init, setInit] = useState<boolean>()

  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)
  const { data: filesUpload } = useSWR(fileList?.filter(file => file.response?.file)?.length
    ? `/files?exclude_parts=1&sort=created_at:desc&id.in=(${fileList?.filter(file => file.response?.file).map(file => `'${file.response.file.id}'`).join(',')})` : null, fetcher, {
    refreshInterval: 5000
  })
  const { data: files, mutate: refetch } = useSWR(params ? `/files?exclude_parts=1&${qs.stringify(params)}` : null, fetcher, { onSuccess: files => {
    setLoading(false)
    if (files?.files) {
      let newData: any[] = []
      if (!params?.offset || !dataChanges?.pagination?.current || dataChanges?.pagination?.current === 1) {
        newData = files.files.map((file: any) => ({ ...file, key: file.id }))
      } else {
        newData = [
          ...data.map(row => files.files.find((file: any) => file.id === row.id) || row).map(file => ({ ...file, key: file.id })),
          ...files.files.map((file: any) => ({ ...file, key: file.id }))
        ].reduce((res, row) => [
          ...res, !res.filter(Boolean).find((r: any) => r.id === row.id) ? row : null
        ], []).filter(Boolean)
      }

      // if (!fileList?.length) {
      //   const deletedFiles = newData.filter(file => file.upload_progress !== null)
      //   if (deletedFiles?.length) {
      //     console.log('OAHJSASAS', deletedFiles)
      //     deletedFiles.map(file => req.delete(`/files/${file.id}`))
      //     newData = newData.filter(file => !deletedFiles.find(deleted => deleted.id === file.id))
      //   }
      // }

      setData(newData)
    }
  } })

  useEffect(() => {
    // init config
    if (!init) {
      req.get('/config')
      setInit(true)
    }
  }, [init])

  useEffect(() => {
    if (window.localStorage.getItem('session')) {
      window.localStorage.setItem('experimental', 'true')
    }
  }, [window.localStorage])

  useEffect(() => {
    if (errorMe) {
      window.localStorage.removeItem('experimental')
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
    const footer = document.querySelector('.ant-layout-footer')
    if (scrollTop >= document.body.scrollHeight - document.body.clientHeight - (footer?.clientHeight || 80) && files?.files.length >= PAGE_SIZE) {
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
        if (!file.response?.file?.id) return file
        const found = filesUpload.files.find((f: any) => f.id === file.response?.file.id)
        if (!found) return null
        return {
          ...file,
          status: found.upload_progress !== null ? 'uploading' : 'success'
        }
      }).filter(file => file && file.status !== 'success')
      setFileList(list)
      // setData([...filesUpload.files?.map((file: any) => ({ ...file, key: file.id })), ...data].reduce((res, row) => [
      //   ...res, !res.filter(Boolean).find((r: any) => r.id === row.id) ? row : null
      // ], []).filter(Boolean))
      if ((dataChanges?.pagination?.current || 0) > 1) {
        change({ ...dataChanges?.pagination, current: 1 }, dataChanges?.filters, dataChanges?.sorter)
      } else {
        refetch()
      }
    }
  }, [filesUpload])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const openFile = params.get('view')
    if (openFile) {
      setCollapsedView(openFile)
    } else {
      setCollapsedView(undefined)
    }
  }, [location.search])

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setLoading(true)
    setParams({
      ...parent?.id ? { parent_id: parent.link_id || parent.id } : { parent_id: 'null' },
      ...keyword ? { 'name[contains]': keyword } : {},
      ...tab === 'shared' ? { shared: 1, parent_id: undefined } : {},
      limit: PAGE_SIZE,
      offset: pagination?.current === 1 || actions?.action || keyword && params?.offset ? 0 : data?.length,
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

    if (keyword) {
      setKeyword(undefined)
    } else if (parent) {
      setParent(null)
    } else {
      setScrollTop(0)
      const pagination = {
        ...dataChanges?.pagination, current: 1
      }
      const filters = {
        ...dataChanges?.filters,
        ...(parent as any)?.id ? { parent_id: [(parent as any).id] } : { parent_id: ['null'] },
        ...key === 'shared' ? {
          shared: [1],
          parent_id: [undefined as any]
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

  const paste = async (rows: any[], p: any = parent, act?: string) => {
    rows = rows?.filter(row => row.id !== p?.id && !row.link_id)
    setLoading(true)
    try {
      if ((act || action) === 'copy') {
        await Promise.all(rows?.map(async row => {
          if (row.type === 'folder') {
            const name = `Link of ${row.name}`
            await req.post('/files/addFolder', { file: { ...row, name, link_id: row.id, parent_id: p?.link_id || p?.id, id: undefined } })
          } else {
            await req.post('/files/cloneFile', { file: { ...row, name: row.name, parent_id: p?.link_id || p?.id, id: undefined } })
          }
        }))
      } else if ((act || action) === 'cut') {
        await Promise.all(rows?.map(async row => await req.patch(`/files/${row.id}`, { file: { parent_id: p?.link_id || p?.id } })))
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
      description: `${rows?.length || 0} files are ${(act || action) === 'cut' ? 'moved' : 'copied'} successfully!`
    })
    setAction(undefined)
  }

  const sync = async () => {
    setLoadingSync(true)
    try {
      await req.post('/files/sync', {}, {
        params: {
          limit: 50,
          parent_id: parent?.id || undefined
        }
      })
      refetch()
      setLoadingSync(false)
    } catch (error: any) {
      setLoadingSync(false)
      if (error?.response?.status === 402) {
        return notification.error({
          message: 'Premium Feature',
          description: 'Please upgrade your plan for using this feature'
        })
      }
      return notification.error({
        message: error?.response?.status || 'Something error',
        ...error?.response?.data ? { description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </> } : {}
      })
    } finally {
      setSyncConfirmation(false)
    }
  }

  return <Layout>
    <Layout>
      <Layout.Content onClick={() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchParams.get('chat') || searchParams.get('qmsg') || searchParams.get('msg')) {
          searchParams.delete('chat')
          searchParams.delete('qmsg')
          searchParams.delete('msg')
          history.push(`${window.location.pathname}?${searchParams.toString()}`)
        }
      }}>
        <Row style={{ minHeight: '100vh', marginBottom: '100px', padding: '0 12px' }}>
          <Col xxl={{ span: 14, offset: 5 }} xl={{ span: 16, offset: 4 }} lg={{ span: 18, offset: 3 }} md={{ span: 20, offset: 2 }} span={24}>
            <Typography.Paragraph>
              <Menu mode="horizontal" selectedKeys={[params?.shared ? 'shared' : 'mine']} onClick={({ key }) => changeTab(key)}>
                <Menu.Item disabled={!files} key="mine">My Files</Menu.Item>
                <Menu.Item disabled={!files} key="shared">Shared</Menu.Item>
              </Menu>
            </Typography.Paragraph>
            <Typography.Paragraph>
              {tab === 'mine' ? <Upload
                me={me}
                onCancel={file => setSelectDeleted([file])}
                parent={parent}
                dataFileList={[fileList, setFileList]}
              /> : !sessionStorage.getItem('hide-shared-warning') && <Alert
                message={<>
                  These are all files that other users share with you. If you find any suspicious, spam, or etc, please <Link to="/contact?intent=report">report it to us</Link>.
                </>}
                type="warning"
                showIcon
                onClose={() => sessionStorage.setItem('hide-shared-warning', 'true')}
                closable />}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ float: 'left' }}>
              <Breadcrumb dataSource={[breadcrumbs, setBreadcrumbs]} dataParent={[parent, setParent]} />
            </Typography.Paragraph>
            <Typography.Paragraph style={{ textAlign: 'right' }}>
              <Space wrap>
                {tab === 'mine' ? <>
                  <Dropdown trigger={['click']} placement="bottomCenter" overlay={<Menu>
                    <Menu.Item key="upload" icon={<UploadOutlined />}>
                      <Upload
                        me={me}
                        isDirectory
                        onCancel={file => setSelectDeleted([file])}
                        parent={parent}
                        dataFileList={[fileList, setFileList]}
                      />
                    </Menu.Item>
                    <Menu.Item key="create" icon={<PlusOutlined />} onClick={() => setAddFolder(true)}>
                      Create
                    </Menu.Item>
                  </Menu>}>
                    <Button shape="circle" icon={<FolderAddOutlined />} />
                  </Dropdown>
                  <Button shape="circle" onClick={() => setSyncConfirmation(true)} icon={<SyncOutlined />} />
                </> : ''}
                <Input.Search style={{ width: '210px' }} className="input-search-round" placeholder="Search..." enterButton onSearch={setKeyword} allowClear />
              </Space>
            </Typography.Paragraph>
            <TableFiles
              files={files}
              tab={tab}
              me={me?.user}
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
              onShare={(row, action) => {
                setSelected([row])
                setSelectShare({ row, action })
              }}
              onRowClick={row => {
                if (row.type === 'folder') {
                  setParent(row)
                  setBreadcrumbs([...breadcrumbs, row])

                  const searchParams = new URLSearchParams(window.location.search)
                  searchParams.set('parent', row.id)
                  history.push(`${location.pathname}?${searchParams.toString()}`)

                  if (selected?.find(select => select.id === row.id)) {
                    setSelected([])
                  }
                } else {
                  // const searchParams = new URLSearchParams(window.location.search)
                  // searchParams.set('view', row.id)
                  // history.push(`${window.location.pathname}?${searchParams.toString()}`)
                  window.open(`${window.location.origin}/view/${row.id}`, '_blank')

                  // setCollapsedView(row.id)
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
              onCutAndPaste={(dragRow, destination) => {
                let rows = selected
                if (!selected?.find(select => select.id === dragRow.id)) {
                  setSelected([dragRow])
                  rows = [dragRow]
                }
                paste(rows, destination, 'cut')
              }}
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

      <Messaging me={me} collapsed={collapsedMessaging} parent={parent} setCollapsed={setCollapsedMessaging} />

      <Modal title={<Typography.Text>
        <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Sync confirmation
      </Typography.Text>}
      visible={syncConfirmation}
      onCancel={() => setSyncConfirmation(false)}
      onOk={sync}
      cancelButtonProps={{ shape: 'round' }}
      okButtonProps={{ shape: 'round', loading: loadingSync }}>
        <Typography.Paragraph>
          Are you sure to sync up to 50 files from your Upload Destination to the <code>{typeof parent?.name === 'string' ? parent.name : 'root'}</code> directory?
        </Typography.Paragraph>
      </Modal>

      {/* <Drawer placement="bottom" visible={!!collapsedView} className="view" headerStyle={{ display: 'none' }} bodyStyle={{ padding: 0 }}>
        <View isInDrawer onCloseDrawer={() => {
          const searchParams = new URLSearchParams(window.location.search)
          searchParams.delete('view')
          history.push(`${window.location.pathname}?${searchParams.toString()}`)
        }} match={{ params: { id: collapsedView as string } } as any} history={history} location={location} />
      </Drawer> */}
      <Modal visible={!!collapsedView} className="view" footer={null} closable={false}>
        <View isInDrawer onCloseDrawer={() => {
          const searchParams = new URLSearchParams(window.location.search)
          searchParams.delete('view')
          history.push(`${window.location.pathname}?${searchParams.toString()}`)
        }} match={{ params: { id: collapsedView as string } } as any} history={history} location={location} />
      </Modal>
    </Layout>
  </Layout>
}

export default Dashboard
