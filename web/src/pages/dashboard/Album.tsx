import React from 'react'
import { Container, Heading, HStack } from '@chakra-ui/react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { chunk, temporaryFetcher } from '../../utils'
import PhotoCard from './components/Album/PhotoCard'

const Album: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data } = useSWR<{ id: string, url: string }[]>(
    'https://api.thecatapi.com/v1/images/search?limit=12',
    temporaryFetcher
  )

  const dataToRows = chunk(data || [], 4)

  return (
    <Container maxW="container.lg" my={16} alignSelf="center">
      <Heading size="lg">Album id: {id}</Heading>
      {dataToRows.map((row) =>
        <HStack mt={4}>
          {row.map((item) => <PhotoCard key={item.id} id={item.id} imageUrl={item.url} />
          )}
        </HStack>
      )}
    </Container>
  )
}

export default Album
