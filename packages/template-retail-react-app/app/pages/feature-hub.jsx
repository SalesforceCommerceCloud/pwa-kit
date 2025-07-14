import React from 'react';
import { Box, Container, Flex, Heading, Text, VStack, Divider, Button } from '@salesforce/retail-react-app/app/components/shared/ui';
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar';

const FeatureHub = () => {
    return (
        <Box data-testid="feature-hub-page" layerStyle="page">
            <ShowcaseTopBar />
            <Container maxW="container.2xl" py={8}>
                <Flex direction={{base: 'column', md: 'row'}} gap={8} align="flex-start">
                    {/* Sidebar */}
                    <Box
                        minW={{base: '100%', md: '260px'}}
                        maxW={{base: '100%', md: '260px'}}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        <VStack align="stretch" spacing={1}>
                            <Text>FeatureHub Sidebar</Text>
                        </VStack>
                    </Box>
                    {/* Main Content Area */}
                    <Box
                        flex={1}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={8}
                        shadow="sm"
                        minH="320px"
                    >
                        <Heading size="lg" color="blue.600" mb={2}>
                            Welcome to the Feature Hub page!
                        </Heading>
                        <Text color="gray.800" mb={4}>
                            Disover and add new features to your storefront.
                        </Text>
                        <Divider mb={6} />
                        <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50" shadow="sm" mb={6}>
                            <Heading size="md" color="blue.600" mb={2}>
                                Purchase Online Pick in Store
                            </Heading>
                            <Text color="gray.600" mb={4}>
                                This feature allows customers to purchase items online and pick them up at a nearby store, providing convenience and flexibility.
                            </Text>
                            <Button colorScheme="blue" mr={4} onClick={() => alert('Demo feature initiated!')}>
                                Demo
                            </Button>
                            <Button colorScheme="blue" onClick={() => alert('Install feature initiated!')}>
                                Install
                            </Button>
                        </Box>
                        <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50" shadow="sm">
                            <Heading size="md" color="blue.600" mb={2}>
                                Multiple Shipping
                            </Heading>
                            <Text color="gray.600" mb={4}>
                                This feature allows customers to ship items in a single order to multiple addresses, enhancing flexibility and convenience.
                            </Text>
                            <Button colorScheme="blue" mr={4} onClick={() => alert('Demo feature initiated!')}>
                                Demo
                            </Button>
                            <Button colorScheme="blue" onClick={() => alert('Install feature initiated!')}>
                                Install
                            </Button>
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    );
};

export default FeatureHub; 