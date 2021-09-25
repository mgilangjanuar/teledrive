import { EllipsisOutlined, FolderOpenOutlined, ForkOutlined } from '@ant-design/icons'
import { Breadcrumb as BaseBreadcrumb, Button, Dropdown, Menu } from 'antd'
import React from 'react'
import { useHistory } from 'react-router'

interface Props {
  dataSource: [any[], (data: any[]) => void],
  dataParent: [Record<string, any> | null | undefined, (data: any) => void]
}

const Breadcrumb: React.FC<Props> = ({
  dataSource: [breadcrumbs, setBreadcrumbs],
  dataParent: [parent, setParent]
}) => {

  const history = useHistory()

  const select = (crumb: any) => {
    setParent(crumb)
    const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb?.id)
    setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))

    if (!crumb?.id) {
      history.replace(location.pathname)
    }
  }

  const Name = ({ crumb }: any) => <>{crumb.link_id ? <ForkOutlined /> : ''} {crumb?.id ? <FolderOpenOutlined /> : ''} {crumb.name}</>

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