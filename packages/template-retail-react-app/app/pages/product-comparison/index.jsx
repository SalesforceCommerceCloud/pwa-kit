/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
import {useHistory} from 'react-router-dom'
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    AspectRatio,
    IconButton,
    Badge,
    Divider,
    SimpleGrid,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useComparison, useCurrency} from '@salesforce/retail-react-app/app/hooks'
import Link from '@salesforce/retail-react-app/app/components/link'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import CompareButton from '@salesforce/retail-react-app/app/components/compare-button'
import {productUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'

// Remove icon
const RemoveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
)

/**
 * ProductComparison page displays a detailed comparison table of selected products
 */
const ProductComparison = () => {
    const intl = useIntl()
    const history = useHistory()
    const {currency} = useCurrency()
    const {comparedProducts, removeFromComparison, clearComparison} = useComparison()
    
    // Use responsive design for mobile/desktop layouts
    const isMobile = useBreakpointValue({base: true, md: false})

    // Redirect to home if no products to compare
    useEffect(() => {
        if (comparedProducts.length === 0) {
            history.push('/')
        }
    }, [comparedProducts.length, history])

    if (comparedProducts.length === 0) {
        return null // Will redirect
    }

    // Extract common attributes for comparison
    const getComparisonAttributes = () => {
        const attributes = new Set()
        
        comparedProducts.forEach(product => {
            // Add basic attributes
            attributes.add('price')
            attributes.add('description')
            
            // Add variation attributes if they exist
            product.variationAttributes?.forEach(attr => {
                attributes.add(attr.id)
            })
            
            // Add custom attributes if they exist
            if (product.c_customAttributes) {
                Object.keys(product.c_customAttributes).forEach(key => {
                    attributes.add(key)
                })
            }
        })
        
        return Array.from(attributes)
    }

    const comparisonAttributes = getComparisonAttributes()

    const getAttributeValue = (product, attributeId) => {
        switch (attributeId) {
            case 'price':
                const priceData = getPriceData(product)
                return <DisplayPrice priceData={priceData} currency={currency} />
            
            case 'description':
                return product.shortDescription || product.longDescription || '-'
            
            default:
                // Check variation attributes
                const variationAttr = product.variationAttributes?.find(attr => attr.id === attributeId)
                if (variationAttr) {
                    return variationAttr.values?.map(v => v.name).join(', ') || '-'
                }
                
                // Check custom attributes
                if (product.c_customAttributes?.[attributeId]) {
                    return product.c_customAttributes[attributeId]
                }
                
                return '-'
        }
    }

    const getAttributeLabel = (attributeId) => {
        switch (attributeId) {
            case 'price':
                return intl.formatMessage({
                    id: 'product_comparison.price',
                    defaultMessage: 'Price'
                })
            case 'description':
                return intl.formatMessage({
                    id: 'product_comparison.description',
                    defaultMessage: 'Description'
                })
            default:
                // Try to get a nice label for the attribute
                return attributeId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        }
    }

    // Mobile card layout
    if (isMobile) {
        return (
            <Container maxW="container.xl" py={8}>
                <VStack spacing={6} align="stretch">
                    <Box>
                        <Heading size="lg" mb={2}>
                            {intl.formatMessage({
                                id: 'product_comparison.title',
                                defaultMessage: 'Product Comparison'
                            })}
                        </Heading>
                        <HStack justify="space-between" align="center">
                            <Text color="gray.600">
                                {intl.formatMessage(
                                    {
                                        id: 'product_comparison.products_count',
                                        defaultMessage: 'Comparing {count} products'
                                    },
                                    {count: comparedProducts.length}
                                )}
                            </Text>
                            <Button size="sm" variant="outline" onClick={clearComparison}>
                                {intl.formatMessage({
                                    id: 'product_comparison.clear_all',
                                    defaultMessage: 'Clear All'
                                })}
                            </Button>
                        </HStack>
                    </Box>

                    <SimpleGrid columns={1} spacing={6}>
                        {comparedProducts.map((product, index) => {
                            const localizedProductName = product.name ?? product.productName
                            const productUrl = productUrlBuilder({id: product.productId})
                            const image = product.imageGroups?.[0]?.images?.[0] || product.image

                            return (
                                <Box key={product.productId} borderWidth={1} borderRadius="md" p={4}>
                                    <VStack spacing={4} align="stretch">
                                        <HStack justify="space-between" align="start">
                                            <HStack spacing={3} flex={1}>
                                                <Box width="80px" flexShrink={0}>
                                                    <AspectRatio ratio={1}>
                                                        <DynamicImage
                                                            src={`${
                                                                image?.disBaseLink ||
                                                                image?.link
                                                            }[?sw=80&q=60]`}
                                                            alt={localizedProductName}
                                                            widths={[80]}
                                                        />
                                                    </AspectRatio>
                                                </Box>
                                                <VStack align="start" flex={1} spacing={1}>
                                                    <Link to={productUrl}>
                                                        <Heading size="sm" noOfLines={2}>
                                                            {localizedProductName}
                                                        </Heading>
                                                    </Link>
                                                    <Badge colorScheme="blue">
                                                        #{index + 1}
                                                    </Badge>
                                                </VStack>
                                            </HStack>
                                            <IconButton
                                                aria-label={intl.formatMessage(
                                                    {
                                                        id: 'product_comparison.remove_product',
                                                        defaultMessage: 'Remove {product}'
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

                                        <VStack spacing={3} align="stretch">
                                            {comparisonAttributes.map(attributeId => (
                                                <Box key={attributeId}>
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                                                        {getAttributeLabel(attributeId)}
                                                    </Text>
                                                    <Box>
                                                        {getAttributeValue(product, attributeId)}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </VStack>
                                    </VStack>
                                </Box>
                            )
                        })}
                    </SimpleGrid>
                </VStack>
            </Container>
        )
    }

    // Desktop table layout
    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={6} align="stretch">
                <Box>
                    <Heading size="lg" mb={2}>
                        {intl.formatMessage({
                            id: 'product_comparison.title',
                            defaultMessage: 'Product Comparison'
                        })}
                    </Heading>
                    <HStack justify="space-between" align="center">
                        <Text color="gray.600">
                            {intl.formatMessage(
                                {
                                    id: 'product_comparison.products_count',
                                    defaultMessage: 'Comparing {count} products'
                                },
                                {count: comparedProducts.length}
                            )}
                        </Text>
                        <Button size="sm" variant="outline" onClick={clearComparison}>
                            {intl.formatMessage({
                                id: 'product_comparison.clear_all',
                                defaultMessage: 'Clear All'
                            })}
                        </Button>
                    </HStack>
                </Box>

                <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th width="200px">
                                    {intl.formatMessage({
                                        id: 'product_comparison.attribute',
                                        defaultMessage: 'Attribute'
                                    })}
                                </Th>
                                {comparedProducts.map((product, index) => {
                                    const localizedProductName = product.name ?? product.productName
                                    const productUrl = productUrlBuilder({id: product.productId})
                                    const image = product.imageGroups?.[0]?.images?.[0] || product.image

                                    return (
                                        <Th key={product.productId} minWidth="200px">
                                            <VStack spacing={2} align="center">
                                                <HStack justify="space-between" width="100%">
                                                    <Badge colorScheme="blue">#{index + 1}</Badge>
                                                    <IconButton
                                                        aria-label={intl.formatMessage(
                                                            {
                                                                id: 'product_comparison.remove_product',
                                                                defaultMessage: 'Remove {product}'
                                                            },
                                                            {product: localizedProductName}
                                                        )}
                                                        icon={<RemoveIcon />}
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={() => removeFromComparison(product.productId)}
                                                    />
                                                </HStack>
                                                <Box width="80px">
                                                    <AspectRatio ratio={1}>
                                                        <DynamicImage
                                                            src={`${
                                                                image?.disBaseLink ||
                                                                image?.link
                                                            }[?sw=80&q=60]`}
                                                            alt={localizedProductName}
                                                            widths={[80]}
                                                        />
                                                    </AspectRatio>
                                                </Box>
                                                <Link to={productUrl}>
                                                    <Text fontSize="sm" fontWeight="medium" textAlign="center" noOfLines={2}>
                                                        {localizedProductName}
                                                    </Text>
                                                </Link>
                                            </VStack>
                                        </Th>
                                    )
                                })}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {comparisonAttributes.map(attributeId => (
                                <Tr key={attributeId}>
                                    <Td fontWeight="medium">
                                        {getAttributeLabel(attributeId)}
                                    </Td>
                                    {comparedProducts.map(product => (
                                        <Td key={product.productId}>
                                            {getAttributeValue(product, attributeId)}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>
        </Container>
    )
}

export default ProductComparison
