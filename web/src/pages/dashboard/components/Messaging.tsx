import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Layout } from 'antd'
import React, { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce/lib'
import { ChatList } from 'react-chat-elements'

import 'react-chat-elements/dist/main.css'

interface Props {
  collapsed?: boolean,
  setCollapsed: (data: boolean) => void
}

const Messaging: React.FC<Props> = ({ collapsed, setCollapsed }) => {
  const [contentStyle, setContentStyle] = useState<{ display: string } | undefined>()
  const [showContent] = useDebounce(collapsed, 250)

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
      <ChatList
        className='chat-list'
        dataSource={[
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
          {
            avatar: 'https://facebook.github.io/react/img/logo.svg',
            alt: 'Reactjs',
            title: 'Facebook',
            subtitle: 'What are you doing?',
            date: new Date(),
            unread: 0,
          },
        ]}
      />
    </Layout.Content>
  </Layout.Sider>
}

export default Messaging