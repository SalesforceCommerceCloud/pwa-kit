/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    Heading,
    Text,
    Stack,
    Link,
    Image,
    VStack
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Seo from '@salesforce/retail-react-app/app/components/seo'
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'
import Island from '@salesforce/retail-react-app/app/components/island'
import Banner from '@salesforce/retail-react-app/app/components/banner'

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

/**
 * Visual-rich home page inspired by NTO demo site
 * Features: Hero banners, category showcase, content cards
 */
const Home = () => {
    const intl = useIntl()
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

    const {data: productSearchResult, isLoading} = useProductSearch({
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

    // Category data for showcase grid
    const categories = [
        {
            name: 'Women',
            slug: 'womens',
            image: getAssetUrl('static/img/category/women-subcategory-footwear-200-200.png')
        },
        {
            name: 'Men',
            slug: 'mens',
            image: getAssetUrl('static/img/category/men-subcategory-jackets-200-200.png')
        },
        {
            name: 'New Arrivals',
            slug: 'newarrivals',
            image: getAssetUrl('static/img/category/footwear-subcategory-kids-200-200.png')
        },
        {
            name: 'Gear',
            slug: 'newarrivals',
            image: getAssetUrl('static/img/category/gear-subcategory-bags-200-200.png')
        },
        {
            name: 'Kids',
            slug: 'newarrivals',
            image: getAssetUrl('static/img/category/footwear-subcategory-kids-200-200.png')
        },
        {
            name: 'Nutrition',
            slug: 'newarrivals',
            image: getAssetUrl('static/img/category/nutrition-subcategory-energy-200-200.png')
        }
    ]

    return (
        <Box data-testid="home-page">
            <Seo
                title="Home Page"
                description="Commerce Cloud Retail React App"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

            {/* Main Hero Banner */}
            <Island hydrateOn={'visible'}>
                <Banner
                    background={getAssetUrl('static/img/homepage/home-banner-01-1905-800.jpg')}
                    height={500}
                    variant="center"
                    backgroundY={0.4}
                >
                    <VStack spacing={4}>
                        <Heading
                            as="h1"
                            size="2xl"
                            color="white"
                            textShadow="2px 2px 4px rgba(0,0,0,0.8)"
                        >
                            Adventure Awaits
                        </Heading>
                        <Button
                            size="lg"
                            colorScheme="blue"
                            as={Link}
                            href="/category/newarrivals"
                            _hover={{textDecoration: 'none'}}
                        >
                            Shop Now
                        </Button>
                    </VStack>
                </Banner>
            </Island>

            {/* Shop By Category Section */}
            <Island hydrateOn={'visible'}>
                <Box maxW="container.xxxl" mx="auto" px={[4, 4, 6, 8]} pt={4} pb={8}>
                    <Heading as="h2" size="xl" textAlign="center" mb={8}>
                        Shop By Category
                    </Heading>
                    <SimpleGrid columns={{base: 2, md: 3, lg: 6}} spacing={6}>
                        {categories.map((category, index) => (
                            <Link
                                key={index}
                                href={`/category/${category.slug}`}
                                _hover={{textDecoration: 'none'}}
                            >
                                <Box
                                    position="relative"
                                    overflow="hidden"
                                    borderRadius="lg"
                                    _hover={{transform: 'scale(1.05)', transition: 'all 0.3s'}}
                                >
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        w="100%"
                                        h="200px"
                                        objectFit="cover"
                                    />
                                    <Box
                                        position="absolute"
                                        bottom={0}
                                        left={0}
                                        right={0}
                                        bg="rgba(0,0,0,0.6)"
                                        color="white"
                                        py={3}
                                        textAlign="center"
                                    >
                                        <Heading as="h3" size="md">
                                            {category.name}
                                        </Heading>
                                    </Box>
                                </Box>
                            </Link>
                        ))}
                    </SimpleGrid>
                </Box>
            </Island>

            {/* Content Banner - Rain Gear */}
            <Island hydrateOn={'visible'}>
                <Banner
                    background={getAssetUrl('static/img/assets/071519_Tile_Rain_475x300.jpeg')}
                    height={400}
                    variant="left"
                >
                    <VStack align="start" spacing={4}>
                        <Heading as="h2" size="xl" color="white">
                            Rain? Where?
                        </Heading>
                        <Text fontSize="lg" color="white">
                            Stay dry with our premium rain jackets
                        </Text>
                        <Button colorScheme="blue" size="lg">
                            Shop Rain Gear
                        </Button>
                    </VStack>
                </Banner>
            </Island>

            {/* New Arrivals Banner */}
            <Island hydrateOn={'visible'}>
                <Banner
                    background={getAssetUrl('static/img/assets/071519_Tile_new_arrivals_475x300.jpeg')}
                    height={400}
                    variant="right"
                >
                    <VStack align="end" spacing={4}>
                        <Heading as="h2" size="xl" color="white">
                            New Seasons, New Styles
                        </Heading>
                        <Text fontSize="lg" color="white">
                            Discover our latest collection
                        </Text>
                        <Button colorScheme="blue" size="lg">
                            Shop New Arrivals
                        </Button>
                    </VStack>
                </Banner>
            </Island>

            {/* Image + Text Content Card */}
            <Island hydrateOn={'visible'}>
                <Box maxW="container.xxxl" mx="auto" px={[4, 4, 6, 8]} py={16}>
                    <SimpleGrid columns={{base: 1, md: 2}} spacing={10} alignItems="center">
                        <Image
                            src={getAssetUrl('static/img/assets/gear_collage_475x300.jpg')}
                            alt="Outdoor Adventure"
                            borderRadius="lg"
                            w="100%"
                            h="400px"
                            objectFit="cover"
                        />
                        <Box>
                            <Heading as="h2" size="xl" mb={6}>
                                Created for a Lifetime of Exploring
                            </Heading>
                            <Text fontSize="lg" color="gray.700" lineHeight="tall">
                                NTO gear and apparel is guaranteed to last, that's our promise to
                                you. We believe a life outdoors is a life well lived and we want to
                                enable everyone to discover the benefits of spending time outdoors.
                            </Text>
                            <Button mt={6} colorScheme="blue" size="lg">
                                Shop Gear
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Box>
            </Island>

            {/* Recommended Products */}
            {productSearchResult && (
                <Island hydrateOn={'visible'}>
                    <Box maxW="container.xxxl" mx="auto" px={[4, 4, 6, 8]} py={16}>
                        <Heading as="h2" size="xl" textAlign="center" mb={8}>
                            Recommended For You
                        </Heading>
                        <Stack pt={8} spacing={16}>
                            <ProductScroller
                                products={productSearchResult?.hits}
                                isLoading={isLoading}
                            />
                        </Stack>
                    </Box>
                </Island>
            )}

            {/* Social Section */}
            <Island hydrateOn={'visible'}>
                <Box bg="gray.100" py={16}>
                    <Box maxW="container.xxxl" mx="auto" px={[4, 4, 6, 8]} textAlign="center">
                        <Heading as="h2" size="xl" mb={4}>
                            #WeAreNTO
                        </Heading>
                        <Text fontSize="lg" color="gray.700" mb={8}>
                            Share how you take NTO with you on your outdoor adventures
                        </Text>
                        <SimpleGrid columns={{base: 2, md: 4}} spacing={6}>
                            {[1, 2, 3, 4].map((item) => (
                                <Box
                                    key={item}
                                    bg="white"
                                    h="200px"
                                    borderRadius="lg"
                                    boxShadow="md"
                                />
                            ))}
                        </SimpleGrid>
                    </Box>
                </Box>
            </Island>
        </Box>
    )
}

Home.getTemplateName = () => 'home'

export default Home
