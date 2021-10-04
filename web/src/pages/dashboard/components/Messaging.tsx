import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Layout, Spin, Tabs, Typography } from 'antd'
import React, { useState, useEffect } from 'react'
import { ChatList } from 'react-chat-elements'
import useSWR from 'swr'
import { apiUrl, fetcher } from '../../../utils/Fetcher'

import 'react-chat-elements/dist/main.css'

interface Props {
  collapsed?: boolean,
  setCollapsed: (data: boolean) => void
}

const Messaging: React.FC<Props> = ({ collapsed, setCollapsed }) => {
  const [qVal, setQVal] = useState<string>()
  const [q, setQ] = useState<string>()
  const [message, setMessage] = useState<any>()
  const [chatList, setChatLists] = useState<any>()
  const [searchMessageList, setSearchMessageList] = useState<any>()
  const [searcGlobalList, setSearcGlobalList] = useState<any>()
  const [searchAccountList, setSearchAccountList] = useState<any>()
  const { data: _dialogs } = useSWR(!collapsed && !q && !message ? '/dialogs?limit=10' : null, fetcher, { onSuccess: data => setChatLists(data.dialogs || []) })
  const { data: searchMessages } = useSWR(q ? `/messages/search?q=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchMessageList(data.messages || []) })
  const { data: searchGlobal } = useSWR(q ? `/messages/globalSearch?q=${q}&limit=5` : null, fetcher, { onSuccess: data => setSearcGlobalList(data.messages || []) })
  const { data: searchAccounts } = useSWR(q ? `/users/search?username=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchAccountList(data.users || []) })

  useEffect(() => {
    setSearchMessageList(undefined)
    setSearcGlobalList(undefined)
    setSearchAccountList(undefined)
  }, [q])

  const back = () => {
    if (message) {
      setMessage(undefined)
    } else if (q) {
      setQ(undefined)
      setQVal(undefined)
    } else {
      setCollapsed(true)
    }
  }

  return <Layout.Sider
    theme="light"
    className="messaging"
    trigger={null}
    collapsedWidth={0}
    collapsed={collapsed}
    onCollapse={setCollapsed}
    style={{ background: 'rgb(240, 242, 245) none repeat scroll 0% 0%', position: 'absolute', right: 0, width: '100%', height: '100%', overflowY: 'scroll', zIndex: 1 }}>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo">
        <Button icon={<ArrowLeftOutlined />} size="large" type="link" style={{ color: '#fff' }} onClick={back} />
        Quick Message
      </div>
    </Layout.Header>
    <Layout.Content className="container">
      <Typography.Paragraph>
        <Input.Search value={qVal} onChange={(e) => setQVal(e.target.value)} className="input-search-round" placeholder="Search..." enterButton onSearch={setQ} allowClear />
      </Typography.Paragraph>
      {q && !message && <Tabs defaultActiveKey="messages">
        <Tabs.TabPane tab="Messages" key="messages">
          {searchMessages && !searchMessageList?.messages?.length && <Empty style={{ marginTop: '100px' }} />}
          <ChatList
            onClick={console.log}
            dataSource={searchMessageList?.messages.map((message: any) => {
              const user = message.peerId?.userId ? searchMessageList?.users.find((user: any) => user.id === message.peerId?.userId) : null
              const chat = message.peerId?.chatId ? searchMessageList?.chats.find((chat: any) => chat.id === message.peerId?.chatId) : null
              const title = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : chat?.title || ''
              return {
                id: `${user ? 'user' : 'chat'}/${message.peerId?.userId || message.peerId?.chatId}`,
                key: message.id,
                avatar: `${apiUrl}/messages/${user ? 'user' : 'chat'}/${message.peerId?.userId || message.peerId?.chatId}/avatar.jpg?accessHash=${user?.accessHash || chat?.accessHash || chat?.migratedTo?.accessHash}`,
                alt: title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
                title: title,
                subtitle: message.message || 'Send Media',
                date: message.date * 1000,
                unread: 0
              }
            }) || []}
          />
          {!searchMessages && <Typography.Paragraph style={{ textAlign: 'center' }}><Spin spinning={true} /></Typography.Paragraph>}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Accounts" key="accounts">
          {searchAccounts && !searchAccountList?.length && <Empty style={{ marginTop: '100px' }} />}
          <ChatList
            onClick={console.log}
            dataSource={searchAccountList?.map((user: any) => {
              const title = `${user.firstName || ''} ${user.lastName || ''}`.trim()
              return {
                id: `user/${user.id}`,
                key: user.id,
                avatar: `${apiUrl}/messages/user/${user.id}/avatar.jpg?accessHash=${user?.accessHash}`,
                alt: title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
                title: title,
                subtitle: user.username ? `@${user.username}` : user.phone,
                date: Date.now(),
                unread: 0
              }
            }) || []}
          />
          {!searchAccounts && <Typography.Paragraph style={{ textAlign: 'center' }}><Spin spinning={true} /></Typography.Paragraph>}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Global Search" key="globalSearch">
          {searchGlobal && !searcGlobalList?.messages?.length && <Empty style={{ marginTop: '100px' }} />}
          <ChatList
            onClick={console.log}
            dataSource={searcGlobalList?.messages.map((message: any) => {
              const user = message.peerId?.userId ? searcGlobalList?.users.find((user: any) => user.id === message.peerId?.userId) : null
              const channel = message.peerId?.channelId ? searcGlobalList?.chats.find((channel: any) => channel.id === message.peerId?.channelId) : null
              const title = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : channel?.title || ''
              return {
                id: `${user ? 'user' : 'channel'}/${message.peerId?.userId || message.peerId?.channelId}`,
                key: message.id,
                avatar: `${apiUrl}/messages/${user ? 'user' : 'channel'}/${message.peerId?.userId || message.peerId?.channelId}/avatar.jpg?accessHash=${user?.accessHash || channel?.accessHash || channel?.migratedTo?.accessHash}`,
                alt: title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
                title: title,
                subtitle: message.message || 'Send Media',
                date: message.date * 1000,
                unread: 0
              }
            }) || []}
          />
          {!searchGlobal && <Typography.Paragraph style={{ textAlign: 'center' }}><Spin spinning={true} /></Typography.Paragraph>}
        </Tabs.TabPane>
      </Tabs>}
      {!q && !message && <ChatList
        onClick={setMessage}
        dataSource={chatList?.map((dialog: any) => {
          return {
            key: `${dialog.isUser ? 'user' : 'channel'}/${dialog.entity?.id}`,
            avatar: `${apiUrl}/dialogs/${dialog.isUser ? 'user' : 'channel'}/${dialog.entity?.id}/avatar.jpg?accessHash=${dialog.entity.accessHash}`,
            alt: dialog.title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
            title: dialog.title,
            subtitle: dialog.message.message || 'Send Media',
            date: dialog.date * 1000,
            unread: dialog.dialog.unreadCount
          }
        }) || []}
      />}
    </Layout.Content>
  </Layout.Sider>
}

export default Messaging