/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack, Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import SelectBonusProductsCard from '@salesforce/retail-react-app/app/pages/cart/partials/select-bonus-products-card'
import {getBonusProductsForSpecificCartItem} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import {getRemainingAvailableBonusProductsForProduct} from '@salesforce/retail-react-app/app/utils/bonus-product/discovery'
import {shouldShowBonusProductSelection} from '@salesforce/retail-react-app/app/utils/bonus-product/business-logic'

/**
 * Fragment component that renders cart items with bonus products grouped with their qualifying products
 * @param {Object} props - Component props
 * @param {Array} props.nonBonusProducts - Array of non-bonus products
 * @param {Object} props.basket - The current basket data
 * @param {Object} props.productsWithPromotions - Products with promotion data
 * @param {Object} props.ruleBasedQualifyingProductsMap - Map of promotionId to Set of qualifying productIds for rule-based promotions
 * @param {boolean} props.isPromotionDataLoading - Whether promotion data is loading
 * @param {Function} props.renderProductItem - Function to render individual product items
 * @param {Function} props.getPromotionCalloutText - Function to get promotion text
 * @param {Function} props.onSelectBonusProducts - Callback when select bonus products button is clicked
 * @returns {JSX.Element} The grouped cart product list
 */
const CartProductListWithGroupedBonusProducts = ({
    nonBonusProducts,
    basket,
    productsWithPromotions,
    ruleBasedQualifyingProductsMap = {},
    isPromotionDataLoading,
    renderProductItem,
    getPromotionCalloutText,
    onSelectBonusProducts,
    hideBorder = false
}) => {
    // Fallback: if no non-bonus products, render all products in simple layout
    if (!nonBonusProducts || nonBonusProducts.length === 0) {
        return (
            <Stack gap={4}>
                {basket.productItems?.map((productItem, idx) =>
                    renderProductItem(productItem, idx)
                )}
            </Stack>
        )
    }

    return (
        <Stack gap={6}>
            {nonBonusProducts.map((qualifyingProduct, qualifyingIdx) => {
                // Skip bonus product logic if promotion data is not loaded
                if (!productsWithPromotions || isPromotionDataLoading) {
                    return (
                        <Box key={qualifyingProduct.itemId}>
                            {renderProductItem(qualifyingProduct, qualifyingIdx)}
                        </Box>
                    )
                }

                // Check if product should show bonus product selection
                // This will return false for products that are themselves bonus products
                const shouldShowBonusSelection = shouldShowBonusProductSelection(
                    basket,
                    qualifyingProduct.productId,
                    productsWithPromotions,
                    ruleBasedQualifyingProductsMap
                )

                // If not eligible for bonus product selection, render as simple card
                if (!shouldShowBonusSelection) {
                    return (
                        <Box key={qualifyingProduct.itemId}>
                            {renderProductItem(qualifyingProduct, qualifyingIdx)}
                        </Box>
                    )
                }

                // Enhanced rendering for eligible products
                try {
                    // Get bonus products allocated specifically to this cart item
                    const bonusProductsForThisProduct = getBonusProductsForSpecificCartItem(
                        basket,
                        qualifyingProduct,
                        productsWithPromotions,
                        ruleBasedQualifyingProductsMap
                    )
                    const remainingBonusProductsData = getRemainingAvailableBonusProductsForProduct(
                        basket,
                        qualifyingProduct.productId,
                        productsWithPromotions,
                        {},
                        ruleBasedQualifyingProductsMap
                    )

                    const hasBonusProductsInCart = bonusProductsForThisProduct.length > 0
                    const hasRemainingCapacity =
                        remainingBonusProductsData.hasRemainingCapacity ||
                        (shouldShowBonusSelection &&
                            remainingBonusProductsData.aggregatedMaxBonusItems === 0)

                    return (
                        <Box
                            key={qualifyingProduct.itemId}
                            data-testid={`product-group-${qualifyingProduct.productId}`}
                            layerStyle={hideBorder ? 'card' : 'cardBordered'}
                            p={4}
                            backgroundColor="white"
                            {...(hideBorder
                                ? {
                                      border: 'none',
                                      borderWidth: '0px',
                                      borderRadius: 'base'
                                  }
                                : {
                                      borderWidth: '1px',
                                      borderColor: 'gray.200',
                                      borderRadius: 'base'
                                  })}
                        >
                            {/* Main product */}
                            <Box>
                                {renderProductItem(qualifyingProduct, qualifyingIdx, {
                                    hideBorder: true
                                })}
                            </Box>

                            {/* Bonus products already in cart */}
                            {hasBonusProductsInCart && (
                                <Box mt={4}>
                                    <Heading fontSize="md" pt="1" mb={3}>
                                        Bonus Products
                                    </Heading>
                                    <Stack gap={0}>
                                        {bonusProductsForThisProduct.map(
                                            (bonusProduct, bonusIdx) => {
                                                const isLastBonusProduct =
                                                    bonusIdx ===
                                                    bonusProductsForThisProduct.length - 1

                                                return (
                                                    <Box
                                                        key={bonusProduct.itemId}
                                                        data-testid={`bonus-product-${bonusProduct.productId}`}
                                                        border="none"
                                                        borderBottom="none"
                                                        borderTop="none"
                                                        borderLeft="none"
                                                        borderRight="none"
                                                    >
                                                        {renderProductItem(bonusProduct, bonusIdx, {
                                                            showQuantitySelector: false,
                                                            hideBorder: true,
                                                            hideBottomBorder: isLastBonusProduct
                                                        })}
                                                    </Box>
                                                )
                                            }
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            {/* Space between bonus products and SelectBonusProductsCard */}
                            {hasBonusProductsInCart && hasRemainingCapacity && (
                                <Box mt={4} mb={4} />
                            )}

                            {/* Select Bonus Products card */}
                            {hasRemainingCapacity && (
                                <SelectBonusProductsCard
                                    qualifyingProduct={qualifyingProduct}
                                    basket={basket}
                                    productsWithPromotions={productsWithPromotions}
                                    remainingBonusProductsData={remainingBonusProductsData}
                                    isEligible={shouldShowBonusSelection}
                                    getPromotionCalloutText={getPromotionCalloutText}
                                    onSelectBonusProducts={onSelectBonusProducts}
                                />
                            )}
                        </Box>
                    )
                } catch (error) {
                    console.error('Error in enhanced rendering:', error)
                    // Fallback to simple rendering if enhanced fails
                    return (
                        <Box key={qualifyingProduct.itemId}>
                            {renderProductItem(qualifyingProduct, qualifyingIdx)}
                        </Box>
                    )
                }
            })}
        </Stack>
    )
}

CartProductListWithGroupedBonusProducts.propTypes = {
    nonBonusProducts: PropTypes.arrayOf(
        PropTypes.shape({
            itemId: PropTypes.string,
            productId: PropTypes.string
        })
    ).isRequired,
    basket: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                itemId: PropTypes.string,
                productId: PropTypes.string,
                bonusProductLineItem: PropTypes.bool
            })
        )
    }).isRequired,
    productsWithPromotions: PropTypes.object,
    ruleBasedQualifyingProductsMap: PropTypes.object,
    isPromotionDataLoading: PropTypes.bool.isRequired,
    renderProductItem: PropTypes.func.isRequired,
    getPromotionCalloutText: PropTypes.func.isRequired,
    onSelectBonusProducts: PropTypes.func.isRequired,
    hideBorder: PropTypes.bool
}

export default CartProductListWithGroupedBonusProducts
