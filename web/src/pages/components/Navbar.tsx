import { CrownOutlined, DashboardOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, SettingOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Layout, Menu, Modal, Popover, Progress, Tag, Tooltip, Typography } from 'antd'
import Avatar from 'antd/lib/avatar/avatar'
import moment from 'moment'
import prettyBytes from 'pretty-bytes'
import React, { useState } from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { useHistory } from 'react-router'
import { Link, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { apiUrl, fetcher, req } from '../../utils/Fetcher'

interface Props {
  user?: any
}


const Navbar: React.FC<Props> = ({ user }) => {
  const history = useHistory()
  const { pathname } = useLocation()
  const { currentTheme } = useThemeSwitcher()
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false)
  const [popoverVisibility, setPopoverVisibility] = useState<boolean>(false)
  const [destroySession, setDestroySession] = useState<boolean>(false)
  const [viewAnnouncement, setViewAnnouncement] = useState<boolean>(true)
  const { data: usage } = useSWR('/users/me/usage', fetcher)

  const logout = async () => {
    await req.post('/auth/logout', {}, destroySession ? { params: { destroySession: 1 } } : undefined)
    window.localStorage.clear()
    return window.location.replace('/')
  }

  return <>
    <Layout.Header style={{ textAlign: 'center', background: currentTheme === 'dark' ? '#1f1f1f' : '#0088CC', padding: '0 20px' }}>
      <Button type="ghost" shape="round" danger onClick={() => setViewAnnouncement(true)}>
        Announcement: TeleDrive will shut down
      </Button>
    </Layout.Header>
    <Layout.Header style={{ background: currentTheme === 'dark' ? '#1f1f1f' : '#0088CC', padding: '0 20px' }}>
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
      {user ? <>{/\/dashboard/.test(pathname) ? <>
        <Popover visible={popoverVisibility} onVisibleChange={setPopoverVisibility} placement="bottomRight" trigger={['click']} content={<div>
          <div style={{ padding: '10px' }}>
            Bandwidth: { }
            {user?.plan === 'premium' ? <Tag color="green">Unlimited</Tag> : <Tooltip placement="left" title={<>You can download up to {prettyBytes(Math.max(0, 1_500_000_000 - Number(usage?.usage.usage) || 0))} until {moment(usage?.usage.expire).local().format('lll')}</>}>
              <Progress status="exception" percent={Number((Number(usage?.usage.usage || 0) / 1_500_000_000 * 100).toFixed(1))} />
            </Tooltip>}
          </div>
          <Menu selectable={false} triggerSubMenuAction="click" onClick={({ key }) => {
            setPopoverVisibility(false)
            if (key === 'settings') {
              history.push('/settings')
            } else if (key === 'logout') {
              setLogoutConfirmation(true)
            }
          }}>
            <Menu.Item key="settings" icon={<SettingOutlined />}>Settings</Menu.Item>
            <Menu.Item danger key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>
          </Menu>
        </div>}>
          <Button type="link" style={{ color: '#ffff', float: 'right', top: '12px' }} icon={<Avatar src={`${apiUrl}/users/me/photo`} icon={<UserOutlined />} />} />
        </Popover>
      </> : <Button type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<DashboardOutlined />} onClick={() => history.push('/dashboard')}>{window.innerWidth > 359 && 'Dashboard'}</Button>}</> :
        <Button onClick={() => history.push('/login')} type="link" style={{ color: '#ffff', float: 'right', top: '16px' }} icon={<LoginOutlined />}>Login</Button>}
      <Menu selectable={false} overflowedIndicator={<MenuOutlined />} mode="horizontal" triggerSubMenuAction="click" theme={currentTheme === 'dark' ? 'light' : 'dark'}
        style={{ background: currentTheme === 'dark' ? '#1f1f1f' : '#0088CC', position: 'relative', display: 'flex', justifyContent: 'right' }}>
        <Menu.Item onClick={() => history.push('/pricing')} key="pricing">Pricing</Menu.Item>
        <Menu.Item onClick={() => history.push('/faq')} key="faq">FAQ</Menu.Item>
        <Menu.Item onClick={() => history.push('/contact')} key="contact">Contact Us</Menu.Item>
        <Menu.Item onClick={() => history.push('/privacy')} key="privacy">Privacy Policy</Menu.Item>
        <Menu.Item onClick={() => history.push('/terms')} key="terms">Terms</Menu.Item>
        <Menu.Item onClick={() => history.push('/refund')} key="refund">Refund Policy</Menu.Item>
        <Menu.Item onClick={() => window.open('https://mgilangjanuar.notion.site/TeleDrive-Blog-ea8c422dfa8046cda6655cddec0cd8e8', '_blank')} key="blog">Blog</Menu.Item>
        <Menu.Item onClick={() => window.open('https://analytics.teledriveapp.com/share/4RhiPDRP/TeleDrive', '_blank')} key="analytics">Analytics</Menu.Item>
      </Menu>
    </Layout.Header>

    <Modal title={<Typography.Text>
      <Typography.Text type="warning"><WarningOutlined /></Typography.Text> Confirmation
    </Typography.Text>}
    visible={logoutConfirmation}
    onCancel={() => setLogoutConfirmation(false)}
    onOk={logout}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ danger: true, type: 'primary', shape: 'round' }}>
      <Typography.Paragraph>
        Are you sure to logout?
      </Typography.Paragraph>
      <Form.Item help="All files you share will not be able to download once you sign out">
        <Checkbox checked={destroySession} onChange={({ target }) => setDestroySession(target.checked)}>
          Also delete my active session
        </Checkbox>
      </Form.Item>
    </Modal>

    <Modal title={<Typography.Text>
      Announcement
    </Typography.Text>}
    visible={viewAnnouncement}
    onCancel={() => setViewAnnouncement(false)}
    onOk={() => setViewAnnouncement(false)}
    cancelButtonProps={{ shape: 'round' }}
    okButtonProps={{ type: 'primary', shape: 'round' }}>
      <Typography.Paragraph>
        Dear all users,
      </Typography.Paragraph>

      <Typography.Paragraph>
        My name is Lang, the creator of TeleDrive. I hope you are always safe and healthy wherever you are. First of all, we need to inform you that we should <strong>shut down TeleDrive before March 2nd</strong> because of some issues that need us to forcibly do this.
      </Typography.Paragraph>

      <Typography.Paragraph>
        I know it's not easy to build a cloud storage service nowadays. But, I just want to create something that may be helpful for us and make our life easier. Unfortunately, I forgot about many rules in this world that we should respect.
      </Typography.Paragraph>

      <Typography.Paragraph italic>
        How about my files?
      </Typography.Paragraph>

      <Typography.Paragraph>
        Don't worry your files will not gone, you always can access the files in your Saved Messages or Upload Destination that you already set up on the Settings page.
      </Typography.Paragraph>

      <Typography.Paragraph italic>
        How about my money?
      </Typography.Paragraph>

      <Typography.Paragraph>
        Based on our <a href="/refund">Refund Policy</a> you have right to ask a refund by:
      </Typography.Paragraph>
      <ul>
        <li>
          Send subscription or order ID to <a href="mailto:refund@teledriveapp.com">refund@teledriveapp.com</a>
        </li>
        <li>
          The transaction is within 14 days upon purchase
        </li>
      </ul>

      <Typography.Paragraph italic>
        How about you and TeleDrive itself?
      </Typography.Paragraph>

      <Typography.Paragraph>
        I keep maintaining the source code here: <a href="https://github.com/mgilangjanuar/teledrive">github.com/mgilangjanuar/teledrive</a> as an open-source project that you can always do the self-deployment anywhere and anytime.
      </Typography.Paragraph>

      <Typography.Paragraph>
        It's a wrap! I want to say a big thank you to all contributors and all users who always trusted and supported me until today. We just met like 4 months ago but we need to say goodbye this fast.
      </Typography.Paragraph>

      <br />
      <Typography.Paragraph>
        Have a great day and good bye,
      </Typography.Paragraph>

      <Typography.Paragraph>
        <img src={currentTheme === 'dark' ? '/signature-alt.png' : '/signature.png'} style={{ width: '100%', maxWidth: '200px' }} />
      </Typography.Paragraph>

      <Typography.Paragraph>
        Lang
      </Typography.Paragraph>
    </Modal>
  </>
}

export default Navbar
