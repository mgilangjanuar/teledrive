import {
  DeleteOutlined,
  EllipsisOutlined, FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  VideoCameraOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Layout, Menu, Row,
  Space,
  Table,
  Typography
} from 'antd'
import prettyBytes from 'pretty-bytes'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import useSWR from 'swr'
import { fetcher } from '../../utils/Fetcher'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Dashboard: React.FC = () => {
  const PAGE_SIZE = 5

  const location = useHistory()
  const [parent, setParent] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [selected, setSelected] = useState<any[]>([])
  const [params, setParams] = useState<any>()

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

  return <>
    <Navbar user={me?.user} />
    <Layout.Content className="container">
      <Row>
        <Col md={{ span: 20, offset: 2 }} span={24}>
          <Typography.Paragraph>
            <Space>
              <Button icon={<SyncOutlined />}>Sync</Button>
              <Button icon={<FolderAddOutlined />}>Add Folder</Button>
              <Button icon={<DeleteOutlined />} danger type="primary" disabled={!selected?.length}>Delete</Button>
            </Space>
          </Typography.Paragraph>
          <Table rowSelection={{ type: 'checkbox', onChange: (_: React.Key[], selectedRows: any[]) => {
            setSelected(selectedRows)
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
              render: (value, row) => row.upload_progress ? <>Uploading ${Number(row.upload_progress * 100)}%</> : value
            },
            {
              title: 'Actions',
              dataIndex: 'actions',
              key: 'actions',
              render: (_, row) => <Menu>
                <Menu.SubMenu key="menu" icon={<EllipsisOutlined />}>
                  <Menu.Item key="rename">Rename</Menu.Item>
                  <Menu.SubMenu key="submenu" title="Move to">

                  </Menu.SubMenu>
                  <Menu.Item key="delete" icon={<DeleteOutlined />} danger>Delete</Menu.Item>
                </Menu.SubMenu>
              </Menu>
            }
          ]} pagination={{
            // current: dataChanges?.pagination.current,
            pageSize: PAGE_SIZE,
            total: files?.length,
            showTotal: (total: any, range: any) => `${range[0]}-${range[1]} of ${total} items`
          }} />
        </Col>
      </Row>

    </Layout.Content>
    <Footer />
  </>
}

export default Dashboard