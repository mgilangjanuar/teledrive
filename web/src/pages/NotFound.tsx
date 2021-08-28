import { Heading, Text, VStack } from '@chakra-ui/layout'
import React from 'react'

function NotFound(): React.ReactElement {
  return (
    <VStack w="100%" h="100vh">
      <Heading>Page Not Found</Heading>
      <Text>Try opening something else</Text>
    </VStack>
  )
}

export default NotFound
