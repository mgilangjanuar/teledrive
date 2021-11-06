import { CrownOutlined, DashboardOutlined, LoginOutlined, MenuOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Popover, Tag } from 'antd'
import React from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

interface Props {
  user?: any,
  page?: string
}


const Navbar: React.FC<Props> = ({ user, page }) => {
  const history = useHistory()

  return <>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo" style={{ marginRight: '30px' }}>
        <Link to="/" style={{ color: '#fff' }}>
          <img style={{ width: '24px' }} src="/logo192.png" alt="icon.png" />&nbsp; TeleDrive {user?.plan === 'premium' && <Popover placement="bottom" content={<>Premium</>}>
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
        <Button onClick={() => history.push('/dashboard')} type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<DashboardOutlined />}>Dashboard</Button> :
        <Button onClick={() => history.push('/login')} type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<LoginOutlined />}>Login</Button>}
      <Menu overflowedIndicator={<MenuOutlined />} mode="horizontal" triggerSubMenuAction="click" defaultSelectedKeys={page ? [page] : undefined} theme="dark" style={{ background: '#0088CC', position: 'relative', display: 'flex', justifyContent: 'right' }}>
        <Menu.Item onClick={() => history.push('/faq')} key="faq">FAQ</Menu.Item>
        <Menu.Item onClick={() => history.push('/pricing')} key="pricing">Pricing</Menu.Item>
        <Menu.Item onClick={() => history.push('/contact')} key="contact">Contact Us</Menu.Item>
        <Menu.Item onClick={() => history.push('/privacy')} key="privacy">Privacy Policy</Menu.Item>
        <Menu.Item onClick={() => history.push('/terms')} key="terms">Terms</Menu.Item>
      </Menu>
    </Layout.Header>
  </>
}

export default Navbar