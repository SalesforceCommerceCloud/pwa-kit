/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Enhanced bonus product utilities that fetch product promotion data from the products endpoint.
 * All functions now require product promotion data to ensure accuracy and currency.
 */

//==============================================================================
// CORE UTILITY FUNCTIONS
//==============================================================================

/**
 * Gets the qualifying product ID(s) for a bonus product from the bonusDiscountLineItems collection.
 * This function matches bonus discount line items with qualifying products in the cart
 * using the promotionId field.
 * 
 * @param {Object} basket - The current basket/cart object
 * @param {string} bonusDiscountLineItemId - The ID of the bonus discount line item to find qualifying products for
 * @returns {Array<string>} - Array of qualifying product IDs that triggered this bonus item
 */
export const getQualifyingProductIdForBonusItem = (basket, bonusDiscountLineItemId) => {
    if (!basket?.bonusDiscountLineItems || !basket?.productItems || !bonusDiscountLineItemId) {
        return []
    }

    // Find the specific bonus discount line item
    const bonusDiscountLineItem = basket.bonusDiscountLineItems.find(
        item => item.id === bonusDiscountLineItemId
    )

    if (!bonusDiscountLineItem) {
        return []
    }

    const promotionId = bonusDiscountLineItem.promotionId

    // Find all products that have this promotion ID in their price adjustments
    const qualifyingProductIds = []
    basket.productItems.forEach(product => {
        if (product.priceAdjustments) {
            const hasMatchingPromotion = product.priceAdjustments.some(
                adjustment => adjustment.promotionId === promotionId
            )
            if (hasMatchingPromotion) {
                qualifyingProductIds.push(product.productId)
            }
        }
    })

    return qualifyingProductIds
}

/**
 * Gets promotion IDs for a product from enhanced product promotion data.
 * 
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find promotion IDs for
 * @param {Object} productsWithPromotions - Products data fetched with promotion info
 * @returns {Array<string>} Array of promotion IDs for the product
 */
export const getPromotionIdsForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }
    
    // Get promotion IDs from the enhanced product data (using productPromotions)
    const productWithPromotions = productsWithPromotions[productId]
    if (productWithPromotions?.productPromotions) {
        const promotionIds = productWithPromotions.productPromotions
            .map(promotion => promotion.promotionId)
            .filter(id => id != null)
        
        return promotionIds
    }
    
    // If no enhanced product data is available, return empty array
    return []
}

/**
 * Gets all available bonus discount line items that are triggered by a specific product.
 * 
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find available bonus items for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<Object>} Array of available bonus discount line items
 */
export const getAvailableBonusItemsForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }
    
    // Get promotion IDs using enhanced product data
    const productPromotionIds = getPromotionIdsForProduct(basket, productId, productsWithPromotions)
    
    if (productPromotionIds.length === 0) {
        return []
    }
    
    // Find bonus discount line items that match the promotion IDs
    const matchingDiscountItems = basket.bonusDiscountLineItems?.filter(bonusItem => {
        return productPromotionIds.includes(bonusItem.promotionId)
    }) || []
    
    // Flatten the bonus products from all matching discount line items
    const availableBonusItems = []
    matchingDiscountItems.forEach(discountItem => {
        discountItem.bonusProducts?.forEach(bonusProduct => {
            availableBonusItems.push({
                ...bonusProduct,
                promotionId: discountItem.promotionId,
                discountLineItemId: discountItem.id
            })
        })
    })
    
    return availableBonusItems
}

/**
 * Gets all bonus products that are already in the cart for a specific product.
 * 
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find bonus products for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<Object>} Array of bonus products in cart for the qualifying product
 */
export const getBonusProductsInCartForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return []
    }
    
    // Get promotion IDs for the qualifying product using enhanced data
    const qualifyingPromotionIds = getPromotionIdsForProduct(basket, productId, productsWithPromotions)
    
    if (qualifyingPromotionIds.length === 0) {
        return []
    }
    
    // Find bonus products in cart that match the promotion IDs
    const bonusProductsInCart = basket.productItems?.filter(item => {
        if (!item.bonusProductLineItem) {
            return false
        }
        
        // Get promotion IDs for this bonus product
        const bonusPromotionIds = getPromotionIdsForProduct(basket, item.productId, productsWithPromotions)
        
        // Check if any promotion IDs match
        return bonusPromotionIds.some(promotionId => 
            qualifyingPromotionIds.includes(promotionId)
        )
    }) || []
    
    return bonusProductsInCart
}

