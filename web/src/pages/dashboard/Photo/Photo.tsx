import React from 'react'
import { Heading, VStack } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'

const Photo: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <VStack>
      <Heading size="lg">Photo id: {id}</Heading>
    </VStack>
  )
}

export default Photo
