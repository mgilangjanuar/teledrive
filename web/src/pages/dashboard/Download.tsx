import React from 'react'
import { Box, Container, Heading, Text, Button } from '@chakra-ui/react'

import { useColorModeValue } from '@chakra-ui/color-mode'
import Nav from '../common/Nav'

export default function Download(): React.ReactElement {
  return (
    <Box bg={useColorModeValue('gray.50', 'gray.800')} minH="100vh">
      <Container maxW="1400px" mx="auto" padding="0">
        <Nav />

        <Box padding="10" display="flex" flexDir="column" gridRowGap="5">
          <Heading>Dummy File</Heading>
          <Text>
            <b>Dummy File.file</b> have xx mb
          </Text>
          <a href="#" download>
            <Button w="fit-content" colorScheme="blue">
              Download file
            </Button>
          </a>
        </Box>
      </Container>
    </Box>
  )
}
