/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import {useParams, useHistory, useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'

// Components
import {
    Box,
    Container,
    Heading,
    Text,
    HStack,
    VStack,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Grid,
    GridItem,
    Card,
    CardHeader,
    CardBody,
    Badge,
    Flex,
    Spacer,
    Select,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Skeleton,
    SkeletonText
} from '@salesforce/retail-react-app/app/components/shared/ui'

import Seo from '@salesforce/retail-react-app/app/components/seo'
import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'
import {SearchIcon} from '@salesforce/retail-react-app/app/components/icons'

// Hooks
import {useSearchStores, useProductSearch} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Constants
import {
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_DISTANCE_UNIT
} from '@salesforce/retail-react-app/app/constants'

const StoreInventory = () => {
    const {storeId} = useParams()
    const history = useHistory()
    const location = useLocation()
    const intl = useIntl()
    const {site} = useMultiSite()
    
    const [store, setStore] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('best-matches')
    const [limit, setLimit] = useState(25)

    // Load store details
    const {
        data: searchStoresData,
        isLoading: storeLoading,
        error: storeError
    } = useSearchStores({
        parameters: {
            countryCode: 'US', // Make this dynamic based on your requirements
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        }
    })

    // Search for products with store inventory
    const {
        data: productSearchResult,
        isLoading: productsLoading,
        error: productsError,
        refetch: refetchProducts
    } = useProductSearch({
        parameters: {
            q: searchQuery || '*',
            limit: limit,
            offset: 0,
            sort: sortBy,
            perPricebook: true,
            allVariationProperties: true,
            allImages: true,
            expand: ['promotions', 'variations', 'prices', 'images', 'availability'],
            ...(store?.inventoryId && {inventoryIds: [store.inventoryId]})
        }
    }, {
        enabled: !!store?.inventoryId
    })

    useEffect(() => {
        if (searchStoresData?.data) {
            const foundStore = searchStoresData.data.find(s => s.id === storeId)
            setStore(foundStore)
        }
    }, [searchStoresData, storeId])

    const handleSearch = () => {
        refetchProducts()
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleProductClick = (product) => {
        history.push(`/store/${storeId}/product/${product.productId}`)
    }

    const handleBackToStore = () => {
        history.push(`/store/${storeId}`)
    }

    const handleBackToLocator = () => {
        history.push('/store-locator')
    }

    if (storeLoading) {
        return (
            <Box bg="gray.50" py={[8, 16]}>
                <Container>
                    <Skeleton height="40px" mb={4} />
                    <SkeletonText mt="4" noOfLines={4} spacing="4" />
                </Container>
            </Box>
        )
    }

    if (storeError || !store) {
        return (
            <Box bg="gray.50" py={[8, 16]}>
                <Container>
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle>Store Not Found</AlertTitle>
                        <AlertDescription>
                            The requested store could not be found. Please try again.
                        </AlertDescription>
                    </Alert>
                    <Button mt={4} onClick={handleBackToLocator}>
                        Back to Store Locator
                    </Button>
                </Container>
            </Box>
        )
    }

    if (!store.inventoryId) {
        return (
            <Box bg="gray.50" py={[8, 16]}>
                <Container>
                    <Alert status="warning">
                        <AlertIcon />
                        <AlertTitle>Inventory Not Available</AlertTitle>
                        <AlertDescription>
                            Inventory information is not available for this store location.
                        </AlertDescription>
                    </Alert>
                    <HStack mt={4} spacing={2}>
                        <Button onClick={handleBackToStore}>
                            Back to Store Details
                        </Button>
                        <Button variant="outline" onClick={handleBackToLocator}>
                            Back to Store Locator
                        </Button>
                    </HStack>
                </Container>
            </Box>
        )
    }

    const products = productSearchResult?.hits || []
    const totalProducts = productSearchResult?.total || 0

    return (
        <Box bg="gray.50" py={[8, 16]}>
            <Seo 
                title={`${store.name} - Store Inventory`} 
                description={`Browse products available at ${store.name}`} 
            />
            
            <Container maxW="container.xl">
                <VStack align="stretch" spacing={6}>
                    {/* Header */}
                    <Box>
                        <Button mb={4} variant="ghost" onClick={handleBackToStore}>
                            ← Back to {store.name}
                        </Button>
                        
                        <Heading size="xl" mb={2}>
                            {store.name} - Store Inventory
                        </Heading>
                        
                        <Text color="gray.600" mb={4}>
                            {store.address1}, {store.city}, {store.stateCode} {store.postalCode}
                        </Text>
                        
                        {totalProducts > 0 && (
                            <Badge colorScheme="green" variant="subtle" p={2}>
                                {totalProducts} products available
                            </Badge>
                        )}
                    </Box>

                    {/* Search and Filters */}
                    <Card>
                        <CardBody>
                            <VStack spacing={4}>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <SearchIcon color="gray.300" />
                                    </InputLeftElement>
                                    <Input 
                                        placeholder="Search products in this store..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                </InputGroup>
                                
                                <HStack width="full" spacing={4}>
                                    <Select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        maxW="200px"
                                    >
                                        <option value="best-matches">Best Matches</option>
                                        <option value="price-low-to-high">Price: Low to High</option>
                                        <option value="price-high-to-low">Price: High to Low</option>
                                        <option value="product-name-ascending">Name: A-Z</option>
                                        <option value="product-name-descending">Name: Z-A</option>
                                        <option value="most-popular">Most Popular</option>
                                        <option value="top-sellers">Top Sellers</option>
                                    </Select>
                                    
                                    <Select 
                                        value={limit} 
                                        onChange={(e) => setLimit(parseInt(e.target.value))}
                                        maxW="150px"
                                    >
                                        <option value={12}>12 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                        <option value={100}>100 per page</option>
                                    </Select>
                                    
                                    <Spacer />
                                    
                                    <Button colorScheme="blue" onClick={handleSearch}>
                                        Search
                                    </Button>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Products Grid */}
                    {productsLoading ? (
                        <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                            {Array.from({length: 8}).map((_, index) => (
                                <Card key={index}>
                                    <CardBody>
                                        <Skeleton height="200px" mb={4} />
                                        <SkeletonText noOfLines={3} spacing="2" />
                                    </CardBody>
                                </Card>
                            ))}
                        </Grid>
                    ) : products.length > 0 ? (
                        <>
                            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                                {products.map((product) => (
                                    <Box 
                                        key={product.productId}
                                        cursor="pointer"
                                        onClick={() => handleProductClick(product)}
                                        _hover={{transform: 'scale(1.02)'}}
                                        transition="transform 0.2s"
                                    >
                                        <ProductTile
                                            product={product}
                                            enableFavourite={true}
                                        />
                                        
                                        {/* Store-specific inventory info */}
                                        <Card mt={2} size="sm">
                                            <CardBody p={2}>
                                                <Flex align="center" justify="space-between">
                                                    <Text fontSize="xs" color="gray.600">
                                                        Store Availability
                                                    </Text>
                                                    <Badge 
                                                        colorScheme={product.inventory?.stockLevel > 0 ? "green" : "red"}
                                                        variant="subtle"
                                                        size="sm"
                                                    >
                                                        {product.inventory?.stockLevel > 0 ? "In Stock" : "Out of Stock"}
                                                    </Badge>
                                                </Flex>
                                                
                                                {product.inventory?.stockLevel > 0 && (
                                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                                        Available for pickup
                                                    </Text>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Box>
                                ))}
                            </Grid>
                            
                            {/* Load More Button */}
                            {products.length < totalProducts && (
                                <Flex justify="center">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setLimit(prev => prev + 25)
                                            handleSearch()
                                        }}
                                    >
                                        Load More Products
                                    </Button>
                                </Flex>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardBody textAlign="center" py={12}>
                                <Heading size="md" mb={2} color="gray.600">
                                    No Products Found
                                </Heading>
                                <Text color="gray.500" mb={4}>
                                    {searchQuery 
                                        ? `No products matching "${searchQuery}" found at this store location.`
                                        : "No products are currently available at this store location."
                                    }
                                </Text>
                                {searchQuery && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setSearchQuery('')
                                            handleSearch()
                                        }}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                        <CardBody>
                            <Heading size="md" mb={4}>Quick Actions</Heading>
                            <HStack spacing={2} wrap="wrap">
                                <Button variant="outline" onClick={handleBackToStore}>
                                    Store Details
                                </Button>
                                <Button variant="outline" onClick={handleBackToLocator}>
                                    Find Other Stores
                                </Button>
                                <Button variant="outline" onClick={() => history.push('/')}>
                                    Continue Shopping Online
                                </Button>
                                <Button variant="outline" onClick={() => history.push('/cart')}>
                                    View Cart
                                </Button>
                            </HStack>
                        </CardBody>
                    </Card>
                </VStack>
            </Container>
        </Box>
    )
}

StoreInventory.getTemplateName = () => 'store-inventory'

export default StoreInventory 