/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {Box, Text, Button, VStack, Alert, Field, NativeSelect} from '@chakra-ui/react'
import {useCurrentBasket} from '../hooks/use-current-basket'
import {useProduct} from '@salesforce/commerce-sdk-react'

// Import the modal component directly
import BonusProductViewModal from '../components/bonus-product-view-modal'

/**
 * Rebuilt debug page for testing BonusProductViewModal
 */
const BonusProductDebugRebuiltPage = () => {
    const [showMockData, setShowMockData] = useState(false)
    const [useRealData, setUseRealData] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [useRealModalData, setUseRealModalData] = useState(false)
    const [selectedPromotionId, setSelectedPromotionId] = useState('')

    // Hook for real basket data
    const {data: currentBasket, isLoading: isBasketLoading} = useCurrentBasket()

    // Mock data for testing
    const mockProduct = {
        id: 'test-product-123',
        masterId: 'test-product-123',
        name: 'Test Bonus Product',
        price: 29.99,
        currency: 'USD',
        type: {set: false, bundle: false},
        variants: [],
        imageGroups: [],
        variationAttributes: [],
        inventory: {stockLevel: 10, ats: 10},
        shortDescription: 'Test product for bonus modal testing',
        longDescription:
            'This is a mock product used for testing the BonusProductViewModal component.',
        brand: 'Test Brand',
        productPromotions: [
            {
                calloutMsg: 'Special Bonus Promotion - 20% Off',
                promotionId: 'bonus-promo-20-off',
                promotionalPrice: 23.99
            },
            {
                calloutMsg: 'Buy 2 Get 1 Free - Bonus Items',
                promotionId: 'bonus-buy2get1',
                promotionalPrice: 19.99
            },
            {
                calloutMsg: 'Free Shipping on Bonus Products',
                promotionId: 'bonus-free-shipping'
                // No promotionalPrice - should default to 0
            },
            {
                calloutMsg: 'Limited Time: Bonus Product Special',
                promotionId: 'bonus-limited-time',
                promotionalPrice: 15.99
            }
        ]
    }

    const mockBonusDiscountLineItemId = 'bonus-discount-test-123'

    // Real basket data
    const bonusDiscountLineItems = currentBasket?.bonusDiscountLineItems || []
    const firstBonusDiscountLineItem = bonusDiscountLineItems[0]
    const firstBonusDiscountLineItemId = firstBonusDiscountLineItem?.id

    // Extract productId from bonusProducts array (first bonus product)
    const firstBonusProduct = firstBonusDiscountLineItem?.bonusProducts?.[0]
    const bonusProductId = firstBonusProduct?.productId

    // Fetch product details for the bonus product
    const {data: productDetails, isLoading: isProductLoading} = useProduct(
        {
            parameters: {id: bonusProductId}
        },
        {
            enabled: !!bonusProductId
        }
    )

    // Ensure product has required structure for ProductView
    const safeProduct = productDetails
        ? {
              ...productDetails,
              type: productDetails.type || {set: false, bundle: false},
              variants: productDetails.variants || [],
              imageGroups: productDetails.imageGroups || [],
              masterId: productDetails.masterId || productDetails.id,
              variationAttributes: productDetails.variationAttributes || [],
              inventory: productDetails.inventory || {stockLevel: 0},
              price: productDetails.price || 0,
              currency: productDetails.currency || 'USD'
          }
        : null

    // Modal handlers
    const handleOpenModal = (useRealData = false) => {
        if (useRealData && !bonusProductId) {
            alert('No bonus product ID found in the bonus discount line item.')
            return
        }
        if (useRealData && isProductLoading) {
            alert('Bonus product data is still loading. Please wait and try again.')
            return
        }
        if (useRealData && !safeProduct) {
            alert('Failed to load bonus product data. Please check if the product exists.')
            return
        }
        setUseRealModalData(useRealData)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
    }

    return (
        <Box p={8}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
                Bonus Product Debug - Rebuilt Version
            </Text>

            <VStack align="start" spacing={4}>
                <Text color="gray.600">
                    Test the BonusProductViewModal with both real basket data and mock data.
                </Text>

                <VStack align="start" spacing={3}>
                    <Field.Root>
                        <Field.Label fontSize="sm">
                            Test Promotion Filtering (Mock Data)
                        </Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field
                                value={selectedPromotionId}
                                onChange={(e) => setSelectedPromotionId(e.target.value)}
                                placeholder="Select promotion to test (or leave empty for default)"
                                size="sm"
                            >
                                <option value="">
                                    Select promotion to test (or leave empty for default)
                                </option>
                                <option value="bonus-promo-20-off">
                                    Special Bonus Promotion - 20% Off
                                </option>
                                <option value="bonus-buy2get1">
                                    Buy 2 Get 1 Free - Bonus Items
                                </option>
                                <option value="bonus-free-shipping">
                                    Free Shipping on Bonus Products
                                </option>
                                <option value="bonus-limited-time">
                                    Limited Time: Bonus Product Special
                                </option>
                            </NativeSelect.Field>
                        </NativeSelect.Root>
                    </Field.Root>

                    <Button
                        onClick={() => handleOpenModal(false)}
                        colorScheme="blue"
                        size="lg"
                        leftIcon={<Text>🧪</Text>}
                    >
                        Open Modal with Mock Data
                        {selectedPromotionId && (
                            <Text fontSize="xs" ml={2}>
                                ({selectedPromotionId})
                            </Text>
                        )}
                    </Button>

                    <Button
                        onClick={() => setShowMockData(!showMockData)}
                        colorScheme="blue"
                        variant="outline"
                        size="md"
                    >
                        {showMockData ? 'Hide' : 'Show'} Mock Data Details
                    </Button>

                    <Button
                        onClick={() => setUseRealData(!useRealData)}
                        colorScheme={useRealData ? 'green' : 'gray'}
                        variant="outline"
                        size="md"
                    >
                        {useRealData ? '✅ Using Real Basket Data' : 'Use Real Basket Data'}
                    </Button>
                </VStack>

                {useRealData && (
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="green.200"
                        borderRadius="md"
                        bg="green.50"
                    >
                        <Text fontWeight="bold" mb={3} color="green.600">
                            🛒 Real Basket Data
                        </Text>
                        {isBasketLoading ? (
                            <Text fontSize="sm">Loading basket...</Text>
                        ) : !currentBasket ? (
                            <Alert status="warning" size="sm">
                                <Text>No basket found. Add items to cart first.</Text>
                            </Alert>
                        ) : (
                            <VStack align="start" spacing={2} fontSize="sm">
                                <Text>
                                    <strong>Basket ID:</strong> {currentBasket.basketId}
                                </Text>
                                <Text>
                                    <strong>Product Items:</strong>{' '}
                                    {currentBasket.productItems?.length || 0}
                                </Text>
                                <Text>
                                    <strong>Bonus Discount Line Items:</strong>{' '}
                                    {bonusDiscountLineItems.length}
                                </Text>

                                {firstBonusDiscountLineItem && (
                                    <>
                                        <Text>
                                            <strong>Bonus Line Item ID:</strong>{' '}
                                            {firstBonusDiscountLineItemId || 'N/A'}
                                        </Text>
                                        <Text>
                                            <strong>Promotion ID:</strong>{' '}
                                            {firstBonusDiscountLineItem.promotionId || 'N/A'}
                                        </Text>
                                        <Text>
                                            <strong>Max Bonus Items:</strong>{' '}
                                            {firstBonusDiscountLineItem.maxBonusItems || 'N/A'}
                                        </Text>
                                        <Text>
                                            <strong>Available Bonus Products:</strong>{' '}
                                            {firstBonusDiscountLineItem.bonusProducts?.length || 0}
                                        </Text>

                                        {firstBonusProduct && (
                                            <>
                                                <Text>
                                                    <strong>First Bonus Product ID:</strong>{' '}
                                                    {bonusProductId || 'N/A'}
                                                </Text>
                                                <Text>
                                                    <strong>First Bonus Product Name:</strong>{' '}
                                                    {firstBonusProduct.productName || 'N/A'}
                                                </Text>
                                                <Text>
                                                    <strong>First Bonus Product Title:</strong>{' '}
                                                    {firstBonusProduct.title || 'N/A'}
                                                </Text>
                                            </>
                                        )}

                                        {/* Keep debug structure but make it collapsible */}
                                        <Box
                                            p={2}
                                            bg="gray.50"
                                            borderRadius="md"
                                            width="100%"
                                            mt={2}
                                        >
                                            <Text fontWeight="bold" fontSize="xs" mb={1}>
                                                🔍 Full Structure (for debugging):
                                            </Text>
                                            <Text
                                                fontSize="xs"
                                                fontFamily="mono"
                                                whiteSpace="pre-wrap"
                                                maxH="200px"
                                                overflowY="auto"
                                            >
                                                {JSON.stringify(
                                                    firstBonusDiscountLineItem,
                                                    null,
                                                    2
                                                )}
                                            </Text>
                                        </Box>
                                    </>
                                )}
                            </VStack>
                        )}

                        {bonusProductId && (
                            <VStack align="start" spacing={2} mt={3}>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    onClick={() => handleOpenModal(true)}
                                    isDisabled={isProductLoading}
                                    loadingText="Loading Product..."
                                    isLoading={isProductLoading}
                                >
                                    🎯 Open Bonus Product Modal
                                </Button>

                                {isProductLoading && (
                                    <Text fontSize="xs" color="blue.600">
                                        Loading bonus product details...
                                    </Text>
                                )}

                                {!isProductLoading && !safeProduct && (
                                    <Text fontSize="xs" color="red.600">
                                        Failed to load bonus product data
                                    </Text>
                                )}
                            </VStack>
                        )}

                        {bonusDiscountLineItems.length > 0 && !firstBonusProduct && (
                            <Text fontSize="sm" color="orange.600" mt={2}>
                                ⚠️ Bonus discount line items found but no bonusProducts array or
                                it&apos;s empty.
                            </Text>
                        )}

                        {firstBonusProduct && !bonusProductId && (
                            <Text fontSize="sm" color="orange.600" mt={2}>
                                ⚠️ Bonus product found but no productId in the bonus product.
                            </Text>
                        )}
                    </Box>
                )}

                {showMockData && (
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="blue.200"
                        borderRadius="md"
                        bg="blue.50"
                    >
                        <Text fontWeight="bold" mb={3} color="blue.600">
                            🧪 Mock Test Data
                        </Text>
                        <VStack align="start" spacing={1} fontSize="sm">
                            <Text>
                                <strong>Product ID:</strong> {mockProduct.id}
                            </Text>
                            <Text>
                                <strong>Product Name:</strong> {mockProduct.name}
                            </Text>
                            <Text>
                                <strong>Price:</strong> ${mockProduct.price}
                            </Text>
                            <Text>
                                <strong>Bonus Discount Line Item ID:</strong>{' '}
                                {mockBonusDiscountLineItemId}
                            </Text>
                            <Text>
                                <strong>Selected Promotion ID:</strong>{' '}
                                {selectedPromotionId || 'None (default behavior)'}
                            </Text>
                            <Text>
                                <strong>Available Promotions:</strong>{' '}
                                {mockProduct.productPromotions.length}
                            </Text>
                        </VStack>

                        <Box mt={3} p={2} bg="gray.50" borderRadius="md">
                            <Text fontWeight="bold" fontSize="xs" mb={1}>
                                Available Promotions:
                            </Text>
                            <VStack align="start" spacing={1} fontSize="xs">
                                {mockProduct.productPromotions.map((promo, index) => (
                                    <Text key={index} fontFamily="mono">
                                        • <strong>{promo.promotionId}:</strong> {promo.calloutMsg}
                                    </Text>
                                ))}
                            </VStack>
                        </Box>

                        <Text fontSize="sm" color="blue.600" mt={2}>
                            Use the promotion selector and &quot;Open Modal with Mock Data&quot;
                            button above to test different promotions.
                        </Text>
                    </Box>
                )}
            </VStack>

            {/* BonusProductViewModal - direct import */}
            {isModalOpen && (
                <BonusProductViewModal
                    product={useRealModalData ? safeProduct : mockProduct}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    bonusDiscountLineItemId={
                        useRealModalData
                            ? firstBonusDiscountLineItemId
                            : mockBonusDiscountLineItemId
                    }
                    promotionId={
                        useRealModalData
                            ? firstBonusDiscountLineItem?.promotionId
                            : selectedPromotionId
                    }
                />
            )}
        </Box>
    )
}

export default BonusProductDebugRebuiltPage
