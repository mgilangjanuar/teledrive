import { ArrowLeftOutlined, CloseOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons'
import { Avatar, Button, Empty, Input, Layout, Spin, Tabs, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { ChatList, MessageList } from 'react-chat-elements'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useSWR from 'swr'
import { apiUrl, fetcher } from '../../../utils/Fetcher'

import 'react-chat-elements/dist/main.css'

interface Props {
  me?: any,
  collapsed?: boolean,
  setCollapsed: (data: boolean) => void
}

const Messaging: React.FC<Props> = ({ me, collapsed, setCollapsed }) => {
  const [qVal, setQVal] = useState<string>()
  const [q, setQ] = useState<string>()
  const [messageText, setMessageText] = useState<string>()
  const [message, setMessage] = useState<any>()
  const [chatList, setChatLists] = useState<any>()
  const [searchMessageList, setSearchMessageList] = useState<any>()
  const [searcGlobalList, setSearcGlobalList] = useState<any>()
  const [searchAccountList, setSearchAccountList] = useState<any>()
  const [messages, setMessages] = useState<any>()
  const [messagesOffset, setMessagesOffset] = useState<number>()

  const { data: dialogs } = useSWR(!collapsed && !q && !message ? '/dialogs?limit=10' : null, fetcher, { onSuccess: data => setChatLists(data.dialogs || []) })
  const { data: searchMessages } = useSWR(q ? `/messages/search?q=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchMessageList(data.messages || []) })
  const { data: searchGlobal } = useSWR(q ? `/messages/globalSearch?q=${q}&limit=5` : null, fetcher, { onSuccess: data => setSearcGlobalList(data.messages || []) })
  const { data: searchAccounts } = useSWR(q ? `/users/search?username=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchAccountList(data.users || []) })
  const { data: messageHistory } = useSWR(message && messagesOffset !== undefined  ? `/messages/history/${message.id}&limit=10&offset=${messagesOffset}` : null, fetcher, { onSuccess: data => {
    return setMessages({
      ...messages,
      ...data.messages,
      messages: [...messages?.messages.filter((msg: any) => !data.messages.messages.find((newMsg: any) => newMsg.id === msg.id)) || [], ...data.messages.messages],
      users: [...messages?.users.filter((user: any) => !data.messages.users.find((newUser: any) => newUser.id === user.id)) || [], ...data.messages.users],
      chats: [...messages?.chats.filter((chat: any) => !data.messages.chats.find((newChat: any) => newChat.id === chat.id)) || [], ...data.messages.chats]
    })
  } })

  useEffect(() => {
    setSearchMessageList(undefined)
    setSearcGlobalList(undefined)
    setSearchAccountList(undefined)
  }, [q])

  useEffect(() => {
    setMessages(undefined)
    if (message) {
      setMessagesOffset(0)
    }
  }, [message])

  useEffect(() => {
    if (messages) {
      const sidebar = document.querySelector('.ant-layout-sider.ant-layout-sider-light.messaging')
      if (sidebar) {
        sidebar.scroll({ top: sidebar.clientHeight, behavior: 'auto' })
      }
    }
  }, [messages])

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
    style={{ boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', background: 'rgb(240, 242, 245) none repeat scroll 0% 0%', position: 'absolute', right: 0, width: '100%', height: '100%', overflowY: 'scroll', zIndex: 1, marginBottom: 0 }}>
    <Layout.Header style={{ background: '#0088CC', position: 'fixed', zIndex: 2, width: '100%', paddingLeft: '15px' }}>
      <div key="logo" className="logo" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} size="large" type="link" style={{ color: '#fff' }} onClick={back} />
        {message ? <span><Avatar src={message?.avatar} /> {message?.title}</span> : 'Quick Message'}
      </div>
    </Layout.Header>
    <Layout.Content className="container" style={{ marginTop: '60px', marginBottom: '60px' }}>
      {message ? <>
        <Typography.Paragraph style={{ textAlign: 'center' }}>
          <Button shape="round" loading={!messageHistory} onClick={() => setMessagesOffset(messages?.messages.sort((a: any, b: any) => a.date - b.date)[0].date)}>Load more</Button>
        </Typography.Paragraph>
        <MessageList
          className="message-list"
          lockable={true}
          dataSource={messages?.messages.sort((a: any, b: any) => a.date - b.date).map((message: any) => {
            let user = messages?.users.find((user: any) => user.id === (message.fromId || message.peerId)?.userId)
            if (!user) {
              user = messages?.chats.find((user: any) => user.id === (message.fromId || message.peerId)?.channelId)
            }
            return message.action?.className === 'MessageActionChatAddUser' ? {
              type: 'system',
              text: <><strong>{user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown'}</strong> joined the group</>
            } : {
              position: me?.user.tg_id == user?.id ? 'right' : 'left',
              type: 'text',
              title: user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
              text: <ReactMarkdown className="messageItem" remarkPlugins={[remarkGfm]}>{message.message || 'Send Media'}</ReactMarkdown>,
              date: message.date * 1000,
            }
          }) || []}
        />
        {!messageHistory && <Typography.Paragraph style={{ textAlign: 'center' }}><Spin spinning={true} /></Typography.Paragraph>}
      </> : <>
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
              onClick={setMessage}
              dataSource={searchAccountList?.map((user: any) => {
                const title = `${user.firstName || ''} ${user.lastName || ''}`.trim()
                return {
                  id: `user/${user.id}?accessHash=${user?.accessHash}`,
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

        {!q && !message && <>
          <ChatList
            onClick={setMessage}
            dataSource={chatList?.map((dialog: any) => {
              return {
                id: `${dialog.isUser ? 'user' : 'channel'}/${dialog.entity?.id}?accessHash=${dialog.entity?.accessHash}`,
                key: dialog.id,
                avatar: `${apiUrl}/dialogs/${dialog.isUser ? 'user' : 'channel'}/${dialog.entity?.id}/avatar.jpg?accessHash=${dialog.entity.accessHash}`,
                alt: dialog.title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
                title: dialog.title,
                subtitle: dialog.message.message || 'Send Media',
                date: dialog.date * 1000,
                unread: dialog.dialog.unreadCount
              }
            }) || []}
          />
          {!dialogs && <Typography.Paragraph style={{ textAlign: 'center' }}><Spin spinning={true} /></Typography.Paragraph>}
        </>}
      </>}
    </Layout.Content>
    {message ? <Layout.Footer style={{ padding: '20px 20px 5px', position: 'fixed', bottom: 0, width: document.querySelector('.ant-layout-sider.ant-layout-sider-light.messaging')?.clientWidth }}>
      <Typography.Paragraph>
        <Input.Search value={messageText} onChange={(e) => setMessageText(e.target.value)} className="input-search-round" placeholder="Type your message..." enterButton={<SendOutlined />} onSearch={console.log} allowClear />
      </Typography.Paragraph>
    </Layout.Footer> : <Button shape="circle" size="large" style={{ position: 'fixed', right: 30, bottom: 30 }} type="primary" icon={collapsed ? <CommentOutlined /> : <CloseOutlined />} onClick={() => setCollapsed(!collapsed)} />}
  </Layout.Sider>
}

export default Messaging