import { ArrowRightOutlined, CloudOutlined, DollarCircleOutlined, SecurityScanOutlined } from '@ant-design/icons'
import { Avatar, Button, Carousel, Col, Image, Layout, Row, Space, Tooltip, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import GitHubButton from 'react-github-btn'
import { useHistory } from 'react-router-dom'
import { Follow, Tweet } from 'react-twitter-widgets'
import useSWRImmutable from 'swr/immutable'
import { ReactComponent as UploadingAnimate } from '../svg/Uploading-amico-new.svg'
import { fetcher } from '../utils/Fetcher'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

interface Props {
  me?: any
}

const Home: React.FC<Props> = ({ me }) => {
  const { data } = useSWRImmutable('/github/contributors', fetcher)
  // const { data: me } = useSWRImmutable('/users/me', fetcher)
  const [visiblePreview, setVisiblePreview] = useState<boolean>()
  const history = useHistory()

  useEffect(() => {
    if (localStorage.getItem('dc') === 'ge' && window.location.host !== 'ge.teledriveapp.com' && /teledriveapp\.com$/gi.test(window.location.host)) {
      return window.location.replace('https://ge.teledriveapp.com')
    }
    if (localStorage.getItem('dc') === 'us' && window.location.host !== 'us.teledriveapp.com' && /teledriveapp\.com$/gi.test(window.location.host)) {
      return window.location.replace('https://us.teledriveapp.com')
    }
  }, [])

  return <div id="top">
    <Navbar user={me?.user} page="home" />
    <Layout.Content style={{ fontSize: '1.125rem' }}>
      <Row align="middle" style={{ marginTop: '50px' }}>
        <Col lg={{ span: 10, offset: 2 }} md={{ span: 20, offset: 2 }} span={22} offset={1}>
          <Layout.Content>
            <Typography.Title level={1}>
              <Typography.Text style={{ fontWeight: 'lighter' }}>
                The Free Unlimited
              </Typography.Text>
              <br style={{ 'lineHeight': 1.5 }} />
              <Typography.Text style={{ background: '#0088CC', color: '#fff' }}>
                &nbsp; Cloud Storage &nbsp;
              </Typography.Text>
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: '30px' }}>
              The open source project to give you what you deserve.
              Using the <strong>Telegram API</strong> as your unlimited storage.
              So, you can upload as many as you want without any limit 👌
            </Typography.Paragraph>
            <a style={{ position: 'fixed', bottom: '15px', right: '25px', zIndex: 999  }} href="https://www.producthunt.com/posts/teledrive?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-teledrive" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=315149&theme=dark&period=daily" alt="TeleDrive - Free unlimited cloud storage service using the Telegram API | Product Hunt" style={{ width: '250px', height: '54px' }} width="250" height="54" /></a>
            <Typography.Paragraph>
              <Space>
                <Follow username="teledriveapp" options={{ dnt: true, showCount: false }} />
                <GitHubButton href="https://github.com/mgilangjanuar/teledrive" data-show-count="true" aria-label="Star mgilangjanuar/teledrive on GitHub">Star</GitHubButton>
              </Space>
            </Typography.Paragraph>
            <Layout.Content style={{ marginTop: '40px' }}>
              {me ? <Button shape="round" size="large" type="primary" onClick={() => history.push('/dashboard')}>
                Go to Dashboard <ArrowRightOutlined />
              </Button> : <Button shape="round" size="large" type="primary" onClick={() => history.push('/login')}>
                Register Now <ArrowRightOutlined />
              </Button>}
            </Layout.Content>
          </Layout.Content>
        </Col>
        <Col lg={{ span: 10 }} span={24} style={{ textAlign: 'center', marginTop: '50px' }}>
          <Layout.Content>
            <UploadingAnimate style={{ width: '100%', maxWidth: '640px' }} />
            {/* <img style={{ width: '100%', maxWidth: '640px' }} src="./uploading-animate.svg" alt="Online illustrations by Storyset" /> */}
          </Layout.Content>
        </Col>
      </Row>

      <Row style={{ marginTop: '100px', padding: '100px 0', background: '#f0f2f5' }}>
        <Col lg={14} span={20} offset={2}>
          <Typography.Title level={2}>Want to know why we can do this?</Typography.Title>
          <Typography.Paragraph style={{ marginBottom: '50px' }}>
            In Aug 20, 2021, <a href="https://telegram.org/">Telegram</a> said that they give an unlimited cloud storage for free via their official <a href="https://twitter.com/telegram/status/1428703364737507332" target="_blank">Twitter account</a>.
            So, we're using their API to build <strong>TeleDrive</strong> 🚀
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Tweet options={{ width: 360 }} tweetId="1428703364737507332" />
          </Typography.Paragraph>
        </Col>
      </Row>

      <Row style={{ marginTop: '100px', padding: '50px 0' }}>
        <Col span={20} offset={2}>
          <Row gutter={72}>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <DollarCircleOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Free</Typography.Title>
              <Typography.Paragraph>
                Seriously, you can use this service FREE with no limit. Everyone can even do a self-hosted for TeleDrive.
              </Typography.Paragraph>
            </Col>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <CloudOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Unlimited</Typography.Title>
              <Typography.Paragraph>
                Because Telegram promises us to give the unlimited cloud storage from their <a href="https://twitter.com/telegram/status/1428703364737507332" target="_blank">tweet</a>. So, here we go 🚀
              </Typography.Paragraph>
            </Col>
            <Col lg={8} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '2em', color: '#0088CC' }}>
                <SecurityScanOutlined />
              </div>
              <Typography.Title style={{ fontWeight: 'lighter' }}>Secure</Typography.Title>
              <Typography.Paragraph>
                You can control the sharing options for every file that you upload on TeleDrive. By default, it's private for you in your Saved Messages.
              </Typography.Paragraph>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row style={{ marginTop: '50px', padding: '50px 0' }}>
        <Col span={20} offset={2}>
          <Carousel autoplay>
            <div>
              <Image onClick={() => setVisiblePreview(true)} preview={{ visible: false }} src="./71e90abb-f036-4892-a255-0e3d1bf7e472.webp" style={{ width: '100%' }} />
            </div>
            <div>
              <Image onClick={() => setVisiblePreview(true)} preview={{ visible: false }} src="./d38bbf8e-636e-4acb-9300-1de90a6be13b.webp" style={{ width: '100%' }} />
            </div>
            <div>
              <Image onClick={() => setVisiblePreview(true)} preview={{ visible: false }} src="./Screen Shot 2021-11-18 at 09.19.11.png" style={{ width: '100%' }} />
            </div>
          </Carousel>
          <div style={{ display: 'none' }}>
            <Image.PreviewGroup preview={{ visible: visiblePreview, onVisibleChange: vis => setVisiblePreview(vis) }}>
              <Image src="./71e90abb-f036-4892-a255-0e3d1bf7e472.webp" />
              <Image src="./d38bbf8e-636e-4acb-9300-1de90a6be13b.webp" />
              <Image src="./Screen Shot 2021-11-18 at 09.19.11.png" />
            </Image.PreviewGroup>
          </div>
          <Row style={{ marginTop: '50px', padding: '50px 0' }} gutter={72} align="middle">
            <Col lg={10} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <Typography.Title level={3} style={{ fontWeight: 'lighter' }}>It comes with</Typography.Title>
              <Typography.Title style={{ marginTop: 0 }}>Quick Message</Typography.Title>
            </Col>
            <Col lg={14} span={24} style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img src="./quickmessage.png" style={{ width: '100%', maxWidth: '640px' }} />
            </Col>
          </Row>
        </Col>
      </Row>

      <Row style={{ marginTop: '100px', padding: '100px 0', background: '#f0f2f5' }}>
        <Col span={20} offset={2}>
          <Row gutter={72}>
            <Col lg={12} span={24} style={{ textAlign: 'right', marginBottom: '30px' }}>
              <Typography.Title level={2} style={{ marginBottom: '30px' }}>Our Collaborators</Typography.Title>
              <Typography.Paragraph style={{ marginBottom: '20px' }}>
                <Space wrap>
                  {data?.contributors?.map((contributor: any) => <Tooltip placement="bottom" title={contributor.login} key={contributor.id}>
                    <a href={contributor.html_url} target="_blank">
                      <Avatar size="large" src={contributor.avatar_url} />
                    </a>
                  </Tooltip>)}
                </Space>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <Space>
                  <GitHubButton href="https://github.com/mgilangjanuar/teledrive/fork" data-size="large" data-show-count="true" aria-label="Fork mgilangjanuar/teledrive on GitHub">Fork</GitHubButton>
                  <GitHubButton href="https://github.com/mgilangjanuar/teledrive" data-size="large" data-show-count="true" aria-label="Star mgilangjanuar/teledrive on GitHub">Star</GitHubButton>
                </Space>
              </Typography.Paragraph>
            </Col>
            <Col lg={12} span={24} style={{ textAlign: 'left', marginBottom: '30px' }}>
              <Typography.Title level={2} style={{ marginBottom: '30px' }}>Our Sponsor</Typography.Title>
              <Typography.Paragraph style={{ marginBottom: '20px' }}>
                <Space wrap size={30}>
                  <Tooltip placement="bottom" title="Bahasa.ai - Chatbot Which Serves Customers Fully" key="bahasa-ai">
                    <a href="https://bahasa.ai" target="_blank">
                      <img style={{ width: '100%', maxWidth: '212px' }} src={me?.user.settings?.theme === 'dark' ? 'https://uploads-ssl.webflow.com/5fb8f118741e70818f103554/5fefb0768f76054a6f40c1e5_Bahasa-ai%20white%20(logo).svg' : 'https://uploads-ssl.webflow.com/5fb8f118741e70818f103554/5feefbc08ef40333bbd2f92e_bahasa-ai-logo-blue%20(2021)%404x-p-500.png'} />
                    </a>
                  </Tooltip>
                  <Tooltip  placement="bottom" title="DigitalOcean – The developer cloud" key="digitalocean">
                    <a href="https://m.do.co/c/d578c43dcd66" target="_blank">
                      <img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_blue.svg" style={{ width: '100%', maxWidth: '280px' }} />
                    </a>
                  </Tooltip>
                </Space>
              </Typography.Paragraph>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row style={{ marginTop: '50px', padding: '100px 0 150px', textAlign: 'center' }}>
        <Col lg={{ span: 6, offset: 9 }} md={{ span: 10, offset: 7 }} span={20} offset={2}>
          <Typography.Paragraph>
            Join now! 🚀
          </Typography.Paragraph>
          <Button shape="round" block href="#top" size="large" type="primary">
            Getting Started
          </Button>
        </Col>
      </Row>

    </Layout.Content>
    <Footer me={me} />
    <script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="mgilangjanuar" data-description="Support me on Buy me a coffee!" data-message="" data-color="#FFDD00" data-position="Right" data-x_margin="18" data-y_margin="18"></script>
  </div>
}

export default Home