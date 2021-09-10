import React, { useState } from 'react'
import { Button, Modal, Box, ModalOverlay, Input, ModalContent, ModalFooter, ModalBody, ModalHeader, useDisclosure } from '@chakra-ui/react'

export default function FloatingBtn(): React.ReactElement {
  const [fileUpload, setfileUpload] = useState('')
  const [uploadLoading, setuploadLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [uploadSuccess, setuploadSuccess] = useState(false)

  const dummyUpload = () => {

    if (fileUpload !== '' && fileUpload !== undefined && fileUpload !== null) {
      setuploadLoading(true)
    }


    setTimeout(() => {
      setuploadLoading(false)
      setuploadSuccess(true)

      setTimeout(() => {
        setuploadSuccess(false)
      }, 1000)
    }, 2000)


  }

  return (
    <>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload File</ModalHeader>

          <ModalBody padding="5">
            <Input type="file" w="full" paddingTop="1" onChange={(e) => {
              setfileUpload(e.target.value)
            }} />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => {
              dummyUpload()
              onClose()
            }}>
              Upload File
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


      {uploadSuccess && <Box
        bottom="100"
        rounded="md"
        color="white"
        fontWeight="semibold"
        right={['0', '0', '72']}
        position="fixed" bg="white" bgColor="green.400" p="3">Upload Success</Box>
      }

      <Button
        mb="10"
        bottom="0"
        right={['0', '0', '72']}
        position="fixed"
        colorScheme="blue"
        rounded="full"
        display="flex"
        justifyContent="center"
        size="lg"
        boxShadow="lg"
        aria-label="upload file"
        w="max-content"
        onClick={onOpen}
        disabled={uploadLoading}
      >
        {uploadLoading ? 'Uploading file ... ' : 'Upload file'}
      </Button>
    </>
  )
}
