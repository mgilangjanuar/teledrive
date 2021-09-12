import {
  AudioOutlined, DeleteOutlined,
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
  Input,
  Layout, Menu, Popconfirm, Row,
  Space,
  Table,
  TablePaginationConfig,
  Tooltip,
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
              <Tooltip title="Upload">
                <Button shape="round" icon={<UploadOutlined />} type="primary" />
              </Tooltip>
              <Tooltip title="Sync">
                <Button shape="round" icon={<SyncOutlined />} onClick={sync} loading={loadingSync} />
              </Tooltip>
              <Tooltip title="Add folder">
                <Button shape="round" icon={<FolderAddOutlined />} />
              </Tooltip>
              <Tooltip title="Delete">
                <Popconfirm title={`Are you sure to delete ${selected?.length} objects?`}>
                  <Button shape="round" icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length} />
                </Popconfirm>
              </Tooltip>
              <Input.Search className="input-search-round" placeholder="Search..." enterButton />
            </Space>
          </Typography.Paragraph>
          <Table rowSelection={{ type: 'checkbox', selectedRowKeys: selected, onChange: (keys: React.Key[]) => {
            setSelected(keys)
          } }} dataSource={data} columns={[
            {
              title: 'File',
              dataIndex: 'name',
              key: 'name',
              ellipsis: true,
              render: (value, row) => {
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
              render: value => prettyBytes(value)
            },
            {
              title: 'Uploaded At',
              dataIndex: 'uploaded_at',
              key: 'uploaded_at',
              responsive: ['md'],
              width: 220,
              align: 'center',
              render: (value, row) => row.upload_progress ? <>Uploading ${Number(row.upload_progress * 100)}%</> : moment(value).format('llll')
            },
            {
              title: 'Actions',
              dataIndex: 'actions',
              key: 'actions',
              width: 90,
              align: 'center',
              render: (_, row) => <Dropdown placement="bottomRight" overlay={<Menu>
                <Menu.Item key="download">Download</Menu.Item>
                <Menu.Item key="rename">Rename</Menu.Item>
                <Menu.SubMenu key="submenu" title="Move to">

                </Menu.SubMenu>
                <Menu.Item key="share">Share</Menu.Item>
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