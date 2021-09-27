import {
  AudioOutlined,
  BranchesOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  ScissorOutlined,
  ShareAltOutlined,
  SnippetsOutlined,
  TeamOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { Button, Menu, Table } from 'antd'
import { SorterResult } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useEffect, useRef, useState } from 'react'
import { apiUrl } from '../../../utils/Fetcher'

interface Props {
  files?: any,
  tab: string,
  onChange: (...args: any[]) => void,
  onDelete: (row: any) => void,
  onRename: (row: any) => void,
  onShare: (row: any) => void,
  onRowClick: (row: any) => void,
  onCut?: (row: any) => void,
  onCopy?: (row: any) => void,
  onPaste?: (rows: any[]) => void,
  loading?: boolean,
  sorterData?: SorterResult<any>,
  dataSource: any[],
  action?: string,
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
  onCut,
  onCopy,
  onPaste,
  loading,
  sorterData,
  dataSource,
  action,
  dataSelect: [selected, setSelected] }) => {

  const [popup, setPopup] = useState<{ visible: boolean, x?: number, y?: number, row?: any }>()
  const pasteEnabled = useRef<boolean | null>(null)

  useEffect(() => {
    pasteEnabled.current = Boolean(selected?.length && action)
    const context = document.querySelector('.App')
    context?.addEventListener('contextmenu', function rightClick(e) {
      if (pasteEnabled.current && !(e.target as any)?.outerHTML.match(/^\<td\ /gi)) {
        e.preventDefault()
        document.addEventListener('click', function onClickOutside() {
          setPopup({ visible: false })
          document.removeEventListener('click', onClickOutside)
        })

        setPopup({
          row: null,
          visible: true,
          x: (e as any).clientX,
          y: (e as any).clientY
        })
      } else if (!pasteEnabled.current) {
        context?.removeEventListener('contextmenu', rightClick)
      }
    })
  }, [selected, action])

  const ContextMenu = () => {
    const baseProps = {
      style: { margin: 0 }
    }
    if (!popup?.visible) return <></>
    if (popup?.row) {
      return <Menu style={{ zIndex: 1, position: 'absolute', left: `${popup?.x}px`, top: `${popup?.y}px` }}>
        <Menu.Item {...baseProps}
          icon={<EditOutlined />}
          key="rename"
          onClick={() => onRename(popup?.row)}>Rename</Menu.Item>
        <Menu.Item {...baseProps}
          icon={<CopyOutlined />}
          key="copy"
          onClick={() => onCopy?.(popup?.row)}>Copy</Menu.Item>
        <Menu.Item {...baseProps}
          icon={<ScissorOutlined />}
          key="cut"
          onClick={() => onCut?.(popup?.row)}>Cut</Menu.Item>
        {popup?.row.type !== 'folder' ? <Menu.Item {...baseProps}
          icon={<ShareAltOutlined />}
          key="share"
          onClick={() => onShare(popup?.row)}>Share</Menu.Item> : ''}
        {popup?.row.type !== 'folder' ? <Menu.Item {...baseProps}
          icon={<DownloadOutlined />}
          key="download"
          onClick={() => location.replace(`${apiUrl}/files/${popup?.row.id}?raw=1&dl=1`)}>Download</Menu.Item> : ''}
        <Menu.Item {...baseProps}
          icon={<DeleteOutlined />}
          key="delete"
          danger
          onClick={() => onDelete(popup?.row)}>Delete</Menu.Item>
      </Menu>
    }
    if (selected?.length && action) {
      return <Menu defaultSelectedKeys={['download']} style={{ position: 'fixed', left: `${popup?.x}px`, top: `${popup?.y}px` }}>
        <Menu.Item style={{ margin: 0 }} icon={<SnippetsOutlined />} key="paste" onClick={() => onPaste?.(selected)}>Paste</Menu.Item>
      </Menu>
    }
    return <></>
  }

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
      onCell: (row: any) => ({
        onClick: () => onRowClick(row)
      }),
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

        return <Button type="link" style={{ color: '#000' }}>
          {row.link_id ? <BranchesOutlined /> : '' } {type} {component} {row.name}
        </Button>
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
    }
  ]

  return <>
    <Table
      className="tableFiles"
      loading={!files || loading}
      showSorterTooltip={false}
      rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
      dataSource={dataSource}
      columns={columns as any}
      onChange={onChange}
      pagination={false}
      scroll={{ x: 340 }}
      onRow={row => ({
        onContextMenu: e => {
          if (tab !== 'mine') return

          e.preventDefault()
          if (!popup?.visible) {
            document.addEventListener('click', function onClickOutside() {
              setPopup({ visible: false })
              document.removeEventListener('click', onClickOutside)
            })
          }
          const parent = document.querySelector('.ant-col-24.ant-col-md-20.ant-col-md-offset-2')
          setPopup({
            row,
            visible: true,
            x: e.clientX - (parent?.getBoundingClientRect().left || 0),
            y: e.clientY - (parent?.getBoundingClientRect().top || 0)
          })
        }
      })} />
    <ContextMenu />
  </>
}

export default TableFiles