/**
 * Gets the qualifying product ID(s) for a bonus product that's already in the cart.
 * 
 * @param {Object} basket - The current basket data
 * @param {string} bonusProductId - The product ID of the bonus product in the cart
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Array<string>} Array of qualifying product IDs that triggered this bonus product
 */
export const getQualifyingProductForBonusProductInCart = (basket, bonusProductId, productsWithPromotions) => {
    // Validate inputs
    if (!basket?.productItems || !bonusProductId || !productsWithPromotions) {
        return []
    }

    // Find the bonus product in the cart
    const bonusProduct = basket.productItems.find(
        item => item.productId === bonusProductId && item.bonusProductLineItem === true
    )

    if (!bonusProduct) {
        return []
    }

    // Get promotion IDs from the bonus product using enhanced data
    const bonusPromotionIds = getPromotionIdsForProduct(basket, bonusProductId, productsWithPromotions)
    
    if (bonusPromotionIds.length === 0) {
        return []
    }

    // Find regular products (not bonus products) that have matching promotion IDs
    const qualifyingProducts = basket.productItems.filter(item => {
        // Skip if this is a bonus product
        if (item.bonusProductLineItem === true) {
            return false
        }

        // Get promotion IDs for this product using enhanced data
        const productPromotionIds = getPromotionIdsForProduct(basket, item.productId, productsWithPromotions)

        return productPromotionIds.some(promotionId => 
            bonusPromotionIds.includes(promotionId)
        )
    })

    return qualifyingProducts.map(product => product.productId)
}

/**
 * Check if a product is eligible for bonus products based on its promotions
 * @param {string} productId - The product ID to check
 * @param {Object} productsWithPromotions - Object mapping productId to product data with promotions
 * @returns {boolean} Whether the product is eligible for bonus products
 */
export const isProductEligibleForBonusProducts = (productId, productsWithPromotions) => {
    if (!productId || !productsWithPromotions) {
        return false
    }
    
    const productWithPromotions = productsWithPromotions[productId]
    if (!productWithPromotions?.productPromotions) {
        return false
    }
    
    // Check if any of the product's promotions exist in the system
    // This indicates the product could potentially trigger bonus products
    return productWithPromotions.productPromotions.length > 0
}

/**
 * Gets the remaining available bonus products for a productId by considering quantities already in cart
 * and the maxBonusItems limits. Only returns bonus items with remainingBonusItemsCount > 0.
 * Also includes aggregated statistics for promotion tracking.
 * 
 * Uses correct logic:
 * - Available items: aggregated maxBonusItems from bonusDiscountLineItems with same promotionId
 * - Selected items: sum of quantities of bonus products in cart matched by bonusDiscountLineItemId
 * 
 * @param {Object} basket - The current basket data
 * @param {string} productId - The product ID to find remaining bonus products for
 * @param {Object} productsWithPromotions - Products data with promotion info
 * @returns {Object} Object containing bonusItems array and aggregated statistics
 */
