import React, {useState} from 'react'
import {
    Box,
    Button,
    Container,
    Heading,
    Input,
    VStack,
    Text,
    Divider,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'

const pages = [
    {name: 'Home', path: '/'},
    {name: 'Cart', path: '/cart'},
    {name: 'Checkout', path: '/checkout'},
    {name: 'Account', path: '/account'},
    {name: 'Product List', path: '/category/womens-clothing-dresses'},
    {name: 'Product Detail', path: '/product/25518241M'},
    {name: 'Login', path: '/login'},
    {name: 'Registration', path: '/registration'},
    {name: 'Store Locator', path: '/store-locator'},
    {name: 'Page Not Found', path: '/page-not-found'}
]

const PageShowcase = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    const filteredPages = searchTerm
        ? pages.filter(page =>
            page.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : pages

    const safeSelectedIndex =
        selectedIndex >= filteredPages.length ? 0 : selectedIndex
    const selectedPage = filteredPages[safeSelectedIndex]

    return (
        <Box data-testid="page-showcase-page" layerStyle="page">
            <Seo
                title="Page Showcase"
                description="Explore all available pages"
                keywords="Pages, UI Library, React, Chakra UI"
            />
            <Container maxW="container.xl" py={8}>
                <Heading as="h1" size="2xl" color="blue.600" mb={8}>
                    Page Showcase
                </Heading>
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
                        <Input
                            mb={4}
                            placeholder="Search pages..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value)
                                setSelectedIndex(0)
                            }}
                        />
                        <VStack align="stretch" spacing={1} style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            {filteredPages.length === 0 && (
                                <Text color="gray.400" textAlign="center" py={4}>
                                    No pages found
                                </Text>
                            )}
                            {filteredPages.map((page, idx) => (
                                <Button
                                    key={page.name}
                                    variant={safeSelectedIndex === idx ? 'solid' : 'ghost'}
                                    colorScheme={safeSelectedIndex === idx ? 'blue' : 'gray'}
                                    justifyContent="flex-start"
                                    borderRadius="md"
                                    fontWeight={safeSelectedIndex === idx ? 'bold' : 'normal'}
                                    onClick={() => setSelectedIndex(idx)}
                                    w="full"
                                    size="md"
                                >
                                    {page.name}
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                    {/* Showcase Area */}
                    <Box
                        flex={1}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={8}
                        shadow="sm"
                        minH="320px"
                    >
                        {selectedPage ? (
                            <>
                                <Heading size="lg" color="blue.600" mb={2}>
                                    {selectedPage.name}
                                </Heading>
                                <Text color="gray.600" mb={4}>
                                    Path: <code>{selectedPage.path}</code>
                                </Text>
                                <Divider mb={6} />
                                <Box border="2px solid #82e880" borderRadius="md" overflow="hidden" minH="900px" bg="gray.50">
                                    <iframe
                                        title={selectedPage.name}
                                        src={selectedPage.path}
                                        style={{width: '100%', height: '900px', border: 'none'}}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Text color="gray.400">No page selected.</Text>
                        )}
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}

export default PageShowcase 