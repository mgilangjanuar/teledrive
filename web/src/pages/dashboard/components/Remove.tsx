import { WarningOutlined } from '@ant-design/icons'
import { Modal, Typography } from 'antd'
import React, { useState } from 'react'
import { req } from '../../../utils/Fetcher'

interface Props {
  dataSource?: [any[], (data: any[]) => void],
  dataSelect: [any, (data: any) => void],
  onFinish?: (newData: any[]) => void
}

const Remove: React.FC<Props> = ({
  dataSource,
  dataSelect: [selectDeleted, setSelectDeleted],
  onFinish }) => {

  const [loadingRemove, setLoadingRemove] = useState<boolean>()

  const remove = async (ids: string[]) => {
    setLoadingRemove(true)
    try {
      await Promise.all(ids.map(async id => await req.delete(`/files/${id}`)))
    } catch (error) {
      // ignore
    }
    const newData = dataSource?.[0].filter(datum => !ids.includes(datum.id)) || []
    dataSource?.[1](newData)
    setSelectDeleted([])
    setLoadingRemove(false)
    onFinish?.(newData)
  }

  return <Modal visible={!!selectDeleted?.length}
    title={<><WarningOutlined /> Confirmation</>}
    onCancel={() => setSelectDeleted([])}
    onOk={() => remove(selectDeleted.map((data: any) => data.id))}
    okText="Remove"
    okButtonProps={{ danger: true, type: 'primary', loading: loadingRemove }}>
    <Typography.Paragraph>
      Are you sure to delete {selectDeleted?.length > 1 ? `${selectDeleted?.length} objects` : selectDeleted?.[0]?.name }?
    </Typography.Paragraph>
  </Modal>
}

export default Remove