import { CrownOutlined, DashboardOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Dropdown, Layout, Menu, Modal, Popover, Tag, Typography } from 'antd'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { req } from '../../utils/Fetcher'

interface Props {
  user?: any,
  page?: string
}


const Navbar: React.FC<Props> = ({ user, page }) => {
  const history = useHistory()
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)

  const logout = async () => {
    await req.post('/auth/logout')
    return window.location.replace('/')
  }

  return <>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo" style={{ marginRight: '30px' }}>
        <Link to="/" style={{ color: '#fff' }}>
          <img src="/teledrive-logo/logoteledrive-white.png" style={{ height: '24px' }} /> {user?.plan === 'premium' && <Popover placement="bottom" content={<>Premium</>}>
            <CrownOutlined />
          </Popover>}
        </Link>
        <span>
          &nbsp;
          {location.host.match(/localhost/gi)
            ? <Tag color="green">Preview</Tag> : location.host.match(/^teledrive.*\.vercel\.app$/gi)
              ? <Tag color="blue">Staging</Tag> : location.host !== 'teledriveapp.com' && <Tag color="red">Unofficial</Tag>}
        </span>
      </div>
      {user ?
        <Dropdown trigger={['click']} overlay={<Menu>
          <Menu.Item key="dashboard" icon={<DashboardOutlined />} onClick={() => history.push('/dashboard')}>Dashboard</Menu.Item>
          <Menu.Item danger key="logout" icon={<LogoutOutlined />} onClick={() => setLogoutConfirmation(true)}>Logout</Menu.Item>
        </Menu>}>
          <Button type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<UserOutlined />} />
        </Dropdown> :
        <Button onClick={() => history.push('/login')} type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<LoginOutlined />}>Login</Button>}
      <Menu overflowedIndicator={<MenuOutlined />} mode="horizontal" triggerSubMenuAction="click" defaultSelectedKeys={page ? [page] : undefined} theme="dark" style={{ background: '#0088CC', position: 'relative', display: 'flex', justifyContent: 'right' }}>
        <Menu.Item onClick={() => history.push('/faq')} key="faq">FAQ</Menu.Item>
        <Menu.Item onClick={() => history.push('/pricing')} key="pricing">Pricing</Menu.Item>
        <Menu.Item onClick={() => history.push('/contact')} key="contact">Contact Us</Menu.Item>
        <Menu.Item onClick={() => history.push('/privacy')} key="privacy">Privacy Policy</Menu.Item>
        <Menu.Item onClick={() => history.push('/terms')} key="terms">Terms</Menu.Item>
      </Menu>
    </Layout.Header>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Confirmation
    </Typography.Text>}
    visible={logoutConfirmation}
    onCancel={() => setLogoutConfirmation(false)}
    onOk={logout}
    okButtonProps={{ danger: true, type: 'primary' }}>
      <Typography.Paragraph>
        All the files you share will not be able to download once you sign out. Continue?
      </Typography.Paragraph>
    </Modal>
  </>
}

export default Navbar