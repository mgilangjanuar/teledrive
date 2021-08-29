import {
  Container,
  Flex,
  Input,
  Box,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react'
import Nav from '../common/Nav'
import React from 'react'
import TableFile from './components/ManageFile/TableFile'


const dummyData = {
  images: [
    {
      id: '1',
      name: 'Test.png',
      mime: 'image/png',
      date: new Date()
    },
    {
      id: '2',
      name: 'Test.jpg',
      mime: 'image/jpeg',
      date: new Date()
    }
  ],
  video: [
    {
      id: '1',
      name: 'Test.mp4',
      mime: 'video/mp4',
      date: new Date()
    },
    {
      id: '2',
      name: 'Test.mpeg',
      mime: 'video/mpeg',
      date: new Date()
    }
  ],
  document: [
    {
      id: '1',
      name: 'Test.pdf',
      mime: 'application/pdf',
      date: new Date()
    }],
  others: []
}

function ManageFile(): React.ReactElement {
  const TabVariant={ color: 'white', bg: 'blue.400' }
  return (
    <Box bg={useColorModeValue('gray.50', 'gray.800')} minH="100vh">
      <Container maxW="1400px" mx="auto" padding="0">
        <Nav />
        <Flex direction="column" alignItems="center" mt="10">
          <Input
            bg="white"
            placeholder="Search file"
            w={['sm', 'md', '2xl']}
            borderColor="blue.300"
            borderWidth="2px"
          />

          <Box w={['sm', 'md', '2xl']} mt="10" bg="white" minH="100vh">
            <Tabs isFitted variant="enclosed">
              <TabList>
                <Tab _selected={TabVariant}>Images</Tab>
                <Tab _selected={TabVariant}>Video</Tab>
                <Tab _selected={TabVariant}>
                  Document
                </Tab>
                <Tab _selected={TabVariant}>Others</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <TableFile />
                </TabPanel>
                <TabPanel>
                  <TableFile />
                </TabPanel>
                <TabPanel>
                  <TableFile />
                </TabPanel>
                <TabPanel>
                  <TableFile />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default ManageFile
