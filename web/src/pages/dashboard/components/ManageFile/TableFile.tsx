import {
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  useBreakpointValue
} from '@chakra-ui/react'
import React from 'react'
import { useHistory } from 'react-router-dom'

interface DataFile {
  id: string,
  name: string,
  fileSize: number,
  mime: string,
  date: Date
}
interface Props{
  category: 'image'|'video'|'document'|'other'|string,
  dataFile?: DataFile[]
}

function TableFile({ dataFile,category }: Props): React.ReactElement {
  const size = useBreakpointValue({ base: 'sm', sm: 'sm', md: 'md' })
  const history = useHistory()

  const openFile = (id: string): void => {
    history.push(`/${category}/${id}`)
  }
  return (
    <Table variant="simple" size={size}>
      <Thead>
        <Tr>
          <Th>ID</Th>
          <Th>Name</Th>
          <Th>Filesize</Th>
          <Th display={['none','none','block']}>Mimetype</Th>
          <Th>Date</Th>
        </Tr>
      </Thead>
      <Tbody>
        {dataFile?.map(data => <Tr onClick={() => openFile(data.id)} cursor="pointer" _hover={{
          bg:'gray.200'
        }}>
          <Td>{data.id}</Td>
          <Td>{data.name}</Td>
          <Td>{data.fileSize}</Td>
          <Td display={['none','none','table-cell']}>{data.mime}</Td>
          <Td w="min-content">{data.date.toLocaleString()}</Td>
        </Tr>
        )}
      </Tbody>
    </Table>
  )
}

export default TableFile