/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    VStack,
    HStack,
    Box,
    Text,
    Button,
    IconButton,
    AspectRatio,
    Divider,
    Badge
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useComparison} from '@salesforce/retail-react-app/app/hooks'
import Link from '@salesforce/retail-react-app/app/components/link'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {productUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'

// Simple X icon for remove button
const RemoveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
)

/**
 * ComparisonDrawer shows a sliding drawer with products selected for comparison
 */
const ComparisonDrawer = () => {
    const intl = useIntl()
    const {currency} = useCurrency()
    const {
        comparedProducts,
        isDrawerOpen,
        closeDrawer,
        removeFromComparison,
        clearComparison
    } = useComparison()

    return (
        <Drawer
            isOpen={isDrawerOpen}
            placement="right"
            onClose={closeDrawer}
            size="md"
        >
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>
                    <HStack justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="bold">
                            {intl.formatMessage({
                                id: 'comparison_drawer.title',
                                defaultMessage: 'Compare Products'
                            })}
                        </Text>
                        <Badge colorScheme="blue" variant="solid">
                            {comparedProducts.length}
                        </Badge>
                    </HStack>
                </DrawerHeader>

                <DrawerBody>
                    {comparedProducts.length === 0 ? (
                        <VStack spacing={4} align="center" justify="center" height="100%">
                            <Text color="gray.500" textAlign="center">
                                {intl.formatMessage({
                                    id: 'comparison_drawer.empty_state',
                                    defaultMessage: 'No products selected for comparison yet. Add products to compare their features.'
                                })}
                            </Text>
                        </VStack>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {comparedProducts.map((product, index) => {
                                const localizedProductName = product.name ?? product.productName
                                const priceData = getPriceData(product)
                                const productUrl = productUrlBuilder({id: product.productId})
                                
                                // Get the first image
                                const image = product.imageGroups?.[0]?.images?.[0] || product.image

                                return (
                                    <Box key={product.productId}>
                                        <HStack spacing={3} align="start">
                                            <Box flexShrink={0} width="80px">
                                                <AspectRatio ratio={1}>
                                                    <DynamicImage
                                                        src={`${
                                                            image?.disBaseLink ||
                                                            image?.link
                                                        }[?sw=80&q=60]`}
                                                        alt={localizedProductName}
                                                        widths={[80]}
                                                        imageProps={{
                                                            loading: 'lazy'
                                                        }}
                                                    />
                                                </AspectRatio>
                                            </Box>
                                            
                                            <VStack align="start" flex={1} spacing={1}>
                                                <Link to={productUrl}>
                                                    <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                                                        {localizedProductName}
                                                    </Text>
                                                </Link>
                                                <DisplayPrice 
                                                    priceData={priceData} 
                                                    currency={currency}
                                                    size="sm"
                                                />
                                            </VStack>
                                            
                                            <IconButton
                                                aria-label={intl.formatMessage(
                                                    {
                                                        id: 'comparison_drawer.remove_product',
                                                        defaultMessage: 'Remove {product} from comparison'
                                                    },
                                                    {product: localizedProductName}
                                                )}
                                                icon={<RemoveIcon />}
                                                size="sm"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => removeFromComparison(product.productId)}
                                            />
                                        </HStack>
                                        
                                        {index < comparedProducts.length - 1 && <Divider />}
                                    </Box>
                                )
                            })}
                        </VStack>
                    )}
                </DrawerBody>

                {comparedProducts.length > 0 && (
                    <DrawerFooter>
                        <VStack spacing={2} width="100%">
                            <Button
                                as={Link}
                                to="/compare"
                                colorScheme="blue"
                                width="100%"
                                isDisabled={comparedProducts.length < 2}
                                onClick={closeDrawer}
                            >
                                {intl.formatMessage({
                                    id: 'comparison_drawer.compare_button',
                                    defaultMessage: 'Compare Selected Products'
                                })}
                            </Button>
                            <Button
                                variant="outline"
                                width="100%"
                                onClick={clearComparison}
                            >
                                {intl.formatMessage({
                                    id: 'comparison_drawer.clear_all',
                                    defaultMessage: 'Clear All'
                                })}
                            </Button>
                        </VStack>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}

export default ComparisonDrawer
