import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { Button, Divider, Layout, Space, Typography } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return <Layout.Footer style={{ textAlign: 'center' }}>
    <Divider />
    <Typography.Paragraph>
      <Typography.Text>TeleDrive &copy; 2021</Typography.Text>
    </Typography.Paragraph>
    <Typography.Paragraph>
      <Typography.Text>
        <Space wrap>
          <Button type="link" size="small"><Link to="/">Home</Link></Button>
          <Button type="link" size="small"><Link to="/privacy">Privacy</Link></Button>
          <Button type="link" size="small"><Link to="/terms">Terms</Link></Button>
          <Button type="link" size="small" href="https://github.com/mgilangjanuar/teledrive" target="_blank" icon={<GithubOutlined />}>GitHub</Button>
          <Button type="link" size="small" href="https://twitter.com/teledriveapp" target="_blank" icon={<TwitterOutlined />}>Twitter</Button>
        </Space>
      </Typography.Text>
    </Typography.Paragraph>
  </Layout.Footer>
}

export default Footer