import { LoginOutlined } from '@ant-design/icons'
import { Avatar, Button, Form, Input, Layout, Modal, Typography } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import { apiUrl } from '../../utils/Fetcher'

interface Props {
  user?: any
}


const Navbar: React.FC<Props> = ({ user }) => {
  const [wantToLogin, setWantToLogin] = useState<boolean>()
  const history = useHistory()
  const [form] = useForm()

  const saveInvitationCode = () => {
    const { code } = form.getFieldsValue()
    localStorage.setItem('invitationCode', code)
    form.resetFields()
    setWantToLogin(false)
    history.push('/login')
  }

  useEffect(() => {
    if (wantToLogin) {
      form.setFieldsValue({ code: localStorage.getItem('invitationCode') })
    }
  }, [wantToLogin])

  return <>
    <Layout.Header style={{ background: '#0088CC' }}>
      <div key="logo" className="logo">
        <Link to="/" style={{ color: '#fff' }}>
          <img style={{ width: '24px' }} src="/logo192.png" alt="icon.png" />&nbsp; TeleDrive
        </Link>
      </div>
      {user ?
        <Button size="large" type="link" style={{ color: '#ffff', float: 'right', top: '11px' }} icon={<Avatar src={`${apiUrl}/users/me/photo`} />} /> :
        <Button onClick={() => setWantToLogin(true)} size="large" type="link" style={{ color: '#ffff', float: 'right', top: '11px' }} icon={<LoginOutlined />}>Login</Button>}
    </Layout.Header>
    <Modal visible={wantToLogin} title="Invitation Code" onCancel={() => setWantToLogin(false)} onOk={form.submit} okText="Continue">
      <Typography.Paragraph type="secondary">
        The access is limited for early users.
      </Typography.Paragraph>
      <Form form={form} onFinish={saveInvitationCode}>
        <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Please input your invitation code' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  </>
}

export default Navbar