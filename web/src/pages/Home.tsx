import { EmailIcon } from '@chakra-ui/icons'
import {
  Avatar, Button, Container, Flex, Heading, Input, InputGroup, InputLeftElement, Link, Stack,
  Text, useToast, Wrap, WrapItem
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { Follow } from 'react-twitter-widgets'
import useSWRImmutable from 'swr/immutable'
import { fetcher, req } from '../utils'

function Home(): React.ReactElement {
  const [email, setEmail] = useState<string>()
  const { data: contributors } = useSWRImmutable('/github/contributors', fetcher)
  const toast = useToast()

  const subscribe = async () => {
    try {
      await req.post('/waitings', { email })
      setEmail(undefined)
      toast({
        title: 'Thank you!',
        description: `${email} successfully joined in the waiting list.`,
        status: 'success',
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Something wrong',
        description: 'Please try again a few moments.',
        status: 'error',
        isClosable: true
      })
    }
  }

  return (
    <Container maxW="5xl">
      <Stack
        textAlign="center"
        align="center"
        spacing={{ base: 8, md: 10 }}
        py={{ base: 20, md: 28 }}>
        <Heading
          fontWeight={600}
          fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }}
          lineHeight="110%">
          <Text as="span" color="blue.400">
            Tele
          </Text>
          Drive
        </Heading>
        <Text color={'gray.500'} maxW={'3xl'}>
          What if we have a free unlimited cloud storage?{' '}
          <Text as="strong"><Text as="span" color="blue.400">Tele</Text>Drive</Text> is the
          alternative of Google Drive/OneDrive/iCloud/Dropbox/etc using <Text as="strong">Telegram API</Text>{' '}
          for the free unlimited cloud storage 🚀
        </Text>
        <Stack>
          <Text color={'gray.500'} maxW={'3xl'}>
            👋 Coming very soon!
          </Text>
          <InputGroup>
            <InputLeftElement
              pointerEvents="none"
              color="gray.300"
              fontSize="1.2em"
              children={<EmailIcon />}
            />
            <Input value={email || ''} onChange={({ target }) => setEmail(target.value)} colorScheme="telegram" type="email" placeholder="Email" />
          </InputGroup>
          <Button
            rounded="full"
            px={6}
            colorScheme="blue"
            bg="blue.400"
            disabled={!email?.match(/^.*\@.*\..*$/gi)}
            onClick={subscribe}
            _hover={{ bg: 'blue.500' }}>
            Join the waitlist
          </Button>
        </Stack>
        <Flex w="full">
          <a href="https://twitter.com/telegram/status/1428703364737507332">
            <img src="https://drive.google.com/uc?id=1o2HnKglEF0-cvtNmQqWZicJnSCSmnoEr" width="100%" />
          </a>
        </Flex>
        <Stack>
          <Heading as="h4" size="md">
            Contributors
          </Heading>
          <Wrap>
            {contributors?.contributors?.map((contributor: any, i: number) => <WrapItem key={i}>
              <Link href={contributor.html_url} isExternal>
                <Avatar name={contributor.login} src={contributor.avatar_url} />
              </Link>
            </WrapItem>)}
          </Wrap>
        </Stack>
        <Stack>
          <Follow username="teledriveapp" options={{ size: 'large' }} />
        </Stack>
      </Stack>
    </Container>
  )
}

export default Home
