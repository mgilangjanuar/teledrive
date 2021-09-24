import { AudioOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, FileImageOutlined, FileOutlined, FilePdfOutlined, FolderOpenOutlined, GlobalOutlined, ShareAltOutlined, TeamOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { Button, Dropdown, Menu, Table } from 'antd'
import { SorterResult } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React from 'react'

interface Props {
  files?: any,
  tab: string,
  onChange: (...args: any[]) => void,
  onDelete: (row: any) => void,
  onRename: (row: any) => void,
  onShare: (row: any) => void,
  onRowClick: (row: any) => void,
  sorterData?: SorterResult<any>,
  dataSource: any[],
  dataSelect: [any[], (data: any[]) => void]
}

const TableFiles: React.FC<Props> = ({
  files,
  tab,
  onChange,
  onDelete,
  onRename,
  onShare,
  onRowClick,
  sorterData,
  dataSource,
  dataSelect: [selected, setSelected] }) => {

  const columns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'type',
      sorter: true,
      sortOrder: sorterData?.column?.dataIndex === 'name' ? sorterData.order : undefined,
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

        let type
        if (row.sharing_options?.includes('*')) {
          type = <GlobalOutlined />
        } else if (row.sharing_options?.length) {
          type = <TeamOutlined />
        }

        return (
          <Button type="link" onClick={() => onRowClick(row)}>
            {component}{type} {row.name}
          </Button>
        )
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      sorter: true,
      sortOrder: sorterData?.column?.key === 'size' ? sorterData.order : undefined,
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
      sortOrder: sorterData?.column?.key === 'uploaded_at' ? sorterData.order : undefined,
      responsive: ['md'],
      width: 250,
      align: 'center',
      render: (value: any, row: any) => row.upload_progress !== null ? <>Uploading {Number((row.upload_progress * 100).toFixed(2))}%</> : moment(value).format('llll')
    },
    ...tab === 'mine' ? [{
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: 95,
      align: 'center',
      render: (_: any, row: any) => row.upload_progress !== null ? <Button type="link" onClick={() => onDelete(row)}>Cancel</Button> : <Dropdown trigger={['click']} placement="bottomRight" overlay={<Menu>
        <Menu.Item icon={<EditOutlined />} key="rename" onClick={() => onRename(row)}>Rename</Menu.Item>
        {row.type !== 'folder' ? <Menu.Item icon={<ShareAltOutlined />} key="share" onClick={() => onShare(row)}>Share</Menu.Item> : ''}
        <Menu.Item icon={<DeleteOutlined />} key="delete" danger onClick={() => onDelete(row)}>Delete</Menu.Item>
      </Menu>}>
        <Button type="link" icon={<EllipsisOutlined />}/>
      </Dropdown>
    }] : []
  ]

  return <Table loading={!files} showSorterTooltip={false}
    rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
    dataSource={dataSource}
    columns={columns as any}
    onChange={onChange}
    pagination={false}
    scroll={{ x: 420 }} />
}

export default TableFiles