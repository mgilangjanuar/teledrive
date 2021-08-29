import React,{ useState } from 'react'
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
  Text
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'

function Login(): React.ReactElement {
  const { register: registerPhone, formState: { errors: errorsPhone }, handleSubmit: handleSubmitPhone } = useForm()
  const { register: registerCode, formState: { errors: errorsCode }, handleSubmit: handleSubmitCode } = useForm()
  const [sendFinish, setsendFinish] = useState<boolean>(false)
  const sendCode = (): void => {
    setsendFinish(true)
    console.log('sending code')
  }
  const signIn = (): void => {
    console.log('sign in')
  }

  return (
    <Flex
      boxSizing="border-box"
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={['md', 'md', 'xl']} py={12} px={6}>
        <Heading fontSize={'4xl'} textAlign="center">Sign in Teledrive</Heading>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4}>
            <form onSubmit={handleSubmitPhone(sendCode)} id="login-form">
              <FormControl id="phone">
                <FormLabel>Phone number</FormLabel>
                <HStack spacing={2}>
                  <Input {...registerPhone('phone',{ required:true })} type="tel" required w={['40', '40', '64']} />
                  <Button
                    form="login-form"
                    type="submit"
                    variant={sendFinish?'ghost':'outline'}
                    color={'blue.400'}
                    borderColor={'blue.400'}
                    size="sm"
                    disabled={sendFinish}
                    _disabled={
                      {
                        opacity:1
                      }
                    }
                  >
                    {sendFinish?' Had Sent':'Send Code' }
                  </Button>
                </HStack>
                {errorsPhone.phone && <Text color="red">Phone cannot be empty</Text>}
              </FormControl>
            </form>
            <form onSubmit={handleSubmitCode(signIn)}>
              <FormControl id="code">
                <FormLabel>Code</FormLabel>
                <Input {...registerCode('code',{ required:true })} type="number" w={['40', '40', '64']} required/>
              </FormControl>
              {errorsCode.code && <Text color="red">Code cannot be empty</Text>}
              <Button
                disabled={!sendFinish}
                mt="5"
                type="submit"
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                w="max-content"
                onClick={handleSubmitCode(signIn)}
              >
                Sign in
              </Button>
            </form>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}

export default Login
