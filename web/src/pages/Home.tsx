import React from 'react'
import { Avatar, Flex, Heading, HStack, VStack } from '@chakra-ui/react'

function Home(): React.ReactElement {
  return (
    <VStack w="100%" spacing={4}>
      <Flex justify="space-between">
        <Heading>teledrive</Heading>
        <Avatar />
      </Flex>
      <HStack>
      </HStack>
    </VStack>
  )
}

export default Home