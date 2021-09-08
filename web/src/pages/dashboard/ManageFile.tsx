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



interface DataFile {
  id: string,
  name: string,
  fileSize: number,
  mime: string,
  date: Date
}
interface DummyFileObj{
  [file: string]: DataFile[]
}



const dummyData: DummyFileObj = {
  'image': [{
    id: '1',
    name: 'photo1.png',
    fileSize: 2345,
    mime: 'images/png',
    date: new Date()
  },{
    id: '2',
    name: 'photo2.png',
    fileSize: 2345,
    mime: 'images/jpg',
    date: new Date()
  }],  'video': [{
    id: '3',
    name: 'video1.mp4',
    fileSize: 2345,
    mime: 'video/mp4',
    date: new Date()
  },{
    id: '4',
    name: 'video2.mpeg',
    fileSize: 2345,
    mime: 'video/mpeg',
    date: new Date()
  },],'document': [{
    id: '6',
    name: 'doc1.pdf',
    fileSize: 2345,
    mime: 'application/pdf',
    date: new Date()
  }]
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
            w={['sm', 'md', 'xl']}
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
                {
                  Object.keys(dummyData).map((key) => {
                    console.log(dummyData[key])
                  })
                }
                {dummyData && Object.keys(dummyData).map((key) => <TabPanel key={key}>
                  <TableFile dataFile={dummyData[key]} category={key}/>
                </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default ManageFile
