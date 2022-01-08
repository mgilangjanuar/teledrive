import { BranchesOutlined, EllipsisOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Breadcrumb as BaseBreadcrumb, Button, Dropdown, Menu } from 'antd'
import React, { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataSource: [any[], (data: any[]) => void],
  dataParent: [Record<string, any> | null | undefined, (data: any) => void]
}

const Breadcrumb: React.FC<Props> = ({
  dataSource: [breadcrumbs, setBreadcrumbs],
  dataParent: [parent, setParent]
}) => {

  const history = useHistory()
  const { search: searchParams } = useLocation()

  const select = (crumb: any) => {
    setParent(crumb)
    const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb?.id)
    setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))

    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('parent', crumb.id)

    if (!crumb?.id) {
      // history.replace(location.pathname)
      searchParams.delete('parent')
    } else {
      searchParams.set('parent', crumb.id)
    }

    history.push(`${location.pathname}?${searchParams.toString()}`)
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const parentId = params.get('parent')
    if (parentId) {
      if (breadcrumbs.find(br => br.id === parentId)) {
        setParent(breadcrumbs.find(br => br.id === parentId))
        const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === parentId)
        setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
      } else {
        req.get(`/files/${parentId}`).then(({ data }) => {
          setParent(data.file)
          req.get(`/files/breadcrumbs/${data.file.id}`)
            .then(({ data }) => {
              setBreadcrumbs([...breadcrumbs, ...data.breadcrumbs?.filter((br: any) => !breadcrumbs?.find(exist => exist.id === br.id))])
            })
        })
      }
    } else {
      setParent(breadcrumbs[0])
      setBreadcrumbs([breadcrumbs[0]])
    }
  }, [searchParams])

  const Name = ({ crumb }: any) => <>{crumb.link_id ? <BranchesOutlined /> : ''} {crumb?.id ? <FolderOpenOutlined /> : ''} {crumb.name}</>

  return <BaseBreadcrumb>
    {breadcrumbs.slice(0, 1).map(crumb =>
      <BaseBreadcrumb.Item key={crumb.id}>
        {crumb.id === (parent?.id || null) ? <Button type="text"><Name crumb={crumb} /></Button> :
          <Button type="link" onClick={() => select(crumb)}>
            <Name crumb={crumb} />
          </Button>
        }
      </BaseBreadcrumb.Item>
    )}
    {breadcrumbs.length > 2 ? <BaseBreadcrumb.Item key="ellipsis">
      <Dropdown trigger={['click']} placement="bottomCenter" overlay={<Menu>
        {breadcrumbs.slice(1, breadcrumbs.length - 1).map(crumb => <Menu.Item key={crumb.id} onClick={() => select(crumb)}>
          <Name crumb={crumb} />
        </Menu.Item>)}
      </Menu>}>
        <Button type="text"><EllipsisOutlined /></Button>
      </Dropdown>
    </BaseBreadcrumb.Item> : ''}
    {breadcrumbs.length > 1 ? breadcrumbs.slice(breadcrumbs.length - 1).map(crumb =>
      <BaseBreadcrumb.Item key={crumb.id}>
        {crumb.id === (parent?.id || null) ? <Button type="text"><Name crumb={crumb} /></Button> :
          <Button type="link" onClick={() => select(crumb)}>
            <Name crumb={crumb} />
          </Button>
        }
      </BaseBreadcrumb.Item>
    ) : ''}
  </BaseBreadcrumb>
}

export default Breadcrumb