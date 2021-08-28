import React from 'react'
import { Avatar, Container, Flex, Heading, VStack } from '@chakra-ui/react'

function Home(): React.ReactElement {
  return (
    <VStack w="100%" spacing={4}>
      <Flex w="100%" p={4} justify="space-between" boxShadow="sm">
        <Heading color="gray.600" size="lg">teledrive</Heading>
        <Avatar size="sm" />
      </Flex>
      <Container></Container>
    </VStack>
  )
}

export default Home
