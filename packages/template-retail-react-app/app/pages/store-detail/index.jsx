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
    IconButton,
    Badge,
    Flex,
    Spacer,
    Grid,
    GridItem,
    Card,
    CardHeader,
    CardBody,
    Divider,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@salesforce/retail-react-app/app/components/shared/ui'

import Seo from '@salesforce/retail-react-app/app/components/seo'
import {HeartIcon, HeartSolidIcon, PhoneIcon, MapPinIcon} from '@salesforce/retail-react-app/app/components/icons'

// Hooks
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Constants
import {
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_DISTANCE_UNIT
} from '@salesforce/retail-react-app/app/constants'

const StoreDetail = () => {
    const {storeId} = useParams()
    const history = useHistory()
    const location = useLocation()
    const intl = useIntl()
    const {site} = useMultiSite()
    const [store, setStore] = useState(null)
    const [favoriteStores, setFavoriteStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)

    // Load store details
    const {
        data: searchStoresData,
        isLoading,
        error
    } = useSearchStores({
        parameters: {
            countryCode: 'US', // You might want to make this dynamic
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        }
    })

    useEffect(() => {
        if (searchStoresData?.data) {
            const foundStore = searchStoresData.data.find(s => s.id === storeId)
            setStore(foundStore)
        }
    }, [searchStoresData, storeId])

    useEffect(() => {
        // Load favorites and selected store from localStorage
        const savedFavorites = localStorage.getItem('favoriteStores')
        if (savedFavorites) {
            setFavoriteStores(JSON.parse(savedFavorites))
        }

        const savedSelected = localStorage.getItem('selectedStore')
        if (savedSelected) {
            setSelectedStore(JSON.parse(savedSelected))
        }
    }, [])

    const handleFavoriteToggle = () => {
        if (!store) return

        const isFavorite = favoriteStores.some(fav => fav.id === store.id)
        let updated

        if (isFavorite) {
            updated = favoriteStores.filter(fav => fav.id !== store.id)
        } else {
            updated = [...favoriteStores, store]
        }

        setFavoriteStores(updated)
        localStorage.setItem('favoriteStores', JSON.stringify(updated))
    }

    const handleSelectStore = () => {
        if (!store) return

        setSelectedStore(store)
        localStorage.setItem('selectedStore', JSON.stringify(store))
        
        // Also update the legacy localStorage key
        const storeInfoKey = `store_${site.id}`
        localStorage.setItem(
            storeInfoKey,
            JSON.stringify({
                id: store.id,
                name: store.name || null,
                inventoryId: store.inventoryId || null
            })
        )
    }

    const handleViewInventory = () => {
        history.push(`/store/${storeId}/inventory`)
    }

    const handleBackToLocator = () => {
        history.push('/store-locator')
    }

    const handleCallStore = () => {
        if (store?.phone) {
            window.location.href = `tel:${store.phone}`
        }
    }

    const handleGetDirections = () => {
        if (store) {
            const address = `${store.address1}, ${store.city}, ${store.stateCode} ${store.postalCode}`
            const encodedAddress = encodeURIComponent(address)
            window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank')
        }
    }

    if (isLoading) {
        return (
            <Box bg="gray.50" py={[8, 16]}>
                <Container>
                    <Text>Loading store details...</Text>
                </Container>
            </Box>
        )
    }

    if (error || !store) {
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

    const isFavorite = favoriteStores.some(fav => fav.id === store.id)
    const isSelected = selectedStore?.id === store.id

    return (
        <Box bg="gray.50" py={[8, 16]}>
            <Seo 
                title={`${store.name} - Store Details`} 
                description={`Visit ${store.name} at ${store.address1}, ${store.city}`} 
            />
            
            <Container maxW="container.xl">
                <Button mb={6} variant="ghost" onClick={handleBackToLocator}>
                    ← Back to Store Locator
                </Button>

                <Grid templateColumns={{base: '1fr', lg: '2fr 1fr'}} gap={8}>
                    <GridItem>
                        <Card>
                            <CardHeader>
                                <Flex align="center">
                                    <VStack align="start" flex="1">
                                        <Heading size="lg">{store.name}</Heading>
                                        <HStack>
                                            {isSelected && (
                                                <Badge colorScheme="blue" variant="solid">
                                                    Selected Store
                                                </Badge>
                                            )}
                                            {isFavorite && (
                                                <Badge colorScheme="red" variant="outline">
                                                    Favorite
                                                </Badge>
                                            )}
                                        </HStack>
                                    </VStack>
                                    <IconButton
                                        icon={isFavorite ? <HeartSolidIcon /> : <HeartIcon />}
                                        variant="ghost"
                                        size="lg"
                                        colorScheme={isFavorite ? "red" : "gray"}
                                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                        onClick={handleFavoriteToggle}
                                    />
                                </Flex>
                            </CardHeader>
                            
                            <CardBody>
                                <VStack align="stretch" spacing={4}>
                                    <Box>
                                        <Heading size="md" mb={2}>Store Information</Heading>
                                        <VStack align="start" spacing={1}>
                                            <HStack>
                                                <MapPinIcon />
                                                <VStack align="start" spacing={0}>
                                                    <Text>{store.address1}</Text>
                                                    <Text>
                                                        {store.city}, {store.stateCode} {store.postalCode}
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                            
                                            {store.phone && (
                                                <HStack>
                                                    <PhoneIcon />
                                                    <Text 
                                                        as="button" 
                                                        color="blue.600" 
                                                        onClick={handleCallStore}
                                                        _hover={{textDecoration: 'underline'}}
                                                    >
                                                        {store.phone}
                                                    </Text>
                                                </HStack>
                                            )}

                                            {store.distance !== undefined && (
                                                <Text fontSize="sm" color="gray.500">
                                                    {store.distance} {store.distanceUnit} away
                                                </Text>
                                            )}
                                        </VStack>
                                    </Box>

                                    {store.storeHours && (
                                        <Box>
                                            <Heading size="md" mb={2}>Store Hours</Heading>
                                            <Text whiteSpace="pre-line" fontSize="sm">
                                                {store.storeHours}
                                            </Text>
                                        </Box>
                                    )}

                                    <Divider />

                                    <VStack spacing={3}>
                                        <Button
                                            size="lg"
                                            colorScheme="blue"
                                            width="full"
                                            onClick={handleSelectStore}
                                            isDisabled={isSelected}
                                        >
                                            {isSelected ? 'Currently Selected' : 'Select This Store'}
                                        </Button>

                                        <HStack width="full" spacing={2}>
                                            <Button
                                                flex="1"
                                                variant="outline"
                                                onClick={handleGetDirections}
                                            >
                                                Get Directions
                                            </Button>
                                            
                                            {store.phone && (
                                                <Button
                                                    flex="1"
                                                    variant="outline"
                                                    onClick={handleCallStore}
                                                >
                                                    Call Store
                                                </Button>
                                            )}
                                        </HStack>

                                        {store.inventoryId && (
                                            <Button
                                                width="full"
                                                variant="outline"
                                                colorScheme="green"
                                                onClick={handleViewInventory}
                                            >
                                                View Store Inventory
                                            </Button>
                                        )}
                                    </VStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    </GridItem>

                    <GridItem>
                        <Card>
                            <CardHeader>
                                <Heading size="md">Store Services</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack align="stretch" spacing={3}>
                                    <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                                        <Text fontWeight="semibold" color="green.800">In-Store Pickup Available</Text>
                                        <Text fontSize="sm" color="green.600">
                                            Shop online and pick up your order at this store
                                        </Text>
                                    </Box>

                                    {store.inventoryId && (
                                        <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                                            <Text fontWeight="semibold" color="blue.800">Real-time Inventory</Text>
                                            <Text fontSize="sm" color="blue.600">
                                                Check product availability at this location
                                            </Text>
                                        </Box>
                                    )}

                                    {store.storeLocatorEnabled && (
                                        <Box p={3} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                                            <Text fontWeight="semibold" color="purple.800">Store Locator Enabled</Text>
                                            <Text fontSize="sm" color="purple.600">
                                                This store appears in store locator searches
                                            </Text>
                                        </Box>
                                    )}
                                </VStack>
                            </CardBody>
                        </Card>

                        <Card mt={6}>
                            <CardHeader>
                                <Heading size="md">Quick Actions</Heading>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={2}>
                                    <Button variant="outline" width="full" onClick={() => history.push('/')}>
                                        Continue Shopping
                                    </Button>
                                    <Button variant="outline" width="full" onClick={() => history.push('/cart')}>
                                        View Cart
                                    </Button>
                                    <Button variant="outline" width="full" onClick={handleBackToLocator}>
                                        Find Other Stores
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

StoreDetail.getTemplateName = () => 'store-detail'

export default StoreDetail 