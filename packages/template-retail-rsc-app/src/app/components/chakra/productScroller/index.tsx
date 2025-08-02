'use client'
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useRef, useMemo, useState, useEffect} from 'react'
import {
    AspectRatio,
    Box,
    Heading,
    IconButton,
    Skeleton,
    Stack,
    ChakraProvider
} from '@chakra-ui/react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import ProductTile from './productTile'
import {ChevronLeft, ChevronRight} from '@/app/components/icons'
// import {useIntl} from 'react-intl' // Removed to avoid dependency issues

// Mock data for demonstration
const MOCK_PRODUCTS: ShopperSearchTypes.ProductSearchHit[] = [
    {
        productId: '25752986M',
        productName: 'Striped Silk Tie',
        price: 89.99,
        currency: 'USD',
        image: {
            alt: 'Striped Silk Tie',
            disBaseLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10236685.JJ5FUXX.PZ.jpg',
            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10236685.JJ5FUXX.PZ.jpg'
        }
    },
    {
        productId: '25564011M',
        productName: 'Cotton Sweater',
        price: 129.99,
        currency: 'USD',
        image: {
            alt: 'Cotton Sweater',
            disBaseLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10235928.JJ0QZXX.PZ.jpg',
            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10235928.JJ0QZXX.PZ.jpg'
        }
    },
    {
        productId: '25673126M',
        productName: 'Classic Oxford Shirt',
        price: 79.99,
        currency: 'USD',
        image: {
            alt: 'Classic Oxford Shirt',
            disBaseLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10236919.JJ169XX.PZ.jpg',
            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10236919.JJ169XX.PZ.jpg'
        }
    },
    {
        productId: '25673127M',
        productName: 'Premium Wool Blazer',
        price: 299.99,
        currency: 'USD',
        image: {
            alt: 'Premium Wool Blazer',
            disBaseLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10237003.JJ5FUXX.PZ.jpg',
            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10237003.JJ5FUXX.PZ.jpg'
        }
    },
    {
        productId: '25673128M',
        productName: 'Leather Dress Shoes',
        price: 199.99,
        currency: 'USD',
        image: {
            alt: 'Leather Dress Shoes',
            disBaseLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10235928.JJ0QZXX.PZ.jpg',
            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d1b6bb7/images/large/PG.10235928.JJ0QZXX.PZ.jpg'
        }
    }
]

// TypeScript interfaces
interface ProductScrollerProps {
    header?: React.ReactNode
    title?: string
    products?: ShopperSearchTypes.ProductSearchHit[]
    isLoading?: boolean
    scrollProps?: Record<string, any>
    itemWidth?: Record<string, string> | string
    productTileProps?:
        | Record<string, any>
        | ((product: ShopperSearchTypes.ProductSearchHit) => Record<string, any>)
    [key: string]: any
}

/**
 * Renders a scrollable, horizontal container of products with native scroll
 * snapping and manual button controls.
 */
