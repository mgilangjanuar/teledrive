import React from 'react'
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  HStack,
  Stack,
  Button,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react'

function Login(): React.ReactElement {
  return (
    <Flex
      boxSizing="border-box"
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={['md', 'md', 'xl']} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Sign in Teledrive</Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4}>
            <FormControl id="phone">
              <FormLabel>Phone number</FormLabel>
              <HStack spacing={2}>
                <Input type="tel" w={['40', '40', '64']} />
                <Button
                  variant="outline"
                  color={'blue.400'}
                  borderColor={'blue.400'}
                  size="sm"
                >
                  Send Code
                </Button>
              </HStack>
            </FormControl>
            <FormControl id="code">
              <FormLabel>Code</FormLabel>
              <Input type="number" w={['40', '40', '64']} />
            </FormControl>
            <Stack spacing={10}>
              <Button
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                w="max-content"
              >
                Sign in
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}

export default Login
