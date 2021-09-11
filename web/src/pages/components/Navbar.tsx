import { UserOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { Link } from 'react-router-dom'
import React from 'react'

interface Props {
  user?: any
}

const Navbar: React.FC<Props> = ({ user }) => {
  return <>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo">
        <Link to="/" style={{ color: '#fff' }}>
          <img style={{ width: '24px' }} src="/logo192.png" alt="icon.png" />&nbsp; TeleDrive
        </Link>
      </div>
      {user ? <Menu key="menu" mode="horizontal" theme="dark" style={{ float: 'right' }}>
        <Menu.SubMenu key="user" icon={<UserOutlined />}>
          <Menu.Item key="email">{user?.email || 'Anonymous'}</Menu.Item>
        </Menu.SubMenu>
      </Menu> : ''}
    </Layout.Header>
  </>
}

export default Navbar