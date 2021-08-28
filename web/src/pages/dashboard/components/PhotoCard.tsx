import React from 'react'
import { VStack, Image, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

function PhotoCard(props: {
  id: string,
  imageUrl: string
}): React.ReactElement {
  return (
    <Link to={`/photo/${props.id}`}>
      <VStack borderRadius="8px" bg="white" boxShadow="md">
        <Image
          borderTopRadius="8px"
          src={props.imageUrl}
          w="240px"
          h="240px"
          objectFit="cover"
        />
        <VStack w="100%" h="64px" px={2} align="flex-start" spacing={0}>
          <Text fontSize="xl" color="gray.700" fontWeight="bold">Image name</Text>
          <Text fontSize="md" color="gray.600">Author name</Text>
        </VStack>
      </VStack>
    </Link>
  )
}

export default PhotoCard
