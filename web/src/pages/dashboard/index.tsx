import {
  DeleteOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  SyncOutlined,
  UploadOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Dropdown,
  Layout, Menu, Row,
  Space,
  Table,
  TablePaginationConfig,
  Typography
} from 'antd'
import { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWR, { mutate } from 'swr'
import { fetcher, req } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const PAGE_SIZE = 5

  const location = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [dataChanges, setDataChanges] = useState<{ pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[] }>()
  const [selected, setSelected] = useState<any[]>([])
  const [params, setParams] = useState<any>()
  const [loadingSync, setLoadingSync] = useState<boolean>()

  const { data: me, error: errorMe } = useSWR('/users/me', fetcher)
  const { data: files, error: errorFiles } = useSWR(params ? `/files?${qs.stringify(params)}` : null, fetcher)

  useEffect(() => {
    if (errorMe) {
      location.replace('/')
    }
  }, [errorMe])

  useEffect(() => {
    setParams({
      parent_id: parent || undefined,
      skip: 0,
      take: PAGE_SIZE
    })
  }, [parent])

  useEffect(() => {
    if (files?.files) {
      setData(files.files.map((file: any) => ({ ...file, key: file.id })))
    }
  }, [files])

  const change = async (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<any> | SorterResult<any>[], _: TableCurrentDataSource<any>) => {
    setDataChanges({ pagination, filters, sorter })
  }

  const sync = async () => {
    setLoadingSync(true)
    await req.post('/files/sync')
    await new Promise(res => setTimeout(res, 2000))
    mutate(`/files?${qs.stringify(params)}`)
    setLoadingSync(false)
  }

  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph>
            <Space wrap>
              <Button size="small" icon={<UploadOutlined />} type="primary">Upload</Button>
              <Button size="small" icon={<SyncOutlined />} onClick={sync} loading={loadingSync}>Sync</Button>
              <Button size="small" icon={<FolderAddOutlined />}>Add Folder</Button>
              <Button size="small" icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length}>Delete</Button>
            </Space>
          </Typography.Paragraph>
          <Table rowSelection={{ type: 'checkbox', selectedRowKeys: selected, onChange: (keys: React.Key[]) => {
            setSelected(keys)
          } }} dataSource={data} columns={[
            {
              title: 'File',
              dataIndex: 'name',
              key: 'name',
              render: (value, row) => {
                if (row.type === 'image') {
                  return <><FileImageOutlined /> {value}</>
                }
                if (row.type === 'video') {
                  return <><VideoCameraOutlined /> {value}</>
                }
                if (row.type === 'document') {
                  return <><FilePdfOutlined /> {value}</>
                }
                if (row.type === 'folder') {
                  return <><FolderOpenOutlined /> {value}</>
                }
                return <><FileOutlined /> {value}</>
              }
            },
            {
              title: 'Size',
              dataIndex: 'size',
              key: 'size',
              responsive: ['md'],
              render: value => prettyBytes(value)
            },
            {
              title: 'Uploaded At',
              dataIndex: 'uploaded_at',
              key: 'uploaded_at',
              responsive: ['md'],
              render: (value, row) => row.upload_progress ? <>Uploading ${Number(row.upload_progress * 100)}%</> : moment(value).format('llll')
            },
            {
              title: 'Actions',
              dataIndex: 'actions',
              key: 'actions',
              render: (_, row) => <Dropdown placement="bottomRight" overlay={<Menu>
                <Menu.Item key="rename">Rename</Menu.Item>
                <Menu.SubMenu key="submenu" title="Move to">

                </Menu.SubMenu>
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger>Delete</Menu.Item>
              </Menu>}>
                <EllipsisOutlined />
              </Dropdown>
            }
          ]} onChange={change} pagination={{
            current: dataChanges?.pagination.current,
            pageSize: PAGE_SIZE,
            total: files?.length,
            showTotal: (total: any, range: any) => `${range[0]}-${range[1]} of ${total} items`
          }} scroll={{ x: 360 }} />
        </Col>
      </Row>

    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard