import { Heading, Text, VStack } from '@chakra-ui/layout'
import React from 'react'
import { Link } from 'react-router-dom'

function NotFound(): React.ReactElement {
  return (
    <VStack w="100%" h="100vh" p={8}>
      <Heading>Page Not Found</Heading>
      <Text>Try opening something else!</Text>
      <Link to="/">
        <Text color="blue.600">Home</Text>
      </Link>
    </VStack>
  )
}

export default NotFound
