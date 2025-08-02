/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useRef} from 'react'
import {
    AspectRatio,
    Box,
    Heading,
    IconButton,
    Skeleton,
    Stack
} from '@chakra-ui/react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import ProductTile from './productTile'
import {ChevronLeft, ChevronRight} from '@/app/components/icons'

// TypeScript interfaces
interface ProductScrollerProps {
    header?: React.ReactNode
    title?: string
    products?: ShopperSearchTypes.ProductSearchHit[]
    isLoading?: boolean
    scrollProps?: Record<string, any>
    itemWidth?: Record<string, string> | string
    productTileProps?: Record<string, any> | ((product: ShopperSearchTypes.ProductSearchHit) => Record<string, any>)
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

        const scroll = (direction: number) => {
            if (!scrollRef.current) return
            const scrollAmount = scrollRef.current.offsetWidth * 0.8
            scrollRef.current.scrollBy({
                left: direction * scrollAmount,
                behavior: 'smooth'
            })
        }

        return (
            <Box position="relative" {...props} ref={ref}>
                {/* Header */}
                <Stack direction="row" align="center" justify="space-between" mb={6}>
                    {header || (
                        <Heading as="h2" size="lg" fontWeight="bold">
                            {title}
                        </Heading>
                    )}
                </Stack>

                {/* Product List */}
                <Box
                    ref={scrollRef}
                    overflowX="auto"
                    css={{
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                            display: 'none'
                        }
                    }}
                    {...scrollProps}
                >
                    <Stack
                        direction="row"
                        gap={4}
                        align="stretch"
                        minWidth="fit-content"
                        pb={2}
                    >
                        {isLoading
                            ? // Loading skeletons
                              Array.from({length: 4}).map((_, index) => (
                                  <Box
                                      key={index}
                                      flex="none"
                                      width={itemWidth}
                                      css={{scrollSnapAlign: 'start'}}
                                  >
                                      <AspectRatio ratio={1}>
                                          <Skeleton borderRadius="md" />
                                      </AspectRatio>
                                      <Skeleton height="20px" mt={3} />
                                      <Skeleton height="20px" mt={2} width="60%" />
                                  </Box>
                              ))
                            : // Actual products
                              products?.map((product) => {
                                  const tileProps =
                                      typeof productTileProps === 'function'
                                          ? productTileProps(product)
                                          : productTileProps
                                  return (
                                      <Box
                                          key={product.productId}
                                          flex="none"
                                          width={itemWidth}
                                          css={{scrollSnapAlign: 'start'}}
                                      >
                                          <ProductTile product={product} {...tileProps} />
                                      </Box>
                                  )
                              })}
                    </Stack>
                </Box>

                {/* Navigation buttons */}
                {!isLoading && products && products.length > 3 && (
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

ProductScroller.displayName = 'ProductScroller'

export default ProductScroller