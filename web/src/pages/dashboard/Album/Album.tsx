import { Heading, VStack } from '@chakra-ui/layout'
import React from 'react'
import { useParams } from 'react-router'

const Album: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <VStack>
      <Heading size="lg">Album id: {id}</Heading>
    </VStack>
  )
}

export default Album