export const getRemainingAvailableBonusProductsForProduct = (basket, productId, productsWithPromotions) => {
    if (!basket || !productId || !productsWithPromotions) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }
    
    // Get promotion IDs for this product
    const productPromotionIds = getPromotionIdsForProduct(basket, productId, productsWithPromotions)
    
    if (productPromotionIds.length === 0) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }
    
    // Find bonus discount line items that match the promotion IDs
    const matchingDiscountItems = basket.bonusDiscountLineItems?.filter(bonusItem => {
        return productPromotionIds.includes(bonusItem.promotionId)
    }) || []
    
    if (matchingDiscountItems.length === 0) {
        return {
            bonusItems: [],
            aggregatedMaxBonusItems: 0,
            aggregatedSelectedItems: 0,
            hasRemainingCapacity: false
        }
    }
    
    // Group by promotionId and calculate aggregated stats
    const promotionGroups = {}
    
    matchingDiscountItems.forEach(discountItem => {
        const promotionId = discountItem.promotionId
        
        if (!promotionGroups[promotionId]) {
            promotionGroups[promotionId] = {
                promotionId,
                discountItems: [],
                aggregatedMaxBonusItems: 0,
                aggregatedSelectedItems: 0
            }
        }
        
        promotionGroups[promotionId].discountItems.push(discountItem)
        
        // Add maxBonusItems from the discount line item level (not from individual bonus products)
        const discountItemMaxBonusItems = discountItem.maxBonusItems || 0
        promotionGroups[promotionId].aggregatedMaxBonusItems += discountItemMaxBonusItems
        
        // Sum quantities of bonus products in cart that match this bonusDiscountLineItemId
        const selectedItemsForDiscount = basket.productItems?.filter(cartItem => 
            cartItem.bonusProductLineItem && 
            cartItem.bonusDiscountLineItemId === discountItem.id
        ) || []
        
        const selectedQuantity = selectedItemsForDiscount.reduce((total, cartItem) => 
            total + (cartItem.quantity || 0), 0
        )
        
        promotionGroups[promotionId].aggregatedSelectedItems += selectedQuantity
    })
    
    // Calculate overall aggregated totals across all promotions
    let overallAggregatedMaxBonusItems = 0
    let overallAggregatedSelectedItems = 0
    
    Object.values(promotionGroups).forEach(group => {
        overallAggregatedMaxBonusItems += group.aggregatedMaxBonusItems
        overallAggregatedSelectedItems += group.aggregatedSelectedItems
    })
    
    // Create remaining bonus items for display (flattened from all discount items)
    const remainingBonusItems = []
    
    matchingDiscountItems.forEach(discountItem => {
        const discountItemMaxBonusItems = discountItem.maxBonusItems || 0
        
        // Calculate how many bonus products from this discount item are already in cart
        const selectedQuantityForDiscountItem = basket.productItems?.filter(cartItem => 
            cartItem.bonusProductLineItem && 
            cartItem.bonusDiscountLineItemId === discountItem.id
        ).reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0
        
        const remainingBonusItemsCount = Math.max(0, discountItemMaxBonusItems - selectedQuantityForDiscountItem)
        
        // If there are remaining slots, add all bonus products from this discount item
        if (remainingBonusItemsCount > 0) {
            discountItem.bonusProducts?.forEach(bonusProduct => {
                remainingBonusItems.push({
                    ...bonusProduct,
                    promotionId: discountItem.promotionId,
                    bonusDiscountLineItemId: discountItem.id,
                    remainingBonusItemsCount: remainingBonusItemsCount  // All products share the same remaining count for this discount item
                })
            })
        }
    })
    
    return {
        bonusItems: remainingBonusItems,
        aggregatedMaxBonusItems: overallAggregatedMaxBonusItems,
        aggregatedSelectedItems: overallAggregatedSelectedItems,
        hasRemainingCapacity: overallAggregatedSelectedItems < overallAggregatedMaxBonusItems
    }
}

/**
 * Finds the first available bonus discount line item ID that has capacity for the given quantity.
 * When multiple bonusDiscountLineItems exist with the same promotionId, this function finds
 * the first one that hasn't reached its maxBonusItems limit.
 * 
 * @param {Object} basket - The current basket data
 * @param {string} promotionId - The promotion ID to match
 * @param {number} quantity - The quantity to be added
 * @param {string} fallbackId - Fallback bonusDiscountLineItemId if none are available
 * @returns {string} The ID of the first available bonus discount line item
 */
export const findAvailableBonusDiscountLineItemId = (basket, promotionId, quantity = 1, fallbackId = null) => {
    if (!basket?.bonusDiscountLineItems || !promotionId) {
        return fallbackId
    }

    // Find all bonus discount line items with the same promotionId
    const matchingDiscountItems = basket.bonusDiscountLineItems.filter(item => 
        item.promotionId === promotionId
    )

    if (matchingDiscountItems.length === 0) {
        return fallbackId
    }

    // Check each discount item to find one with available capacity
    for (const discountItem of matchingDiscountItems) {
        const maxBonusItems = discountItem.maxBonusItems || 0
        
        // Calculate how many bonus products are already in cart for this specific discount item
        const selectedQuantity = basket.productItems?.filter(cartItem => 
            cartItem.bonusProductLineItem && 
            cartItem.bonusDiscountLineItemId === discountItem.id
        ).reduce((total, cartItem) => total + (cartItem.quantity || 0), 0) || 0
        
        // Check if this discount item has available capacity
        if (selectedQuantity + quantity <= maxBonusItems) {
            return discountItem.id
        }
    }

    // If no available capacity found, return the first matching discount item id as fallback
    return matchingDiscountItems[0]?.id || fallbackId
}

