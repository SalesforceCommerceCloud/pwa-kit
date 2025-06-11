import React from 'react'
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton
} from '@chakra-ui/react'

const FAKE_STORES = [
    {id: 1, name: 'Downtown Store', address: '123 Main St', hours: '9AM-9PM'},
    {id: 2, name: 'Westside Mall', address: '456 West Ave', hours: '10AM-8PM'},
    {id: 3, name: 'Eastside Plaza', address: '789 East Blvd', hours: '9AM-7PM'}
]

const StoreLocator = () => {
    const {isOpen, onOpen, onClose} = useDisclosure()

    return (
        <Box p={4}>
            <Button colorScheme="blue" onClick={onOpen} mb={4}>
                Find a Store
            </Button>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Store Locations</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            {FAKE_STORES.map((store) => (
                                <Box key={store.id} p={4} borderWidth={1} borderRadius="md">
                                    <Heading size="sm">{store.name}</Heading>
                                    <Text>{store.address}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Hours: {store.hours}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default StoreLocator
