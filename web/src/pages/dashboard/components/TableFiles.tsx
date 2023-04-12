import {
  ArrowRightOutlined,
  AudioOutlined,
  BranchesOutlined,
  CopyOutlined,
  DeleteOutlined, DownloadOutlined, CloudDownloadOutlined,
  EditOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
  GlobalOutlined, ProfileOutlined, ScissorOutlined,
  ShareAltOutlined,
  SnippetsOutlined,
  TeamOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { Descriptions, Menu, Modal, Table, Tag, Typography } from 'antd'
import { SorterResult } from 'antd/lib/table/interface'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import useSWR from 'swr'
import { directDownload } from '../../../utils/Download'
import { apiUrl, fetcher } from '../../../utils/Fetcher'

interface Props {
  files?: any,
  tab: string,
  me?: any,
  onChange: (...args: any[]) => void,
  onDelete: (row: any) => void,
  onRename: (row: any) => void,
  onShare: (row: any, action: string) => void,
  onRowClick: (row: any) => void,
  onCut?: (row: any) => void,
  onCopy?: (row: any) => void,
  onPaste?: (rows: any[]) => void,
  onCutAndPaste?: (dragRow: any, hoverRow: any) => void,
  loading?: boolean,
  sorterData?: SorterResult<any>,
  dataSource: any[],
  action?: string,
  dataSelect: [any[], (data: any[]) => void]
}

const TableFiles: React.FC<Props> = ({
  files,
  tab,
  me,
  onChange,
  onDelete,
  onRename,
  onShare,
  onRowClick,
  onCut,
  onCopy,
  onPaste,
  onCutAndPaste,
  loading,
  sorterData,
  dataSource,
  action,
  dataSelect: [selected, setSelected] }) => {

  const [popup, setPopup] = useState<{ visible: boolean, x?: number, y?: number, row?: any }>()
  const [showDetails, setShowDetails] = useState<any>()
  const { data: user } = useSWR(showDetails ? `/users/${showDetails.user_id}` : null, fetcher)
  const { data: filesParts } = useSWR(showDetails ? `/files?name.like=${showDetails.name.replace(/\.part0*\d+$/, '')}&user_id=${showDetails.user_id}&parent_id${showDetails.parent_id ? `=${showDetails.parent_id}` : '=null'}${tab === 'shared' ? '&shared=1' : ''}` : null, fetcher)
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

        const parent = document.querySelector('.ant-col-24.ant-col-md-20.ant-col-md-offset-2')
        setPopup({
          row: null,
          visible: true,
          x: (e as any).clientX - (parent?.getBoundingClientRect().left || 0),
          y: (e as any).clientY - (parent?.getBoundingClientRect().top || 0)
        })
      } else if (!pasteEnabled.current) {
        context?.removeEventListener('contextmenu', rightClick)
      }
    })
  }, [selected, action])

  const Icon = ({ type }: { type: string }) => {
    if (type === 'image') {
      return <FileImageOutlined />
    } else if (type === 'video') {
      return <VideoCameraOutlined />
    } else if (type === 'document') {
      return <FilePdfOutlined />
    } else if (type === 'folder') {
      return <FolderOpenOutlined />
    } else if (type === 'audio') {
      return <AudioOutlined />
    } else {
      return <FileOutlined />
    }
  }

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
        {tab === 'mine' && <>
          <Menu.Item {...baseProps}
            icon={<EditOutlined />}
            key="rename"
            onClick={() => onRename(popup?.row)}>Rename</Menu.Item>
          {!popup?.row.link_id ? <Menu.Item {...baseProps}
            icon={<CopyOutlined />}
            key="copy"
            onClick={() => onCopy?.(popup?.row)}>Copy</Menu.Item> : ''}
          <Menu.Item {...baseProps}
            icon={<ScissorOutlined />}
            key="cut"
            onClick={() => onCut?.(popup?.row)}>Cut</Menu.Item>
          <Menu.Item {...baseProps}
            icon={<ShareAltOutlined />}
            key="share"
            onClick={() => onShare(popup?.row, 'share')}>Share</Menu.Item>
          {popup?.row.type !== 'folder' ? <Menu.Item {...baseProps}
            icon={<ArrowRightOutlined />}
            key="send"
            onClick={() => onShare(popup?.row, 'forward')}>Send to</Menu.Item> : ''}
          {popup?.row.type !== 'folder' ? <Menu.Item {...baseProps}
            icon={<DownloadOutlined />}
            key="download"
            onClick={async () => {
              location.replace(`${apiUrl}/files/${popup?.row.id}?raw=1&dl=1`)
            }}>Download</Menu.Item> : ''}
          {popup?.row.type !== 'folder' ? <Menu.Item {...baseProps}
            icon={<CloudDownloadOutlined />}
            key="fastdownload"
            onClick={async () => {
              popup?.row && await directDownload(popup?.row.id, popup?.row.name.replace(/\.part0*\d+$/, ''))
            }}>Fast Download <Tag color="green">beta</Tag></Menu.Item> : ''}
          <Menu.Item {...baseProps}
            icon={<DeleteOutlined />}
            key="delete"
            danger
            onClick={() => onDelete(popup?.row)}>Delete</Menu.Item>
        </>}
      </Menu>
    }
    if (selected?.length && action) {
      return <Menu defaultSelectedKeys={['download']} style={{ position: 'absolute', left: `${popup?.x}px`, top: `${popup?.y}px`, boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' }}>
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
        let type: any
        if (row.sharing_options?.includes('*')) {
          type = <GlobalOutlined />
        } else if (row.sharing_options?.length) {
          type = <TeamOutlined />
        }

        return <>
          {row.link_id ? <BranchesOutlined /> : '' } {type} <Icon type={row.type} /> {row.name?.replace(/\.part0*\d+$/, '')}
        </>
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
      sortOrder: sorterData?.column?.key === 'uploaded_at' ? sorterData.order : undefined,
      responsive: ['md'],
      width: 250,
      align: 'center',
      render: (value: any, row: any) => row.upload_progress !== null ? <>Uploading...</> : moment(value).local().format('llll')
    }
  ]

  const DraggableBodyRow = ({ index, moveRow, className, style, ...restProps }) => {
    const ref = useRef()
    const [{ isOver, dropClassName }, drop] = useDrop({
      accept: 'DraggableBodyRow',
      collect: (monitor: any) => {
        const { index: dragIndex } = monitor.getItem() || {}
        if (dragIndex === index) {
          return {}
        }
        return {
          isOver: monitor.isOver(),
          dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
        }
      },
      drop: (item: any) => {
        moveRow(item.index, index)
      },
    })
    const [, drag] = useDrag({
      type: 'DraggableBodyRow',
      item: { index },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    })
    drop(drag(ref))

    return (
      <tr
        ref={ref as any}
        className={`${className}${isOver ? dropClassName : ''}`}
        style={{ cursor: 'move', ...style }}
        {...restProps}
      />
    )
  }

  return <>
    <DndProvider backend={HTML5Backend}>
      <Table
        className="tableFiles"
        loading={!files || loading}
        showSorterTooltip={false}
        rowSelection={{ type: 'checkbox', selectedRowKeys: selected.map(row => row.key), onChange: (_: React.Key[], rows: any[]) => setSelected(rows) }}
        dataSource={dataSource}
        columns={columns as any}
        components={{
          body: {
            row: DraggableBodyRow
          }
        }}
        onChange={onChange}
        pagination={false}
        scroll={{ x: 330 }}
        onRow={(row, index) => ({
          index,
          moveRow: useCallback((dragIndex, hoverIndex) => {
            const hoverRow = dataSource[hoverIndex]
            const dragRow = dataSource[dragIndex]
            if (hoverRow.type === 'folder') {
              onCutAndPaste?.(dragRow, hoverRow)
            }
          }, [dataSource, selected]),
          onContextMenu: e => {
            // if (tab !== 'mine') return

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
        })}
        expandable={me?.settings?.expandable_rows && window.innerWidth < 752 ? {
          expandedRowRender: (row: any) => <Descriptions labelStyle={{ fontWeight: 'bold' }} column={1}>
            <Descriptions.Item label="Size">{row.size ? prettyBytes(Number(row.size)) : '-'}</Descriptions.Item>
            <Descriptions.Item label="Uploaded At">{row.upload_progress !== null ? <>Uploading {Number((row.upload_progress * 100).toFixed(2))}%</> : moment(row.uploaded_at).local().format('lll')}</Descriptions.Item>
          </Descriptions>,
          rowExpandable: (_: any) => window.innerWidth < 752,
        } : undefined} />
    </DndProvider>
    <ContextMenu />
    <Modal title={<Typography.Text ellipsis><Icon type={showDetails?.type} /> {showDetails?.name.replace(/\.part0*\d+$/, '')}</Typography.Text>}
      visible={Boolean(showDetails)}
      onCancel={() => setShowDetails(undefined)}
      okText="View"
      onOk={() => {
        setShowDetails(undefined)
        onRowClick(showDetails)
      }}
      cancelButtonProps={{ shape: 'round' }}
      okButtonProps={{ shape: 'round' }}>
      <Descriptions column={1}>
        <Descriptions.Item label="Size">
          {filesParts?.length ? prettyBytes(filesParts?.files.reduce((res: number, file: any) => res + Number(file.size), 0)) + ` (${filesParts?.length} parts)` : showDetails?.size && prettyBytes(Number(showDetails?.size || 0))}
        </Descriptions.Item>
        <Descriptions.Item label="Uploaded At">{moment(showDetails?.uploaded_at).local().format('lll')}</Descriptions.Item>
        <Descriptions.Item label="Uploaded By">
          <a href={`https://t.me/${user?.user.username}`} target="_blank">@{user?.user.username}</a>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  </>
}

export default TableFiles
