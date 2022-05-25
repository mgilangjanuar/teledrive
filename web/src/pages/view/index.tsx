import { Form, Input, Layout, Modal, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import { fetcher } from '../../utils/Fetcher'
import Error from './components/Error'
import TableFiles from './components/TableFiles'
import Viewer from './components/Viewer'
import { useDebounce } from 'use-debounce/lib'

interface PageProps extends RouteComponentProps<{
  id: string
}> {}

const View: React.FC<PageProps & { isInDrawer?: boolean, onCloseDrawer?: () => void }> = ({ match, isInDrawer, onCloseDrawer }) => {
  const [openPassModal, setOpenPassModal] = useState<boolean>(false)
  const history = useHistory()
  const [paramId] = useDebounce(match.params.id, 250)
  const { data: me } = useSWRImmutable('/users/me', fetcher)
  const { data, error, mutate } = useSWR(paramId || match.params.id ? `/files/${paramId || match.params.id}?password=${sessionStorage.getItem(`pass-${paramId || match.params.id}`)}` : null, fetcher)
  const [form] = Form.useForm()

  useEffect(() => {
    if (error?.status === 400) {
      setOpenPassModal(true)
    }
  }, [error])

  useEffect(() => {
    if (data?.file.type === 'folder') {
      if (me?.user) {
        if (data.file.user_id === me.user.id) {
          return history.replace(`/dashboard?parent=${data.file.id}`)
        } else if (data.file.shared_options?.includes(me.user.id)) {
          return history.replace(`/dashboard/shared?parent=${data.file.id}`)
        }
      } else if (data.file.sharing_options?.includes('*')) {
        // setParent(data.file)
        // setBreadcrumbs([data.file])
        // const searchParams = new URLSearchParams(window.location.search)
        // searchParams.set('parent', data.file.id)
        // return history.replace(`${location.pathname}?${searchParams.toString()}`)
      }
    }
  }, [data, me])

  const submit = () => {
    const { password } = form.getFieldsValue()
    sessionStorage.setItem(`pass-${paramId || match.params.id}`, password)
    mutate()
    setOpenPassModal(false)
  }

  return <>
    {!data && !error
      ? <Layout style={{ paddingTop: '45vh', minHeight: '100vh' }}><Spin /></Layout>
      : error || data && data.file.upload_progress !== null
        ? <Error error={error} me={me} />
        : data?.file.type === 'folder' && data?.file.sharing_options?.includes('*')
          ? <TableFiles me={me} data={data} />
          : <Viewer isInDrawer={isInDrawer} onCloseDrawer={onCloseDrawer} me={me} data={data} error={error} mutate={mutate} pageParams={match.params} />}
    <Modal title="Input your password" visible={openPassModal} onCancel={() => setOpenPassModal(false)} okText="Open" onOk={submit}>
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="password" label="Password">
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  </>
}

export default View