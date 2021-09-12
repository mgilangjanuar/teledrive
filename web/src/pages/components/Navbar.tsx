import { LogoutOutlined } from '@ant-design/icons'
import { Avatar, Layout, Menu } from 'antd'
import React from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { apiUrl, req } from '../../utils/Fetcher'

interface Props {
  user?: any
}


const Navbar: React.FC<Props> = ({ user }) => {
  const history = useHistory()

  const logout = () => {
    req.post('/auth/logout')
    history.replace('/')
  }

  return <>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo">
        <Link to="/" style={{ color: '#fff' }}>
          <img style={{ width: '24px' }} src="/logo192.png" alt="icon.png" />&nbsp; TeleDrive
        </Link>
      </div>
      {user ? <Menu key="menu" mode="horizontal" style={{ float: 'right', background: '#0088CC' }}>
        <Menu.SubMenu key="user" icon={<Avatar src={`${apiUrl}/users/me/photo`} />}>
          <Menu.Item danger key="logout" onClick={logout} icon={<LogoutOutlined />}>Logout</Menu.Item>
        </Menu.SubMenu>
      </Menu> : ''}
    </Layout.Header>
  </>
}

export default Navbar