import {
  BranchesOutlined, GlobalOutlined,
  HomeOutlined,
  ProfileOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { Button, Col, Descriptions, Input, Layout, Menu, Modal, Row, Table, TablePaginationConfig, Typography } from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import QueryString from 'qs'
import React, { useEffect, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { useHistory } from 'react-router-dom'
import useSWR from 'swr'
import { fetcher } from '../../../utils/Fetcher'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'
import Breadcrumb from '../../dashboard/components/Breadcrumb'
import Icon from './Icon'

interface Props {
  me: any,
  data: any
}

const TableFiles: React.FC<Props> = ({ me, data }) => {
  const history = useHistory()
  const [dataChanges, setDataChanges] = useState<{
    pagination?: TablePaginationConfig,
    filters?: Record<string, FilterValue | null>,
    sorter?: SorterResult<any> | SorterResult<any>[]
  }>()
  const { currentTheme } = useThemeSwitcher()
  const [parent, setParent] = useState<Record<string, any> | null>()
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([data?.file || { id: null, name: <><HomeOutlined /></> }])
  const [scrollTop, setScrollTop] = useState<number>(0)
  const [keyword, setKeyword] = useState<string>()
  const [filesData, setFilesData] = useState<any>()
  const [params, setParams] = useState<any>()
  const [loading, setLoading] = useState<boolean>(false)
  const [showDetails, setShowDetails] = useState<any>()
  const { data: filesParts } = useSWR(showDetails ? `/files?name.like=${showDetails.name.replace(/\.part0*\d+$/, '')}&user_id=${showDetails.user_id}${me?.user.id !== showDetails.user_id ? '&shared=1' : ''}&parent_id${showDetails.parent_id ? `=${showDetails.parent_id}` : '=null'}` : null, fetcher)
  const [popup, setPopup] = useState<{ visible: boolean, x?: number, y?: number, row?: any }>()
  const { data: files, mutate: _refetch } = useSWR(data?.file.type === 'folder' && data?.file.sharing_options?.includes('*') && params ? `/files?exclude_parts=1&${QueryString.stringify(params)}` : null, fetcher, { onSuccess: files => {
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

  const PAGE_SIZE = 10

  const fetch = (pagination?: TablePaginationConfig, filters?: Record<string, FilterValue | null>, sorter?: SorterResult<any> | SorterResult<any>[], actions?: TableCurrentDataSource<any>) => {
    setLoading(true)
    setParams({
      // ...parent?.id ? { parent_id: parent.link_id || parent.id } : { 'parent_id.is': 'null' },
      parent_id: parent?.link_id || parent?.id || data?.file.id,
      ...keyword ? { 'name.ilike': `%${keyword}%` } : {},
      shared: 1,
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

  return <Layout>
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
                  let type: any
                  if (row.sharing_options?.includes('*')) {
                    type = <GlobalOutlined />
                  } else if (row.sharing_options?.length) {
                    type = <TeamOutlined />
                  }

                  return <Button type="link" block style={{ textAlign: 'left', padding: 0, color: currentTheme === 'dark' ? '#FFFFFFD9' : '#000000D9' }}>
                    {row.link_id ? <BranchesOutlined /> : '' } {type} <Icon type={row.type} /> {row.name.replace(/\.part0*\d+$/, '')}
                  </Button>
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
                render: (value: any) => {
                  if (Number(value) === 2_000_000_000) {
                    return '> 2 GB'
                  }
                  return value ? prettyBytes(Number(value)) : '-'
                }
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
    <Modal title={<Typography.Text ellipsis><Icon type={showDetails?.type} /> {showDetails?.name.replace(/\.part0*\d+$/, '')}</Typography.Text>}
      visible={Boolean(showDetails)}
      onCancel={() => setShowDetails(undefined)}
      okText="View"
      onOk={() => onRowClick(showDetails)}
      cancelButtonProps={{ shape: 'round' }}
      okButtonProps={{ shape: 'round' }}>
      <Descriptions column={1}>
        <Descriptions.Item label="Size">
          {filesParts?.length ? prettyBytes(filesParts?.files.reduce((res: number, file: any) => res + Number(file.size), 0)) + ` (${filesParts?.length} parts)` : showDetails?.size && prettyBytes(Number(showDetails?.size || 0))}
        </Descriptions.Item>
        <Descriptions.Item label="Uploaded At">{moment(showDetails?.uploaded_at).local().format('lll')}</Descriptions.Item>
      </Descriptions>
    </Modal>
  </Layout>
}

export default TableFiles