//==============================================================================
// REACT HOOKS FOR PRODUCT PROMOTION FETCHING
//==============================================================================

/**
 * Hook to get promotion IDs for a single product by fetching from the products endpoint.
 * 
 * @param {string} productId - The product ID to fetch promotion data for
 * @returns {Object} Object containing promotion IDs, loading state, and product data
 */
export const useProductPromotionIds = (productId) => {
    // Import useProduct hook from commerce-sdk-react
    const {useProduct} = require('@salesforce/commerce-sdk-react')
    
    const {data: product, isPending} = useProduct(
        {
            parameters: {
                id: productId,
                expand: ['promotions', 'prices'],
                perPricebook: true
            }
        },
        {
            enabled: Boolean(productId)
        }
    )
    
    // Extract promotion IDs from the product promotions data (using productPromotions)
    const promotionIds = product?.productPromotions
        ?.map(promotion => promotion.promotionId)
        .filter(id => id != null) || []
    
    return {
        data: promotionIds,
        isLoading: isPending,
        productData: product,
        hasPromotionData: Boolean(product?.productPromotions && product.productPromotions.length > 0)
    }
}

/**
 * Hook to get multiple products with promotion data for basket items.
 * This fetches all products in the basket with their promotion data in a single request.
 * 
 * @param {Object} basket - The current basket data
 * @returns {Object} Object containing products with promotion data and loading state
 */
export const useBasketProductsWithPromotions = (basket) => {
    // Import useProducts hook from commerce-sdk-react
    const {useProducts} = require('@salesforce/commerce-sdk-react')
    
    // Get all unique product IDs from basket
    const productIds = basket?.productItems?.map(item => item.productId) || []
    const uniqueProductIds = [...new Set(productIds)].join(',')
    
    const {data: productsResult, isPending} = useProducts(
        {
            parameters: {
                ids: uniqueProductIds,
                expand: ['promotions', 'prices'],
                perPricebook: true,
                allImages: false // We don't need images for promotion data
            }
        },
        {
            enabled: Boolean(uniqueProductIds),
            select: (result) => {
                // Convert to object keyed by product ID for easy lookup
                return result?.data?.reduce((acc, product) => {
                    acc[product.id] = product
                    return acc
                }, {}) || {}
            }
        }
    )
    
    return {
        data: productsResult || {},
        isLoading: isPending,
        hasPromotionData: Object.values(productsResult || {}).some(product => 
            product.productPromotions && product.productPromotions.length > 0
        )
    }
}

/**
 * Hook to get available bonus items for a product using enhanced promotion data.
 * 
 * @param {string} productId - The product ID to find available bonus items for
 * @returns {Object} Object containing available bonus items and loading state
 */
export const useAvailableBonusItemsForProduct = (productId) => {
    const {useCurrentBasket} = require('../hooks')
    const {data: basket} = useCurrentBasket()
    const {data: productsWithPromotions, isLoading} = useBasketProductsWithPromotions(basket)
    
    const availableBonusItems = basket && productsWithPromotions ? 
        getAvailableBonusItemsForProduct(basket, productId, productsWithPromotions) : []
    
    return {
        data: availableBonusItems,
        isLoading,
        hasPromotionData: Object.keys(productsWithPromotions || {}).length > 0
    }
}

/**
 * Hook to get remaining available bonus products using enhanced promotion data.
 * 
 * @param {string} productId - The product ID to find remaining bonus products for
 * @returns {Object} Object containing remaining bonus products and loading state
 */
export const useRemainingAvailableBonusProductsForProduct = (productId) => {
    const {useCurrentBasket} = require('../hooks')
    const {data: basket} = useCurrentBasket()
    const {data: productsWithPromotions, isLoading} = useBasketProductsWithPromotions(basket)
    
    const remainingBonusProducts = basket && productsWithPromotions ? 
        getRemainingAvailableBonusProductsForProduct(basket, productId, productsWithPromotions) : []
    
    return {
        data: remainingBonusProducts,
        isLoading,
        hasPromotionData: Object.keys(productsWithPromotions || {}).length > 0
    }
}
