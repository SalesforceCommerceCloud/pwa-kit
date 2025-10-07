/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useLocation} from 'react-router-dom'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    HStack,
    VStack,
    Text,
    Image,
    IconButton,
    Input
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Seo from '@salesforce/retail-react-app/app/components/seo'
import Island from '@salesforce/retail-react-app/app/components/island'

// Others
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

//Hooks
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'

// Constants
import {
    HOME_SHOP_PRODUCTS_CATEGORY_ID,
    HOME_SHOP_PRODUCTS_LIMIT,
    MAX_CACHE_AGE,
    STALE_WHILE_REVALIDATE
} from '@salesforce/retail-react-app/app/constants'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

// Icons
import {ChevronLeftIcon, ChevronRightIcon} from '@chakra-ui/icons'

/**
 * MontClair Fashion Home Page - Modern E-commerce Storefront
 * Designed to match the Odyssey Design System from Figma
 */
const Home = () => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const {pathname} = useLocation()

    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }

    const {data: productSearchResult} = useProductSearch({
        parameters: {
            allImages: true,
            allVariationProperties: true,
            expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
            limit: HOME_SHOP_PRODUCTS_LIMIT,
            perPricebook: true,
            refine: [`cgid=${HOME_SHOP_PRODUCTS_CATEGORY_ID}`, 'htype=master']
        }
    })

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
        dataCloud.sendViewPage(pathname)
    }, [])

    // Hero carousel data
    const heroSlides = [
        {
            title: 'Designed for comfort,\ncrafted with care.',
            subtitle: 'Experience the elegance of MontClair fashion.',
            video: getAssetUrl('static/video/banner_video.webm'),
            poster: getAssetUrl('static/img/hero-df-1.jpg'),
            buttonText: 'Shop Now'
        }
    ]

    return (
        <Box
            data-testid="home-page"
            width="100%"
            maxWidth="100%"
            marginLeft="auto"
            marginRight="auto"
            paddingTop={0}
            paddingBottom={32}
            paddingX={0}
        >
            <Seo
                title="MontClair Fashion - Home"
                description="Discover the latest in fashion footwear. Premium quality shoes for every occasion."
                keywords="fashion, shoes, footwear, heels, sneakers, boots, sandals"
            />

            {/* Hero Carousel Section */}
            <Island hydrateOn={'visible'}>
                <Box position="relative" width="100%" height="calc(100vh - 80px)" overflow="hidden">
                    {/* Hero Video */}
                    <Box position="relative" width="100%" height="100%" overflow="hidden">
                        <Box
                            as="video"
                            width="100%"
                            height="100%"
                            objectFit="cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            poster={heroSlides[0].poster}
                            position="absolute"
                            top={0}
                            left={0}
                            zIndex={1}
                        >
                            <source src={heroSlides[0].video} type="video/mp4" />
                        </Box>
                        {/* Dark overlay for better text readability */}
                        <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            background="linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)"
                            zIndex={2}
                        />

                        {/* Content */}
                        <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            padding="48px"
                            color="white"
                            zIndex={3}
                        >
                            <VStack align="start" spacing={4} maxW="600px">
                                <Text
                                    fontSize="30px"
                                    fontWeight="700"
                                    lineHeight="1em"
                                    letterSpacing="-2.5%"
                                    whiteSpace="pre-line"
                                    color="white"
                                >
                                    {heroSlides[0].title}
                                </Text>
                                <Text
                                    fontSize="18px"
                                    fontWeight="400"
                                    lineHeight="1em"
                                    color="rgba(255, 255, 255, 0.8)"
                                >
                                    {heroSlides[0].subtitle}
                                </Text>
                                <Button
                                    bg="gray.800"
                                    color="white"
                                    size="md"
                                    paddingX={4}
                                    paddingY={2}
                                    height="36px"
                                    _hover={{transform: 'translateY(-1px)', bg: 'gray.900'}}
                                >
                                    {heroSlides[0].buttonText}
                                </Button>
                            </VStack>
                        </Box>
                    </Box>

                    {/* Carousel Navigation */}
                    <IconButton
                        position="absolute"
                        left="48px"
                        top="50%"
                        transform="translateY(-50%)"
                        aria-label="Previous slide"
                        icon={<ChevronLeftIcon />}
                        variant="outline"
                        borderRadius="full"
                        bg="white"
                        color="gray.800"
                        opacity={0.8}
                        _hover={{opacity: 1, transform: 'translateY(-50%) scale(1.05)'}}
                    />
                    <IconButton
                        position="absolute"
                        right="48px"
                        top="50%"
                        transform="translateY(-50%)"
                        aria-label="Next slide"
                        icon={<ChevronRightIcon />}
                        variant="outline"
                        borderRadius="full"
                        bg="white"
                        color="gray.800"
                        opacity={0.8}
                        _hover={{opacity: 1, transform: 'translateY(-50%) scale(1.05)'}}
                    />
                </Box>
            </Island>

            {/* Featured Products Section */}
            {productSearchResult && (
                <Island hydrateOn={'visible'}>
                    <Box paddingY={16} paddingX={0}>
                        <VStack spacing={8} align="center">
                            <VStack spacing={2} textAlign="center" paddingX={4}>
                                <Text
                                    fontSize="36px"
                                    fontWeight="700"
                                    lineHeight="1em"
                                    letterSpacing="-2.5%"
                                    color="gray.800"
                                >
                                    Featured Products
                                </Text>
                                <Text
                                    fontSize="16px"
                                    fontWeight="400"
                                    lineHeight="1.5em"
                                    color="gray.600"
                                >
                                    Discover our curated collection of premium products
                                </Text>
                            </VStack>

                            <SimpleGrid
                                columns={{base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6}}
                                spacing={0}
                                width="100%"
                            >
                                {productSearchResult?.hits?.slice(0, 6).map((product, index) => (
                                    <Box
                                        key={product.id || index}
                                        bg="white"
                                        borderRadius="base"
                                        border="1px solid"
                                        borderColor="gray.100"
                                        overflow="hidden"
                                        _hover={{transform: 'translateY(-2px)', shadow: 'lg'}}
                                        transition="all 0.2s"
                                        margin="1px"
                                    >
                                        {/* Product Image */}
                                        <Box
                                            height="200px"
                                            bg="gray.50"
                                            position="relative"
                                            overflow="hidden"
                                        >
                                            {product.imageGroups?.[0]?.images?.[0]?.link && (
                                                <Image
                                                    src={product.imageGroups[0].images[0].link}
                                                    alt={
                                                        product.productName ||
                                                        product.image?.alt ||
                                                        'Product image'
                                                    }
                                                    width="100%"
                                                    height="100%"
                                                    objectFit="cover"
                                                />
                                            )}
                                        </Box>

                                        {/* Product Info */}
                                        <Box padding={6}>
                                            <VStack align="start" spacing={3}>
                                                <VStack align="start" spacing={1}>
                                                    <Text
                                                        fontSize="18px"
                                                        fontWeight="600"
                                                        lineHeight="1em"
                                                        letterSpacing="-2.5%"
                                                        color="gray.800"
                                                    >
                                                        {product.productName || 'Product Title'}
                                                    </Text>
                                                    <Text
                                                        fontSize="14px"
                                                        fontWeight="400"
                                                        lineHeight="1.43em"
                                                        color="gray.600"
                                                    >
                                                        {product.image?.alt ||
                                                            'Product description'}
                                                    </Text>
                                                </VStack>

                                                {/* Color Swatches */}
                                                <HStack spacing={2}>
                                                    <Box
                                                        width="20px"
                                                        height="20px"
                                                        borderRadius="full"
                                                        bg="black"
                                                        border="1px solid"
                                                        borderColor="black"
                                                    />
                                                    <Box
                                                        width="20px"
                                                        height="20px"
                                                        borderRadius="full"
                                                        bg="teal.600"
                                                        border="1px solid"
                                                        borderColor="gray.300"
                                                    />
                                                    <Box
                                                        width="20px"
                                                        height="20px"
                                                        borderRadius="full"
                                                        bg="white"
                                                        border="1px solid"
                                                        borderColor="gray.300"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <Text fontSize="10px" color="gray.500">
                                                            +
                                                        </Text>
                                                    </Box>
                                                </HStack>

                                                {/* Price and Button */}
                                                <HStack justify="space-between" width="100%">
                                                    <Text
                                                        fontSize="20px"
                                                        fontWeight="600"
                                                        lineHeight="1em"
                                                        letterSpacing="-3%"
                                                        color="gray.800"
                                                    >
                                                        {product.currency === 'GBP' ? '£' : '$'}
                                                        {product.price || '0.00'}
                                                    </Text>
                                                </HStack>

                                                <Button
                                                    colorScheme="gray"
                                                    size="sm"
                                                    width="100%"
                                                    height="36px"
                                                    _hover={{transform: 'translateY(-1px)'}}
                                                >
                                                    Add to Cart
                                                </Button>
                                            </VStack>
                                        </Box>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        </VStack>
                    </Box>
                </Island>
            )}

            {/* New Arrivals Promo Banner */}
            <Island hydrateOn={'visible'}>
                <Box paddingY={6} paddingX={{base: 4, md: 20}}>
                    <HStack spacing={12} align="stretch">
                        {/* Image Column */}
                        <Box
                            flex="1"
                            height="500px"
                            bg="gray.50"
                            borderRadius="base"
                            border="1px solid"
                            borderColor="gray.100"
                            position="relative"
                            overflow="hidden"
                        >
                            <Image
                                src={getAssetUrl('static/img/new-arrivals.jpg')}
                                alt="New Arrivals"
                                width="100%"
                                height="100%"
                                objectFit="cover"
                            />
                        </Box>

                        {/* Content Column */}
                        <Box flex="1" paddingY={6}>
                            <VStack align="start" spacing={4} height="100%" justify="center">
                                <VStack align="start" spacing={2}>
                                    <Text
                                        fontSize="24px"
                                        fontWeight="600"
                                        lineHeight="1em"
                                        letterSpacing="-2.5%"
                                        color="gray.800"
                                    >
                                        New Arrivals
                                    </Text>
                                    <Text
                                        fontSize="14px"
                                        fontWeight="400"
                                        lineHeight="1.43em"
                                        color="gray.600"
                                    >
                                        Discover the latest additions to our collection. From
                                        statement pieces to everyday essentials.
                                    </Text>
                                </VStack>
                                <Button
                                    colorScheme="gray"
                                    size="md"
                                    paddingX={4}
                                    paddingY={2}
                                    height="36px"
                                    _hover={{transform: 'translateY(-1px)'}}
                                >
                                    SHOP NEW ARRIVALS
                                </Button>
                            </VStack>
                        </Box>
                    </HStack>
                </Box>
            </Island>

            {/* Newsletter Section */}
            <Island hydrateOn={'visible'}>
                <Box paddingY={16} paddingX={{base: 4, md: 8, lg: 12, xl: 16}}>
                    <Box
                        bg="gray.800"
                        borderRadius="base"
                        border="1px solid"
                        borderColor="gray.100"
                        padding={8}
                    >
                        <VStack spacing={6} align="center" maxW="600px" margin="0 auto">
                            <VStack spacing={2} textAlign="center">
                                <Text
                                    fontSize="24px"
                                    fontWeight="600"
                                    lineHeight="1em"
                                    letterSpacing="-2.5%"
                                    color="white"
                                >
                                    Stay Updated
                                </Text>
                                <Text
                                    fontSize="14px"
                                    fontWeight="400"
                                    lineHeight="1.43em"
                                    color="gray.300"
                                >
                                    Be the first to know about new collections and exclusive offers.
                                </Text>
                            </VStack>

                            <HStack spacing={3} width="100%" maxW="400px">
                                <Input
                                    placeholder="your.email@email.com"
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    _focus={{borderColor: 'gray.400'}}
                                />
                                <Button
                                    bg="white"
                                    color="gray.800"
                                    size="md"
                                    paddingX={4}
                                    paddingY={2}
                                    height="36px"
                                    _hover={{transform: 'translateY(-1px)'}}
                                >
                                    Subscribe
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                </Box>
            </Island>
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home
