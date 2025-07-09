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
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useLocation, useHistory} from 'react-router-dom'
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar'
import Home2 from '@salesforce/retail-react-app/app/pages/home2';

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
    {name: 'Page Not Found', path: '/page-not-found'},
    {name: 'Home2', path: '/home2'}
]

const PageShowcase = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const location = useLocation()
    const history = useHistory()

    // Add to cart if empty
    const {data: basket, derivedData: {totalItems} = {}} = useCurrentBasket()
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')
    React.useEffect(() => {
        if (basket && (basket.productItems?.length === 0 || totalItems === 0)) {
            addItemToBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {
                    productId: '25752981M', // Example productId
                    quantity: 1
                }
            })
        }
    }, [basket, totalItems])

    const filteredPages = searchTerm
        ? pages.filter(page =>
            page.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : pages

    const safeSelectedIndex =
        selectedIndex >= filteredPages.length ? 0 : selectedIndex
    const selectedPage = filteredPages[safeSelectedIndex]

    // Top bar navigation
    const goToPageShowcase = () => history.push('/_dev/page-showcase')
    const goToComponentShowcase = () => history.push('/_dev/component-showcase')
    const goToHooksShowcase = () => history.push('/_dev/hooks-showcase')


    return (
        <Box data-testid="page-showcase-page" layerStyle="page" minHeight="200vh">
            <ShowcaseTopBar />
            <Container maxW="container.2xl" py={8} minHeight="200vh">
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
                                <Text size="md" color="blue.600" mb={2}>
                                    <b>{selectedPage.name} page</b> - <span style={{color: '#2D3748'}}>Path: <code>{selectedPage.path}</code></span>
                                </Text>
                                <Divider mb={6} />
                                <Box border="2px solid #82e880" borderRadius="md" overflow="hidden" minH="900px" bg="gray.50">
                                    <iframe
                                        title={selectedPage.name}
                                        src={selectedPage.path}
                                        style={{width: '100%', height: '1800px', border: 'none'}}
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