const ProductScroller = forwardRef<HTMLDivElement, ProductScrollerProps>(
    (
        {
            header,
            title,
            products,
            isLoading = false,
            scrollProps,
            itemWidth = {base: '70%', md: '40%', lg: 'calc(33.33% - 10px)'},
            productTileProps,
            ...props
        },
        ref
    ) => {
        const scrollRef = useRef<HTMLDivElement>(null)

        // Static messages (removed react-intl dependency)
        const messages = {
            scrollLeft: 'Scroll products left',
            scrollRight: 'Scroll products right'
        }

        // Renders nothing if we aren't loading and have no products.
        if ((!products || products.length < 1) && !isLoading) {
            return null
        }

        // Scroll the container left or right by 100%. Passing no args or `1`
        // scrolls to the right, and passing `-1` scrolls left.
        const scroll = (direction = 1) => {
            scrollRef.current?.scrollBy({
                top: 0,
                left: direction * scrollRef.current?.offsetWidth,
                behavior: 'smooth'
            })
        }

        return (
            <Box position="relative" data-testid="product-scroller" ref={ref}>
                <Stack gap={6} {...props}>
                    {isLoading && <Skeleton height={6} width="150px" m="auto" />}

                    {title && !header && !isLoading && (
                        <Heading as="h2" fontSize="xl" textAlign="center">
                            {title}
                        </Heading>
                    )}

                    {!title && !isLoading && header}

                    <Stack
                        ref={scrollRef}
                        direction="row"
                        gap={4}
                        wrap="nowrap"
                        overflowX="scroll"
                        px={{base: 4, md: 8, lg: 0}}
                        py={1}
                        {...scrollProps}
                        css={{
                            scrollPadding: {base: 16, md: 32, lg: 0},
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch', // Safari touch scrolling needed for scroll snap
                            ...scrollProps?.css
                        }}
                    >
                        {isLoading
                            ? [0, 1, 2, 3].map((key) => {
                                  return (
                                      <Box
                                          key={key}
                                          flex="0 0 auto"
                                          width={itemWidth}
                                          style={{scrollSnapAlign: 'start'}}
                                      >
                                          <Stack data-testid="product-scroller-item-skeleton">
                                              <AspectRatio ratio={1}>
                                                  <Skeleton />
                                              </AspectRatio>
                                              <Stack gap={2}>
                                                  <Skeleton width="150px" height={5} />
                                                  <Skeleton width="75px" height={5} />
                                              </Stack>
                                          </Stack>
                                      </Box>
                                  )
                              })
                            : products.map((product, idx) => {
                                  return (
                                      <Box
                                          key={product?.id || idx}
                                          flex="0 0 auto"
                                          width={itemWidth}
                                          style={{scrollSnapAlign: 'start'}}
                                      >
                                          <ProductTile
                                              data-testid="product-scroller-item"
                                              product={product}
                                              {...(typeof productTileProps === 'function'
                                                  ? {...productTileProps(product)}
                                                  : {...productTileProps})}
                                              dynamicImageProps={{
                                                  widths: ['70vw', '70vw', '40vw', '30vw']
                                              }}
                                          />
                                      </Box>
                                  )
                              })}
                    </Stack>
                </Stack>

                {!isLoading && products?.length > 3 && (
                    <>
                        <Box
                            display={{
                                base: 'none',
                                lg: 'block'
                            }}
                            position="absolute"
                            top="50%"
                            left={{base: 0, lg: 4}}
                            transform="translateY(-50%)"
                        >
                            <IconButton
                                data-testid="product-scroller-nav-left"
                                aria-label={messages.scrollLeft}
                                borderRadius="full"
                                bg="white/36"
                                _hover={{bg: 'white/48'}}
                                onClick={() => scroll(-1)}
                            >
                                <ChevronLeft color="black" />
                            </IconButton>
                        </Box>

                        <Box
                            display={{
                                base: 'none',
                                lg: 'block'
                            }}
                            position="absolute"
                            top="50%"
                            right={{base: 0, lg: 4}}
                            transform="translateY(-50%)"
                        >
                            <IconButton
                                data-testid="product-scroller-nav-right"
                                aria-label={messages.scrollRight}
                                borderRadius="full"
                                bg="white/36"
                                _hover={{bg: 'white/48'}}
                                onClick={() => scroll(1)}
                            >
                                <ChevronRight color="black" />
                            </IconButton>
                        </Box>
                    </>
                )}
            </Box>
        )
    }
)

// Wrapper component with ChakraProvider and data fetching
const ChakraProductScrollerIsland = (
    props: Omit<ProductScrollerProps, 'products' | 'isLoading'>
) => {
    const [products, setProducts] = useState<ShopperSearchTypes.ProductSearchHit[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate API call with delay
        const fetchProducts = async () => {
            setIsLoading(true)
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setProducts(MOCK_PRODUCTS)
            setIsLoading(false)
        }

        fetchProducts()
    }, [])

    return (
        <ChakraProvider>
            <ProductScroller {...props} products={products} isLoading={isLoading} />
        </ChakraProvider>
    )
}

ChakraProductScrollerIsland.displayName = 'ChakraProductScrollerIsland'

export default ChakraProductScrollerIsland
