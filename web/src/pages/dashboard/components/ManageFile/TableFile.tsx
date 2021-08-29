import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  useBreakpointValue
} from '@chakra-ui/react'
import React from 'react'

export default function TableFile(): React.ReactElement {
  const size = useBreakpointValue({ base: 'sm', sm: 'sm', md: 'md', lg:'md' })


  return (
    <Table variant="simple" size={size}>
      <Thead>
        <Tr>
          <Th >ID</Th>
          <Th>Name</Th>
          <Th>Filesize</Th>
          <Th>Mimetype</Th>
          <Th >Date</Th>
        </Tr>
      </Thead>
      <Tbody></Tbody>
    </Table>
  )
}
