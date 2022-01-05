import { CrownOutlined, DashboardOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, SettingOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, Modal, Popover, Progress, Tag, Tooltip, Typography } from 'antd'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { fetcher, req } from '../../utils/Fetcher'

interface Props {
  user?: any,
  page?: string
}


const Navbar: React.FC<Props> = ({ user, page }) => {
  const history = useHistory()
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)
  const { data: usage } = useSWR('/users/me/usage', fetcher)

  const logout = async () => {
    await req.post('/auth/logout')
    return window.location.replace('/')
  }

  return <>
    <Layout.Header style={{ background: user?.settings?.theme === 'dark' ? '#1f1f1f' : '#0088CC' }}>
      <div key="logo" className="logo" style={{ marginRight: '30px' }}>
        <Link to="/" style={{ color: '#fff' }}>
          <img src="/teledrive-logo/logoteledrive-white.png" style={{ height: '24px' }} /> {user?.plan === 'premium' && <Popover placement="bottom" content={<Layout style={{ padding: '7px 13px' }}>Premium</Layout>}>
            <CrownOutlined />
          </Popover>}
        </Link>
        <span>
          &nbsp;
          {location.host.match(/localhost/gi)
            ? <Tag color="green">Preview</Tag> : location.host.match(/^teledrive.*\.vercel\.app$/gi)
              ? <Tag color="blue">Staging</Tag> : !/^(\w*\.)?teledriveapp\.com$/.test(location.host) && <Tag color="red">Unofficial</Tag>}
        </span>
      </div>
      {user ?
        <Popover placement="bottomRight" trigger={['click']} content={<div>
          <div style={{ padding: '10px' }}>
            Bandwidth usage: { }
            {user?.plan === 'premium' ? <Tag color="green">Unlimited</Tag> : <Tooltip placement="left" title={<>You can download up to {prettyBytes(Math.max(0, 1_500_000_000 - Number(usage?.usage.usage)))} until {moment(usage?.usage.expire).local().format('lll')}</>}>
              <Progress status="exception" percent={Number((Number(usage?.usage.usage || 0) / 1_500_000_000 * 100).toFixed(1))} />
            </Tooltip>}
          </div>
          <Menu>
            <Menu.Item key="dashboard" icon={<DashboardOutlined />} onClick={() => history.push('/dashboard')}>Dashboard</Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => history.push('/settings')}>Settings</Menu.Item>
            <Menu.Item danger key="logout" icon={<LogoutOutlined />} onClick={() => setLogoutConfirmation(true)}>Logout</Menu.Item>
          </Menu>
        </div>}>
          <Button type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<UserOutlined />} />
        </Popover> :
        <Button onClick={() => history.push('/login')} type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<LoginOutlined />}>Login</Button>}
      <Menu overflowedIndicator={<MenuOutlined />} mode="horizontal" triggerSubMenuAction="click" defaultSelectedKeys={page ? [page] : undefined} theme="dark" style={{ background: user?.settings?.theme === 'dark' ? '#1f1f1f' : '#0088CC', position: 'relative', display: 'flex', justifyContent: 'right' }}>
        <Menu.Item onClick={() => history.push('/pricing')} key="pricing">Pricing</Menu.Item>
        <Menu.Item onClick={() => history.push('/faq')} key="faq">FAQ</Menu.Item>
        <Menu.Item onClick={() => history.push('/contact')} key="contact">Contact Us</Menu.Item>
        <Menu.Item onClick={() => history.push('/privacy')} key="privacy">Privacy Policy</Menu.Item>
        <Menu.Item onClick={() => history.push('/terms')} key="terms">Terms</Menu.Item>
        <Menu.Item onClick={() => history.push('/refund')} key="refund">Refund Policy</Menu.Item>
        <Menu.Item onClick={() => window.open('https://mgilangjanuar.notion.site/TeleDrive-Blog-ea8c422dfa8046cda6655cddec0cd8e8', '_blank')} key="blog">Blog</Menu.Item>
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
