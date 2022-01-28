import { Layout, Spin } from 'antd'
import React, { useEffect } from 'react'
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
  const history = useHistory()
  const [paramId] = useDebounce(match.params.id, 250)
  const { data: me } = useSWRImmutable('/users/me', fetcher)
  const { data, error, mutate } = useSWR(paramId || match.params.id ? `/files/${paramId || match.params.id}` : null, fetcher)

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

  return <>{!data && !error
    ? <Layout style={{ paddingTop: '45vh', minHeight: '100vh' }}><Spin /></Layout>
    : error || data && data.file.upload_progress !== null
      ? <Error error={error} me={me} />
      : data?.file.type === 'folder' && data?.file.sharing_options?.includes('*')
        ? <TableFiles me={me} data={data} />
        : <Viewer isInDrawer={isInDrawer} onCloseDrawer={onCloseDrawer} me={me} data={data} error={error} mutate={mutate} pageParams={match.params} />}</>
}

export default View