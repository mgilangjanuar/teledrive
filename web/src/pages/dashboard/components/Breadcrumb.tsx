import { EllipsisOutlined } from '@ant-design/icons'
import { Breadcrumb as BaseBreadcrumb, Button, Dropdown, Menu } from 'antd'
import React from 'react'

interface Props {
  dataSource: [any[], (data: any[]) => void],
  dataParent: [string | null, (data: any) => void]
}

const Breadcrumb: React.FC<Props> = ({
  dataSource: [breadcrumbs, setBreadcrumbs],
  dataParent: [parent, setParent]
}) => {
  return <BaseBreadcrumb>
    {breadcrumbs.slice(0, 1).map(crumb =>
      <BaseBreadcrumb.Item key={crumb.id}>
        {crumb.id === parent ? <Button type="text" size="small">{crumb.name}</Button> :
          <Button type="link" size="small" onClick={() => {
            setParent(crumb.id)
            const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
            setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
          }}>
            {crumb.name}
          </Button>
        }
      </BaseBreadcrumb.Item>
    )}
    {breadcrumbs.length > 2 ? <BaseBreadcrumb.Item key="ellipsis">
      <Dropdown trigger={['click']} placement="bottomCenter" overlay={<Menu>
        {breadcrumbs.slice(1, breadcrumbs.length - 1).map(crumb => <Menu.Item key={crumb.id} onClick={() => {
          setParent(crumb.id)
          const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
          setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
        }}>
          {crumb.name}
        </Menu.Item>)}
      </Menu>}>
        <Button type="text" size="small"><EllipsisOutlined /></Button>
      </Dropdown>
    </BaseBreadcrumb.Item> : ''}
    {breadcrumbs.length > 1 ? breadcrumbs.slice(breadcrumbs.length - 1).map(crumb =>
      <BaseBreadcrumb.Item key={crumb.id}>
        {crumb.id === parent ? <Button type="text" size="small">{crumb.name}</Button> :
          <Button type="link" size="small" onClick={() => {
            setParent(crumb.id)
            const selectedCrumbIdx = breadcrumbs.findIndex(item => item.id === crumb.id)
            setBreadcrumbs(breadcrumbs.slice(0, selectedCrumbIdx + 1))
          }}>
            {crumb.name}
          </Button>
        }
      </BaseBreadcrumb.Item>
    ) : ''}
  </BaseBreadcrumb>
}

export default Breadcrumb