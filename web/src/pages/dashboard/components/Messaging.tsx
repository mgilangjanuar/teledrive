import {
  ArrowLeftOutlined,
  CommentOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EnterOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SendOutlined
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Menu,
  notification,
  Spin,
  Tabs,
  Typography
} from 'antd'
import prettyBytes from 'pretty-bytes'
import React, { useEffect, useRef, useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { ChatItem, ChatList, MessageBox } from 'react-chat-elements'
import ReactMarkdown from 'react-markdown'
import { useHistory, useLocation } from 'react-router'
import remarkGfm from 'remark-gfm'
import useSWR from 'swr'
import { apiUrl, fetcher, req } from '../../../utils/Fetcher'

import 'react-chat-elements/dist/main.css'

interface Props {
  me?: any,
  collapsed?: boolean,
  parent?: any,
  setCollapsed: (data: boolean) => void
}

const Messaging: React.FC<Props> = ({ me, collapsed, parent, setCollapsed }) => {
  const [qVal, setQVal] = useState<string>()
  const [q, setQ] = useState<string>()
  const [messageText, setMessageText] = useState<string>()
  const [messageReply, setMessageReply] = useState<any>()
  const [messageForward, setMessageForward] = useState<any>()
  const [messageId, setMessageId] = useState<number>()
  const [loadingSend, setLoadingSend] = useState<boolean>()
  const [message, setMessage] = useState<any>()
  const [chatList, setChatLists] = useState<any>()
  const [chatListOffset, setChatListOffset] = useState<number>()
  const [searchMessageList, setSearchMessageList] = useState<any>()
  const [searcGlobalList, setSearcGlobalList] = useState<any>()
  const [searchAccountList, setSearchAccountList] = useState<any>()
  const [messages, setMessages] = useState<any>()
  const [messagesParsed, setMessagesParsed] = useState<any>()
  const [messagesOffset, setMessagesOffset] = useState<number>()
  const [width, setWidth] = useState<number>()
  const [popup, setPopup] = useState<{ visible: boolean, x?: number, y?: number, row?: any }>()
  const inputSend = useRef<any | null>()
  const history = useHistory()
  const { search: searchParams } = useLocation()
  const { currentTheme } = useThemeSwitcher()

  const { data: dialogs, mutate: refetchDialogs } = useSWR(!collapsed && !q && !message ? `/dialogs?limit=10${chatListOffset ? `&offset=${chatListOffset}` : ''}` : null, fetcher, { onSuccess: data => {
    setChatListOffset(undefined)
    setChatLists([...chatList?.filter((dialog: any) => !data.dialogs.find((d: any) => d.id === dialog.id)) || [], ...data.dialogs || []])
  } })
  const { data: searchMessages } = useSWR(q ? `/messages/search?q=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchMessageList(data.messages || []) })
  const { data: searchGlobal } = useSWR(q ? `/messages/globalSearch?q=${q}&limit=5` : null, fetcher, { onSuccess: data => setSearcGlobalList(data.messages || []) })
  const { data: searchAccounts } = useSWR(q ? `/users/search?username=${q}&limit=10` : null, fetcher, { onSuccess: data => setSearchAccountList(data.users || []) })
  const { data: messageHistory, mutate: refetchHistory } = useSWR(message && messagesOffset !== undefined  ? `/messages/history/${message.id}&limit=10&offset=${messagesOffset}` : null, fetcher, { onSuccess: data => {
    // setMessagesOffset(0)
    const res = {
      ...messages,
      ...data.messages,
      messages: [...messages?.messages.filter((msg: any) => !data.messages.messages.find((newMsg: any) => newMsg.id === msg.id)) || [], ...data.messages.messages],
      users: [...messages?.users.filter((user: any) => !data.messages.users.find((newUser: any) => newUser.id === user.id)) || [], ...data.messages.users],
      chats: [...messages?.chats.filter((chat: any) => !data.messages.chats.find((newChat: any) => newChat.id === chat.id)) || [], ...data.messages.chats]
    }
    setMessages(res)
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
      req.post(`/messages/read/${message.id}`).catch(() => {})
      // inputSend.current.focus()
    }
  }, [message])

  useEffect(() => {
    const msg = new URLSearchParams(location.search).get('msg') || null
    const chat = new URLSearchParams(location.search).get('chat') || null
    if (msg) {
      setMessage(JSON.parse(Buffer.from(decodeURIComponent(msg), 'base64').toString()))
    }
    setCollapsed(chat !== 'open')
  }, [])

  useEffect(() => {
    if (messageHistory?.messages) {
      // const sidebar = document.querySelector('.ant-layout-sider.ant-layout-sider-light.messaging')
      // if (sidebar) {
      //   sidebar.scroll({ top: sidebar.clientHeight, behavior: 'smooth' })
      //   // lastMessage.current.focus = true
      //   // lastMessage.current.refs.message.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      // }
    }
  }, [messageHistory])

  useEffect(() => {
    const setDataMessages = (dialog?: any, sponsoredMessages?: { messages: any[], chats: any[], users: any[] }) => {
      setMessagesParsed(messages?.messages.reduce((res: any[], msg: any) => {
        let user = messages?.users.find((user: any) => user.id === (msg.fromId || msg.peerId)?.userId)
        if (!user) {
          user = messages?.chats.find((user: any) => user.id === (msg.fromId || msg.peerId)?.channelId)
        }

        const replyMsg = messages?.messages.find((m: any) => m.id === msg.replyTo?.replyToMsgId)
        let replyUser = replyMsg ? messages?.users.find((user: any) => user.id === (replyMsg.fromId || replyMsg.peerId)?.userId) : null
        if (!replyUser && replyMsg) {
          replyUser = messages?.chats.find((user: any) => user.id === (replyMsg.fromId || replyMsg.peerId)?.channelId)
        }

        let fileTitle: string | null = null
        let size: number = 0
        if (msg?.media?.photo || msg?.media?.document) {
          const mimeType = msg?.media?.photo ? 'image/jpeg' : msg?.media?.document.mimeType || 'unknown'
          fileTitle = msg?.media?.photo ? `${msg?.media?.photo.id}.jpg` : msg?.media?.document.attributes?.find((atr: any) => atr.fileName)?.fileName || `${msg?.media?.document.id}.${mimeType.split('/').pop()}`
          const getSizes = (data: any) => data?.sizes ? data?.sizes.pop() : data?.size
          size = msg?.media?.photo ? getSizes(msg?.media?.photo.sizes.pop()) : msg?.media?.document?.size
        }
        return [
          ...res,
          fileTitle ? {
            id: `${message?.id.replace(/\?.*$/gi, '')}/${msg.id}`,
            messageId: message?.id,
            key: msg.id,
            position: me?.user.tg_id == user?.id ? 'right' : 'left',
            type: 'file',
            title: user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
            onTitleClick: () => user?.username ? window.open(`https://t.me/${user?.username}`, '_blank') : undefined,
            titleColor: '#0088CC',
            text: `${fileTitle.slice(0, 16)}${fileTitle.length > 16 ? '...' : ''}`,
            message: `${fileTitle.slice(0, 16)}${fileTitle.length > 16 ? '...' : ''}`,
            status: me?.user.tg_id == user?.id ? msg.id <= dialog?.dialog?.readOutboxMaxId ? 'read' : 'received' : undefined,
            date: msg.date * 1000,
            user,
            onDownload: () => download(msg),
            data: {
              size: size ? prettyBytes(Number(size)) : undefined,
              status: {
                error: false,
                download: false,
                click: false
              }
            }
          } : null,
          msg.action?.className === 'MessageActionContactSignUp' ? {
            key: msg.id,
            type: 'system',
            date: msg.date * 1000,
            text: <><strong>{user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown'}</strong> joined Telegram!</>
          } : msg.action?.className === 'MessageActionChatAddUser' ? {
            key: msg.id,
            type: 'system',
            date: msg.date * 1000,
            text: <><strong>{user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown'}</strong> joined the group</>
          } : msg.message ? {
            id: `${message?.id.replace(/\?.*$/gi, '')}/${msg.id}`,
            messageId: message?.id,
            key: msg.id,
            position: me?.user.tg_id == user?.id ? 'right' : 'left',
            type: 'text',
            status: me?.user.tg_id == user?.id ? msg.id <= dialog?.dialog?.readOutboxMaxId ? 'read' : 'received' : undefined,
            title: user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
            onTitleClick: () => user?.username ? window.open(`https://t.me/${user?.username}`, '_blank') : undefined,
            text: <ReactMarkdown className="messageItem" remarkPlugins={[remarkGfm]}>{msg.message ? `${msg.message.replaceAll('\n', '  \n')}${msg.editDate && !msg.editHide ? '\n\n_(edited)_' : ''}${msg.fwdFrom ? '\n\n_(forwarded)_' : ''}` : 'Unknown message'}</ReactMarkdown>,
            message: msg.message,
            fwdFrom: msg.fwdFrom,
            date: msg.date * 1000,
            titleColor: '#0088CC',
            user,
            reply: replyMsg ? {
              title: replyUser ? replyUser.title || `${replyUser.firstName || ''} ${replyUser.lastName || ''}`.trim() : 'Unknown',
              titleColor: '#0088CC',
              message: replyMsg.message || 'Unknown message'
            } : undefined
          } : null
        ]
      }, sponsoredMessages?.messages?.map((msg: any) => {
        let user = sponsoredMessages?.users.find((user: any) => user.id === (msg.fromId || msg.peerId)?.userId)
        if (!user) {
          user = sponsoredMessages?.chats.find((user: any) => user.id === (msg.fromId || msg.peerId)?.channelId)
        }
        return {
          id: `${message?.id.replace(/\?.*$/gi, '')}/sponsor`,
          messageId: message?.id,
          key: 'sponsor',
          position: 'left',
          type: 'text',
          // status: me?.user.tg_id == user?.id ? msg.id <= dialog?.dialog?.readOutboxMaxId ? 'read' : 'received' : undefined,
          title: user ? user.title || `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
          onTitleClick: () => user?.username ? window.open(`https://t.me/${user?.username}`, '_blank') : undefined,
          text: <ReactMarkdown className="messageItem" remarkPlugins={[remarkGfm]}>{msg.message ? `${msg.message.replaceAll('\n', '  \n')}\n\n_(sponsored message)_` : 'Unknown message'}</ReactMarkdown>,
          message: msg.message,
          fwdFrom: msg.fwdFrom,
          date: new Date().getTime(),
          // titleColor: `#${`${user?.id.toString(16)}000000`.slice(0, 6)}`,
          user
        }
      }) || []).filter(Boolean).sort((a: any, b: any) => a.date - b.date)  || [])
      // messageList.current?.scrollToRow = 50
    }
    if (message) {
      req.get(`/dialogs/${message.id}`).then(({ data }) => {
        req.get(`/messages/sponsoredMessages/${message.id}`).then(({ data: sponsoredData }) => {
          setDataMessages(data.dialog, sponsoredData?.messages)
          sponsoredData.messages?.messages.map((msg: any) => req.post(`/messages/readSponsoredMessages/${message.id}`, { random_id: msg.randomId?.data }))
          // const sidebar = document.querySelector('.ant-layout-sider.ant-layout-sider-light.messaging')
          // if (sidebar) {
          //   sidebar.scroll({ top: sidebar.scrollHeight, behavior: 'smooth' })
          // }
        }).catch(_ => {
          setDataMessages(data.dialog)
        })
      })
    } else {
      setDataMessages()
    }
  }, [messages])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const chat = params.get('chat')
    const msg = params.get('msg')
    const q = params.get('qmsg')

    setCollapsed(chat !== 'open')

    if (msg) {
      const msgObj = JSON.parse(Buffer.from(decodeURIComponent(msg), 'base64').toString())
      setMessage(msgObj)
      if (messageForward) {
        const [typeFrom, othersFrom] = messageForward.messageId.replace('?t=1', '').split('/')
        const [idFrom, accessHashFrom] = othersFrom.split('?accessHash=')
        const [typeTo, othersTo] = msgObj.id.replace('?t=1', '').split('/')
        const [idTo, accessHashTo] = othersTo.split('?accessHash=')
        req.post(`/messages/forward/${messageForward.key}`, {
          from: {
            type: typeFrom,
            id: idFrom,
            accessHash: accessHashFrom
          },
          to: {
            type: typeTo,
            id: idTo,
            accessHash: accessHashTo
          }
        }).then(refetchHistory)
        setMessageForward(undefined)
      }
    } else {
      setMessage(undefined)
      setMessagesOffset(undefined)
      // const sidebar = document.querySelector('.ant-layout-sider.ant-layout-sider-light.messaging')
      // sidebar?.scroll({ top: 0, behavior: 'smooth' })
    }

    if (q) {
      setQ(q)
    } else {
      setQ(undefined)
      setQVal(undefined)
    }

    if (chat === 'open') {
      setTimeout(() => {
        const base = document.querySelector('.ant-layout-sider.messaging')
        if (base) {
          setWidth(base.clientWidth)
        }
      }, 1000)
    }
  }, [searchParams])

  const open = () => {
    const searchParams = new URLSearchParams(window.location.search)
    if (collapsed) {
      searchParams.set('chat', 'open')
    } else {
      searchParams.delete('chat')
    }
    history.push(`${window.location.pathname}?${searchParams.toString()}`)
  }

  const openMessage = (message: any) => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('msg', encodeURIComponent(Buffer.from(JSON.stringify(message)).toString('base64')))
    history.push(`${window.location.pathname}?${searchParams.toString()}`)
  }

  const search = (val?: string) => {
    const searchParams = new URLSearchParams(window.location.search)
    if (val) {
      searchParams.set('qmsg', val)
    } else {
      searchParams.delete('qmsg')
    }
    history.push(`${window.location.pathname}?${searchParams.toString()}`)
  }

  const back = () => {
    history.goBack()
  }

  const download = async (msg: any) => {
    const [type, others] = message.id.replace('?t=1', '').split('/')
    const [id, accessHash] = others.split('?accessHash=')
    const forwardKey = `${type}/${id}/${msg.id}${accessHash ? `/${accessHash}` : ''}`
    const { data: files } = await req.get('/files', { params: { forward_info: forwardKey } })
    if (files?.files?.[0]) {
      const file = files?.files?.[0]
      return history.push(`/view/${file.id}`)
    }

    const { data: file } = await req.post('/files', { file:
      {
        parent_id: parent?.link_id || parent?.id,
        forward_info: forwardKey,
        id: undefined
      }
    }, {
      params: {
        messageId: msg.id
      }
    })

    return history.push(`/view/${file.file.id}`)
  }

  const remove = async (msg: any) => {
    await req.delete(`/messages/${msg.id}`)
    setMessages({
      ...messages,
      messages: messages?.messages.filter((message: any) => message.id != msg.id.split('/')[msg.id.split('/').length - 1])
    })
    notification.success({ message: 'Message deleted!' })
  }

  const sendMessage = async () => {
    if (!messageText) {
      return notification.error({
        message: 'Error',
        description: 'Please write your message first'
      })
    }

    setLoadingSend(true)
    try {
      if (messageId) {
        const [type, others] = message.id.replace('?t=1', '').split('/')
        const [id, accessHash] = others.split('?accessHash=')
        await req.patch(`/messages/${type}/${id}/${messageId}`, { message: messageText }, { params: accessHash ? { accessHash } : {} })
        setMessagesParsed(messagesParsed?.map((message: any) => message.key == messageId ? {
          ...message,
          message: messageText,
          text: <ReactMarkdown className="messageItem" remarkPlugins={[remarkGfm]}>{messageText ? `${messageText.replaceAll('\n', '  \n')}\n\n_(edited)_` : 'Unknown message'}</ReactMarkdown>
        } : message))
        setMessageId(undefined)
      } else {
        await req.post(`/messages/send/${message?.id}`, {
          message: messageText, ...messageReply?.key ? { replyToMsgId: messageReply.key } : {} })
        refetchHistory()
      }
      setMessageText(undefined)
      setMessageReply(undefined)
    } catch (error: any) {
      setLoadingSend(false)
      return notification.error({
        message: 'Error',
        description: <>
          <Typography.Paragraph>
            {error?.response?.data?.error || error.message || 'Something error'}
          </Typography.Paragraph>
          <Typography.Paragraph code>
            {JSON.stringify(error?.response?.data || error?.data || error, null, 2)}
          </Typography.Paragraph>
        </>
      })
    }
    return setLoadingSend(false)
  }

  const ContextMenu = () => {
    const baseProps = {
      style: { margin: 0 }
    }
    if (!popup?.visible) return <></>
    if (popup?.row) {
      return <Menu style={{ zIndex: 1, position: 'absolute', left: `${popup?.x}px`, top: `${popup?.y}px`, boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' }}>
        <Menu.Item {...baseProps}
          icon={<ArrowRightOutlined />}
          key="forward"
          onClick={() => {
            setMessageForward(popup.row)
            const searchParams = new URLSearchParams(window.location.search)
            searchParams.delete('msg')
            history.push(`${window.location.pathname}?${searchParams.toString()}`)
          }}>Forward</Menu.Item>
        <Menu.Item {...baseProps}
          icon={<EnterOutlined />}
          key="reply"
          onClick={() => setMessageReply(popup.row)}>Reply</Menu.Item>
        {me?.user.tg_id == popup.row.user?.id && <>
          {popup.row.type === 'text' && !popup.row.fwdFrom && <Menu.Item {...baseProps}
            icon={<EditOutlined />}
            key="edit"
            onClick={() => {
              console.log(popup.row.key)
              setMessageId(popup.row.key)
              setMessageText(popup.row.message)
            }}>Edit</Menu.Item>}
          <Menu.Item {...baseProps}
            icon={<DeleteOutlined />}
            key="delete"
            danger
            onClick={() => remove(popup.row)}>Delete</Menu.Item>
        </>}
      </Menu>
    }
    return <></>
  }

  return <Layout.Sider
    theme={currentTheme === 'dark' ? 'dark' : 'light'}
    className="messaging"
    trigger={null}
    collapsedWidth={0}
    collapsed={collapsed}
    onCollapse={setCollapsed}
    style={{
      overflowX: 'hidden',
      boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      background: currentTheme === 'dark' ? undefined : 'rgb(240, 242, 245) none repeat scroll 0% 0%',
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      zIndex: 1,
      marginBottom: 0 }}>
    <Layout.Header style={{ background: currentTheme === 'dark' ? '#1f1f1f' : '#0088CC', position: 'fixed', zIndex: 2, padding: '0 15px', width: width || '100%' }}>
      <div key="logo" className="logo" style={{ display: 'inline', width: '100%' }}>
        <div style={{ float: 'left' }}>
          <Button icon={<ArrowLeftOutlined />} size="large" type="link" style={{ color: '#fff' }} onClick={back} />
        </div>
        {message ? <div style={{ float: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '78%' }}>
          <Avatar src={message?.avatar} /> &nbsp; {message?.title}
        </div> : <div style={{ float: 'left' }}>
          Quick Message
        </div>}
        {(!q || message) && <div style={{ float: 'right' }}>
          <Button icon={!dialogs && !messageHistory ? <LoadingOutlined /> : <ReloadOutlined />} onClick={() => message ? refetchHistory() : refetchDialogs()} type="text" style={{ color: '#fff' }} />
        </div>}
      </div>
    </Layout.Header>
    <Layout.Content className="container" style={{ marginTop: '60px', paddingBottom: '10px', marginBottom: 0, minHeight: '87.5vh' }}>
      {message ? <>
        <Typography.Paragraph style={{ textAlign: 'center' }}>
          <Button shape="round" loading={!messageHistory} onClick={() => setMessagesOffset(messages?.messages.sort((a: any, b: any) => a.date - b.date)[0].id || 0)}>Load more</Button>
        </Typography.Paragraph>
        <List itemLayout="vertical" loading={!messageHistory} dataSource={messagesParsed} renderItem={(item: any) => <List.Item key={item.key} style={{ padding: 0 }} onClick={() => setPopup({ visible: false })} onContextMenu={e => {
          if (item.type !== 'system') {
            e.preventDefault()
            if (!popup?.visible) {
              document.addEventListener('click', function onClickOutside() {
                setPopup({ visible: false })
                document.removeEventListener('click', onClickOutside)
              })
            }
            const parent = document.querySelector('.ant-layout-content.container')
            setPopup({
              visible: true,
              x: e.clientX - (parent?.getBoundingClientRect().left || 0) - 100,
              y: e.clientY - (parent?.getBoundingClientRect().top || 0),
              row: item
            })
          }
        }}>
          <MessageBox {...item} />
        </List.Item>} />
        <ContextMenu />
      </> : <>
        <Typography.Paragraph>
          <Input.Search value={qVal} onChange={(e) => setQVal(e.target.value)} className="input-search-round" placeholder="Search by username or message..." enterButton onSearch={search} allowClear />
        </Typography.Paragraph>

        {q && !message && <Tabs defaultActiveKey="accounts">
          <Tabs.TabPane tab="Accounts" key="accounts">
            {searchAccounts && !searchAccountList?.length && <Empty style={{ marginTop: '100px' }} />}
            <ChatList
              onClick={openMessage}
              dataSource={searchAccountList?.map((user: any) => {
                const title = `${user.firstName || ''} ${user.lastName || ''}`.trim()
                return {
                  id: `user/${user.id}${user?.accessHash ? `?accessHash=${user?.accessHash}` : '?t=1'}`,
                  key: user.id,
                  avatar: `${apiUrl}/messages/user/${user.id}/avatar.jpg${user?.accessHash ? `?accessHash=${user?.accessHash}` : '?t=1'}`,
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
          <Tabs.TabPane tab="Messages" key="messages">
            {searchMessages && !searchMessageList?.messages?.length && <Empty style={{ marginTop: '100px' }} />}
            <ChatList
              onClick={openMessage}
              dataSource={searchMessageList?.messages.map((message: any) => {
                const user = message.peerId?.userId ? searchMessageList?.users.find((user: any) => user.id === message.peerId?.userId) : null
                const chat = message.peerId?.chatId ? searchMessageList?.chats.find((chat: any) => chat.id === message.peerId?.chatId) : null
                const title = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : chat?.title || ''
                return {
                  id: `${user ? 'user' : 'chat'}/${message.peerId?.userId || message.peerId?.chatId}${user?.accessHash || chat?.accessHash || chat?.migratedTo?.accessHash ? `?accessHash=${user?.accessHash || chat?.accessHash || chat?.migratedTo?.accessHash}` : '?t=1'}`,
                  key: message.id,
                  avatar: `${apiUrl}/messages/${user ? 'user' : 'chat'}/${message.peerId?.userId || message.peerId?.chatId}/avatar.jpg${user?.accessHash || chat?.accessHash || chat?.migratedTo?.accessHash ? `?accessHash=${user?.accessHash || chat?.accessHash || chat?.migratedTo?.accessHash}` : '?t=1'}`,
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
          <Tabs.TabPane tab="Global Search" key="globalSearch">
            {searchGlobal && !searcGlobalList?.messages?.length && <Empty style={{ marginTop: '100px' }} />}
            <ChatList
              onClick={openMessage}
              dataSource={searcGlobalList?.messages.map((message: any) => {
                const user = message.peerId?.userId ? searcGlobalList?.users.find((user: any) => user.id === message.peerId?.userId) : null
                const channel = message.peerId?.channelId || message.peerId?.chatId ? searcGlobalList?.chats.find((channel: any) => channel.id === (message.peerId?.channelId || message.peerId?.chatId)) : null
                const title = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : channel?.title || ''
                return {
                  id: `${user ? 'user' : 'channel'}/${message.peerId?.userId || message.peerId?.channelId}${user?.accessHash || channel?.accessHash || channel?.migratedTo?.accessHash ? `?accessHash=${user?.accessHash || channel?.accessHash || channel?.migratedTo?.accessHash}` : '?t=1'}`,
                  key: message.id,
                  avatar: `${apiUrl}/messages/${user ? 'user' : message.peerId?.chatId ? 'chat' : 'channel'}/${message.peerId?.userId || message.peerId?.channelId || message.peerId?.chatId}/avatar.jpg${user?.accessHash || channel?.accessHash || channel?.migratedTo?.accessHash ? `?accessHash=${user?.accessHash || channel?.accessHash || channel?.migratedTo?.accessHash}` : '?t=1'}`,
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
          <List itemLayout="vertical" loading={!dialogs} loadMore={<Typography.Paragraph style={{ textAlign: 'center', marginTop: '15px' }}>
            <Button loading={!dialogs} onClick={() => setChatListOffset(chatList?.sort((a: any, b: any) => b.pinned === a.pinned ? b.date - a.date : b.pinned - a.pinned)[chatList?.length - 1].date)} shape="round">Load more</Button>
          </Typography.Paragraph>} dataSource={chatList?.sort((a: any, b: any) => b.pinned === a.pinned ? b.date - a.date : b.pinned - a.pinned).map((dialog: any) => {
            const peerType = dialog.isUser ? 'user' : dialog.isChannel ? 'channel' : 'chat'
            return {
              id: `${peerType}/${dialog.entity?.id}${dialog.entity?.accessHash ? `?accessHash=${dialog.entity?.accessHash}` : '?t=1'}`,
              key: dialog.id,
              avatar: `${apiUrl}/dialogs/${peerType}/${dialog.entity?.id}/avatar.jpg${dialog.entity?.accessHash ? `?accessHash=${dialog.entity?.accessHash}` : '?t=1'}`,
              alt: dialog.title?.split(' ')?.map((word: string) => word[0]).slice(0, 2).join('').toUpperCase(),
              title: me?.user.tg_id == dialog.entity?.id ? 'Saved Messages' : dialog.title,
              subtitle: dialog.message.message || 'Unknown message',
              date: dialog.date * 1000,
              unread: dialog.dialog.unreadCount
            }
          }) || []} renderItem={(item: any) => <List.Item key={item.key} style={{ padding: 0 }}><ChatItem {...item} onClick={() => openMessage(item)} /></List.Item>} />
        </>}
      </>}
    </Layout.Content>
    {message && <Layout.Footer style={{ padding: '10px 20px', position: 'sticky', bottom: 0, width: width || '100%' }}>
      {messageReply?.message && <Typography.Paragraph>
        <Button danger size="small" type="text" onClick={() => setMessageReply(undefined)} icon={<CloseCircleOutlined />} />
        Reply: {messageReply?.message}
      </Typography.Paragraph>}
      <Form.Item style={{ display: 'inherit', margin: 0 }}>
        <Input.TextArea ref={inputSend} style={{ width: '88%', borderRadius: '16px' }} autoSize value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
            sendMessage()
          }
        }} />
        <div style={{ float: 'right' }}>
          <Button loading={loadingSend} icon={<SendOutlined />} shape="circle" type="primary" onClick={sendMessage} />
        </div>
      </Form.Item>
    </Layout.Footer>}
    {collapsed && <Button shape="circle" size="large" style={{ position: 'fixed', right: 30, bottom: 25, ...collapsed ? {} : { display: 'none' } }} type="primary" icon={<CommentOutlined />} onClick={open} />}
  </Layout.Sider>
}

export default Messaging