import React from 'react'
import { Heading, HStack, VStack, Image, Text } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { temporaryFetcher } from '../../utils'

const Photo: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data } = useSWR(
    `https://api.thecatapi.com/v1/images/${id}`,
    temporaryFetcher
  )

  return (
    <VStack mt={16}>
      {data ?
        <HStack justify="space-between" w="container.lg">
          <Image
            borderRadius="8px"
            src={data.url}
            w="500px"
            h="500px"
            objectFit="cover"
          />
          <VStack w="800px" h="400px" align="flex-start" p={8}>
            <Heading size="lg" color="gray.600" mb={4}>Photo id: {id}</Heading>
            <Text>Author name</Text>
          </VStack>
        </HStack>
        :
        <Text>Loading...</Text>
      }
    </VStack>
  )
}

export default Photo
