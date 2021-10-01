import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Input, Layout, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { ChatList } from 'react-chat-elements'
import 'react-chat-elements/dist/main.css'
import useSWR from 'swr'
import { useDebounce } from 'use-debounce/lib'
import { apiUrl, fetcher } from '../../../utils/Fetcher'


interface Props {
  collapsed?: boolean,
  setCollapsed: (data: boolean) => void
}

const Messaging: React.FC<Props> = ({ collapsed, setCollapsed }) => {
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()
  const [showContent] = useDebounce(collapsed, 250)
  const { data: dialogs } = useSWR(!collapsed ? '/dialogs?take=13' : null, fetcher)

  useEffect(() => {
    if (collapsed) {
      setContentStyle({ display: 'none' })
    }
  }, [collapsed])

  useEffect(() => {
    if (!showContent) {
      setContentStyle(undefined)
    }
  }, [showContent])

  return <Layout.Sider
    theme="light"
    width={340}
    trigger={null}
    collapsedWidth={0}
    collapsed={collapsed}
    onCollapse={setCollapsed}
    style={{ background: 'rgb(240, 242, 245) none repeat scroll 0% 0%' }}>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo">
        <Button icon={<ArrowLeftOutlined />} size="large" type="link" style={{ color: '#fff' }} onClick={() => setCollapsed(true)} />
        Messages
      </div>
    </Layout.Header>
    <Layout.Content className="container" style={{ ...contentStyle || {} }}>
      <Typography.Paragraph>
        <Input.Search className="input-search-round" placeholder="Search..." enterButton onSearch={() => {}} allowClear />
      </Typography.Paragraph>
      <ChatList
        onClick={console.log}
        dataSource={dialogs?.dialogs.dialogs.map((dialog: any) => {
          const user = dialogs?.dialogs?.users.find((user: any) => user.id === (dialog.peer.userId || null))
          const channel = dialogs?.dialogs?.chats.find((user: any) => user.id === (dialog.peer.channelId || null))
          const accessHash = (user || channel)?.accessHash
          const message = dialogs?.dialogs.messages.find((message: any) => message.id === dialog.topMessage)
          const userName = user ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : null
          return {
            key: `${user ? 'user' : 'channel'}/${user?.id || channel?.id}`,
            avatar: `${apiUrl}/dialogs/${user ? 'user' : 'channel'}/${user?.id || channel?.id}/avatar.jpg?accessHash=${accessHash}`,
            alt: (channel?.title || userName).split(' ').map((word: string) => word[0].toUpperCase()).join(''),
            title: channel?.title || userName,
            subtitle: message.message || 'Send Media',
            date: message.date * 1000,
            unread: dialog.unreadCount
          }
        }) || []}
      />
    </Layout.Content>
  </Layout.Sider>
}

export default Messaging