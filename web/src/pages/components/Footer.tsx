import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Layout, Row, Space, Typography } from 'antd'
import React from 'react'
import { useThemeSwitcher } from 'react-css-theme-switcher'
import { DiscordIcon } from './Discord'

interface Props {
  me?: any
}

const Footer: React.FC<Props> = () => {
  const { currentTheme } = useThemeSwitcher()
  return <>
    <Layout.Footer style={{ background: '#f0f2f5', paddingTop: '50px' }}>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 24, offset: 1 }} span={24}>
          <Row gutter={48}>
            <Col md={8} sm={12} span={24} style={{ marginBottom: '30px' }}>
              <Typography.Paragraph>
                <Button type="link" href="/" style={{ fontSize: '20px', fontWeight: 'bolder' }}
                  icon={<img src={currentTheme === 'dark' ? '/teledrive-logo/logoteledrive-white.png' : '/teledrive-logo/logoteledrive.png'} style={{ height: '24px' }} />}>
                </Button>
              </Typography.Paragraph>
              <Typography.Paragraph type="secondary">
                Your free unlimited cloud storage service using the Telegram API.
              </Typography.Paragraph>
              {/* <Typography.Paragraph type="secondary">
                Made with &hearts; from Indonesia &#127470;&#127465;
              </Typography.Paragraph> */}
            </Col>
            <Col md={8} sm={12} span={24} style={{ marginBottom: '30px' }}>
              <Typography.Title level={5}>Support Us</Typography.Title>
              <Typography.Paragraph>
                <a href="https://opencollective.com/teledrive/contribute" target="_blank">
                  <img src="https://opencollective.com/teledrive/contribute/button@2x.png?color=blue" style={{ width: '100%', maxWidth: '240px' }} />
                </a>
              </Typography.Paragraph>
              <Typography.Paragraph type="secondary">
                Or, become <a href="https://opencollective.com/teledrive">a sponsor</a>.
              </Typography.Paragraph>

            </Col>
            <Col md={8} sm={12} span={24} style={{ marginBottom: '30px' }}>
              <Typography.Title level={5}>Social Media</Typography.Title>
              <Space direction="horizontal">
                <Button type="link" size="small" href="https://github.com/mgilangjanuar/teledrive" target="_blank" icon={<GithubOutlined />}>GitHub</Button>
                <Button type="link" size="small" href="https://twitter.com/teledriveapp" target="_blank" icon={<TwitterOutlined />}>Twitter</Button>
                <Button type="link" size="small" href="https://discord.gg/8v26KavKa4" target="_blank" icon={<DiscordIcon />}>Discord</Button>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
      <Divider />
      <Typography.Paragraph style={{ textAlign: 'center' }}>
        Copyright &copy; {new Date().getFullYear()}
      </Typography.Paragraph>
    </Layout.Footer>
  </>
}

export default Footer
