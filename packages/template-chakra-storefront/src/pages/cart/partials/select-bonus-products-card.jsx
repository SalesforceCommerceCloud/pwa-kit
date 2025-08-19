/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading, Button} from '@chakra-ui/react'

/**
 * Fragment component that renders the "Select Bonus Products" card with promotion callout and selection button
 * @param {Object} props - Component props
 * @param {Object} props.qualifyingProduct - The qualifying product that triggers bonus products
 * @param {Object} props.basket - The current basket data (required when bonusDiscountLineItem is provided)
 * @param {Object} props.productsWithPromotions - Products with promotion data
 * @param {Object} props.remainingBonusProductsData - Data about remaining available bonus products
 * @param {boolean} props.isEligible - Whether the product is eligible for bonus products
 * @param {Function} props.getPromotionCalloutText - Function to get promotion text
 * @param {Function} props.onSelectBonusProducts - Callback when select bonus products button is clicked
 * @param {Object} props.bonusDiscountLineItem - Optional: specific bonus discount line item to use for calculations
 * @returns {JSX.Element} The select bonus products card
 */
const SelectBonusProductsCard = ({
    qualifyingProduct,
    basket,
    productsWithPromotions,
    remainingBonusProductsData,
    isEligible,
    getPromotionCalloutText,
    onSelectBonusProducts,
    bonusDiscountLineItem
}) => {
    // Use bonusDiscountLineItem data if provided, otherwise fall back to existing logic
    let promotionId
    let maxBonusItems
    let selectedItems

    if (bonusDiscountLineItem && basket) {
        // Extract data from the specific bonusDiscountLineItem
        promotionId = bonusDiscountLineItem.promotionId
        maxBonusItems = bonusDiscountLineItem.maxBonusItems || 0

        // Calculate selected items by counting bonus products in cart with matching bonusDiscountLineItemId
        selectedItems =
            basket.productItems
                ?.filter(
                    (cartItem) =>
                        cartItem.bonusProductLineItem &&
                        cartItem.bonusDiscountLineItemId === bonusDiscountLineItem.id
                )
                .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0
    } else {
        // Fallback to existing logic using remainingBonusProductsData
        const firstBonusItem = remainingBonusProductsData.bonusItems[0]
        promotionId = firstBonusItem?.promotionId

        // Get product promotion data
        const productWithPromotions = productsWithPromotions?.[qualifyingProduct.productId]

        // Fallback to product promotions if no bonus discount line items exist yet
        if (!promotionId && isEligible && productWithPromotions?.productPromotions?.length > 0) {
            promotionId = productWithPromotions.productPromotions[0].promotionId
        }

        const {aggregatedMaxBonusItems, aggregatedSelectedItems} = remainingBonusProductsData
        maxBonusItems = aggregatedMaxBonusItems
        selectedItems = aggregatedSelectedItems
    }

    // Get product promotion data
    let productWithPromotions = productsWithPromotions?.[qualifyingProduct.productId]

    // If we don't have promotion data for this product (when using fallback productId),
    // find any product that has promotions matching this promotionId
    if (!productWithPromotions && promotionId && productsWithPromotions) {
        productWithPromotions = Object.values(productsWithPromotions).find((product) =>
            product.productPromotions?.some((promo) => promo.promotionId === promotionId)
        )
    }

    // Calculate remaining available bonus products
    const remainingAvailable = maxBonusItems - selectedItems

    // Don't render if no bonus products are available
    if (remainingAvailable <= 0) {
        return null
    }

    return (
        <Box mt={4} layerStyle="cardBordered" p={4} backgroundColor="white" borderRadius="base">
            {/* Combined Promotion Label */}
            {productWithPromotions &&
                promotionId &&
                (() => {
                    const promoText = getPromotionCalloutText(productWithPromotions, promotionId)

                    // Show selection stats based on available data
                    let selectionText = ''

                    if (maxBonusItems > 0) {
                        // We have actual bonus discount line items with max limits
                        selectionText = ` (${selectedItems} of ${maxBonusItems} selected)`
                    } else if (isEligible && selectedItems === 0) {
                        // Product is eligible but no bonus items selected yet
                        selectionText = ` (0 selected)`
                    }
                    const combinedText = promoText + selectionText

                    return (
                        combinedText && (
                            <Heading fontSize="md" pt="1" mb={3}>
                                {combinedText}
                            </Heading>
                        )
                    )
                })()}

            {/* Select Button */}
            <Button
                variant="outline"
                colorScheme="blue"
                size="md"
                width="full"
                onClick={() => onSelectBonusProducts()}
                data-testid={`select-bonus-products-btn-${qualifyingProduct.productId}`}
            >
                Select Bonus Products
            </Button>
        </Box>
    )
}

SelectBonusProductsCard.propTypes = {
    qualifyingProduct: PropTypes.shape({
        productId: PropTypes.string.isRequired
    }).isRequired,
    basket: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                bonusProductLineItem: PropTypes.bool,
                bonusDiscountLineItemId: PropTypes.string,
                quantity: PropTypes.number
            })
        )
    }),
    productsWithPromotions: PropTypes.object,
    remainingBonusProductsData: PropTypes.shape({
        bonusItems: PropTypes.array,
        aggregatedMaxBonusItems: PropTypes.number,
        aggregatedSelectedItems: PropTypes.number
    }).isRequired,
    isEligible: PropTypes.bool.isRequired,
    getPromotionCalloutText: PropTypes.func.isRequired,
    onSelectBonusProducts: PropTypes.func.isRequired,
    bonusDiscountLineItem: PropTypes.shape({
        id: PropTypes.string.isRequired,
        promotionId: PropTypes.string.isRequired,
        maxBonusItems: PropTypes.number,
        bonusProducts: PropTypes.array
    })
}

export default SelectBonusProductsCard
