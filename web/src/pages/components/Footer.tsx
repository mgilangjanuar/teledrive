import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { Divider, Layout, Typography } from 'antd'
import React from 'react'

const Footer: React.FC = () => {
  return <Layout.Footer style={{ textAlign: 'center' }}>
    <Divider />
    <Typography.Paragraph>
      <Typography.Text>TeleDrive &copy; 2021</Typography.Text><br />
      <Typography.Text>
        <a href="https://github.com/mgilangjanuar/teledrive" target="_blank">GitHub <GithubOutlined /></a>&nbsp;&bull;&nbsp;
        <a href="https://twitter.com/teledriveapp" target="_blank">Twitter <TwitterOutlined /></a>
      </Typography.Text>
    </Typography.Paragraph>
  </Layout.Footer>
}

export default Footer