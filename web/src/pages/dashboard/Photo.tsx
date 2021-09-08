import React from 'react'
import {
  Heading,
  Box,
  Image,
  Button,
  Container,
  useColorModeValue,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { temporaryFetcher } from '../../utils'
import Nav from '../common/Nav'

const Photo: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data } = useSWR(
    `https://api.thecatapi.com/v1/images/${id}`,
    temporaryFetcher
  )

  console.log(data)

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.800')} minH="100vh">
      <Container maxW="1400px" mx="auto" padding="0">
        <Nav />
        <Box
          flexDir={['column', 'column', 'row']}
          display="flex"
          padding={['5', '5', '10']}
          gridGap="10"
        >
          <Box width="max-content" mx={['auto', 'auto', '0']}>
            <Image
              borderRadius="8px"
              src={data.url}
              w={['300px', '300px', '500px']}
              h={['300px', '300px', '500px']}
              objectFit="cover"
            />
          </Box>
          <Box>
            <Heading size="lg" color="gray.600" mb={4}>
              Picture of someone
            </Heading>
            <a href={data.url} download>
              <Button colorScheme="blue">Download Image</Button>
            </a>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Photo
