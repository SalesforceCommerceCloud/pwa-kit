/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useCallback, useEffect, useRef} from 'react'

/**
 * A hook for managing manual bonus product collections.
 *
 * This hook tracks which bonus products were automatically added when a regular product
 * was added to the cart. It creates collections mapping regular products to their
 * associated bonus products.
 *
 * @param {Object} basket - Current basket state
 * @param {boolean} isPending - Whether basket data is loading
 * @param {boolean} isRegistered - Whether user is registered (for clearing collections)
 * @returns {object} An object containing manual bonus product collections and management functions
 */
export const useManualBonusProducts = (basket = null, isPending = false, isRegistered = true) => {
    // State to store collections of manual bonus products
    // Structure: { [regularProductId]: [bonusProduct1, bonusProduct2, ...] }
    const [manualBonusProductCollections, setManualBonusProductCollections] = useState({})

    // Store previous basket state for comparison
    const prevBasketRef = useRef(null)

    /**
     * Trims manual bonus product collection for a qualifying product when its quantity decreases
     * @param {string} qualifyingProductId - The ID of the qualifying product
     * @param {number} quantityReduction - How much the quantity was reduced by
     * @param {number} newQuantity - New quantity of the qualifying product
     */
    const trimManualBonusProductCollection = useCallback(
        (qualifyingProductId, quantityReduction, newQuantity) => {
            setManualBonusProductCollections((prev) => {
                const existingCollection = prev[qualifyingProductId] || []

                if (newQuantity === 0) {
                    // If quantity is now 0, remove the entire collection
                    const updated = {...prev}
                    delete updated[qualifyingProductId]
                    return updated
                }

                if (quantityReduction > 0 && existingCollection.length > 0) {
                    // Calculate how many bonus items to remove based on quantity reduction
                    // This is a simplified approach - you may need more sophisticated logic
                    // based on your business rules for bonus product allocation
                    const itemsToRemove = Math.min(quantityReduction, existingCollection.length)
                    const trimmedCollection = existingCollection.slice(0, -itemsToRemove)

                    return {
                        ...prev,
                        [qualifyingProductId]: trimmedCollection
                    }
                }

                return prev
            })
        },
        []
    )

    /**
     * Creates manual bonus product collections for multiple qualifying products with support for trimming
     * @param {Object} qualifyingProductToBonusProducts - Object mapping qualifying product IDs to their bonus products or trim operations
     */
    const createManualBonusProductCollections = useCallback(
        (qualifyingProductToBonusProducts) => {
            if (
                !qualifyingProductToBonusProducts ||
                Object.keys(qualifyingProductToBonusProducts).length === 0
            ) {
                return
            }

            Object.entries(qualifyingProductToBonusProducts).forEach(
                ([regularProductId, bonusProductsOrTrimOperation]) => {
                    if (bonusProductsOrTrimOperation?.action === 'trim') {
                        // Handle trimming operation
                        const {quantityReduction, newQuantity} = bonusProductsOrTrimOperation
                        trimManualBonusProductCollection(
                            regularProductId,
                            quantityReduction,
                            newQuantity
                        )
                    } else if (
                        Array.isArray(bonusProductsOrTrimOperation) &&
                        bonusProductsOrTrimOperation.length > 0
                    ) {
                        // Handle adding bonus products
                        setManualBonusProductCollections((prev) => ({
                            ...prev,
                            [regularProductId]: [
                                ...(prev[regularProductId] || []),
                                ...bonusProductsOrTrimOperation.map((bonusProduct) => ({
                                    itemId: bonusProduct.itemId,
                                    productId: bonusProduct.productId,
                                    productName: bonusProduct.productName,
                                    quantity: bonusProduct.quantity,
                                    addedAt: new Date().toISOString(),
                                    // Include any price adjustments that show it's a bonus
                                    priceAdjustments: bonusProduct.priceAdjustments?.filter(
                                        (adj) => adj.appliedDiscount?.type === 'bonus'
                                    ),
                                    // Include promotion information for better tracking
                                    promotionId: bonusProduct.promotionId,
                                    // Include bonus discount line item IDs for complete tracking
                                    bonusDiscountLineItemId: bonusProduct.bonusDiscountLineItemId,
                                    bonusDiscountPromotionId: bonusProduct.bonusDiscountPromotionId
                                }))
                            ]
                        }))
                    }
                }
            )
        },
        [trimManualBonusProductCollection]
    )

    /**
     * Creates a manual bonus product collection for a single qualifying product
     * @param {string} regularProductId - The ID of the regular product that triggered the bonus
     * @param {Array} bonusProducts - Array of bonus product items from the basket response
     */
    const createManualBonusProductCollection = useCallback(
        (regularProductId, bonusProducts) => {
            const mappedProducts = {[regularProductId]: bonusProducts}
            createManualBonusProductCollections(mappedProducts)
        },
        [createManualBonusProductCollections]
    )

    /**
     * Gets the manual bonus product collection for a specific regular product
     * @param {string} regularProductId - The ID of the regular product
     * @returns {Array} Array of bonus products associated with the regular product
     */
    const getManualBonusProductCollection = useCallback(
        (regularProductId) => {
            return manualBonusProductCollections[regularProductId] || []
        },
        [manualBonusProductCollections]
    )

    /**
     * Removes a manual bonus product collection for a regular product
     * @param {string} regularProductId - The ID of the regular product
     */
    const removeManualBonusProductCollection = useCallback((regularProductId) => {
        setManualBonusProductCollections((prev) => {
            const updated = {...prev}
            delete updated[regularProductId]
            return updated
        })
    }, [])

    /**
     * Clears all manual bonus product collections
     */
    const clearAllManualBonusProductCollections = useCallback(() => {
        setManualBonusProductCollections({})
    }, [])

    /**
     * Detects qualifying product changes and their associated bonus products by comparing basket states.
     * Handles additions, quantity increases, and quantity decreases of qualifying products.
     * Associates bonus products with specific qualifying products that triggered them.
     *
     * @param {Object} beforeBasket - Basket state before changes
     * @param {Object} afterBasket - Basket state after changes
     * @param {Array} changedQualifyingProducts - Array of {productId, oldQuantity, newQuantity, action}
     * @returns {Object} Object with qualifyingProductChanges and bonusProductChanges
     */
    const detectNewlyAddedBonusProducts = useCallback(
        (beforeBasket = {}, afterBasket = {}, changedQualifyingProducts = []) => {
            const beforeBonusDiscountLineItems = beforeBasket.bonusDiscountLineItems || []
            const afterBonusDiscountLineItems = afterBasket.bonusDiscountLineItems || []
            const afterProductItems = afterBasket.productItems || []

            // Find all new bonus discount line items after adding/changing qualifying products
            const newBonusDiscountLineItems = afterBonusDiscountLineItems.filter(
                (afterBonusDiscount) => {
                    return !beforeBonusDiscountLineItems.some((beforeBonusDiscount) => {
                        // Match by bonusDiscountLineItemId if available, otherwise by promotionId
                        if (
                            afterBonusDiscount.bonusDiscountLineItemId &&
                            beforeBonusDiscount.bonusDiscountLineItemId
                        ) {
                            return (
                                beforeBonusDiscount.bonusDiscountLineItemId ===
                                afterBonusDiscount.bonusDiscountLineItemId
                            )
                        }
                        return beforeBonusDiscount.promotionId === afterBonusDiscount.promotionId
                    })
                }
            )

            // Get all bonus products associated with new bonus discount line items
            const newBonusProducts = []
            newBonusDiscountLineItems.forEach((bonusDiscountLineItem) => {
                const associatedBonusProducts = afterProductItems.filter(
                    (item) =>
                        item.bonusProductLineItem === true &&
                        item.promotionId === bonusDiscountLineItem.promotionId
                )

                newBonusProducts.push(
                    ...associatedBonusProducts.map((product) => ({
                        ...product,
                        bonusDiscountLineItemId: bonusDiscountLineItem.bonusDiscountLineItemId,
                        bonusDiscountPromotionId: bonusDiscountLineItem.promotionId,
                        associatedBonusDiscountLineItem: bonusDiscountLineItem
                    }))
                )
            })

            // Associate new bonus products with qualifying products that triggered them
            const qualifyingProductToBonusProducts = {}
            const qualifyingProductChanges = {}

            changedQualifyingProducts.forEach((change) => {
                const {productId, oldQuantity = 0, newQuantity, action} = change

                qualifyingProductChanges[productId] = {
                    action, // 'added', 'increased', 'decreased'
                    oldQuantity,
                    newQuantity,
                    quantityDelta: newQuantity - oldQuantity
                }

                if (action === 'added' || action === 'increased') {
                    // For added or increased quantities, assign new bonus products
                    qualifyingProductToBonusProducts[productId] = newBonusProducts
                } else if (action === 'decreased') {
                    // For decreased quantities, we need to mark for trimming
                    qualifyingProductToBonusProducts[productId] = {
                        action: 'trim',
                        quantityReduction: oldQuantity - newQuantity,
                        newQuantity
                    }
                }
            })

            return {
                qualifyingProductChanges,
                newBonusProducts,
                qualifyingProductToBonusProducts,
                newBonusDiscountLineItems
            }
        },
        []
    )

    /**
     * Analyzes changes in qualifying products between before and after basket states
     * @param {Object} beforeBasket - Basket state before changes
     * @param {Object} afterBasket - Basket state after changes
     * @param {Array} addedProductIds - IDs of products that were explicitly added
     * @returns {Array} Array of qualifying product changes
     */
    const analyzeQualifyingProductChanges = useCallback(
        (beforeBasket = {}, afterBasket = {}, addedProductIds = []) => {
            const beforeProducts = beforeBasket.productItems || []
            const afterProducts = afterBasket.productItems || []
            const changes = []

            // Handle explicitly added products
            addedProductIds.forEach((productId) => {
                const afterProduct = afterProducts.find(
                    (item) => item.productId === productId && !item.bonusProductLineItem
                )
                if (afterProduct) {
                    changes.push({
                        productId,
                        oldQuantity: 0,
                        newQuantity: afterProduct.quantity,
                        action: 'added'
                    })
                }
            })

            // Handle existing products that may have changed quantities
            beforeProducts.forEach((beforeItem) => {
                if (
                    beforeItem.bonusProductLineItem ||
                    addedProductIds.includes(beforeItem.productId)
                ) {
                    return // Skip bonus products and already processed added products
                }

                const afterItem = afterProducts.find(
                    (item) =>
                        item.productId === beforeItem.productId &&
                        item.itemId === beforeItem.itemId &&
                        !item.bonusProductLineItem
                )

                if (!afterItem) {
                    // Product was removed
                    changes.push({
                        productId: beforeItem.productId,
                        oldQuantity: beforeItem.quantity,
                        newQuantity: 0,
                        action: 'decreased'
                    })
                } else if (afterItem.quantity !== beforeItem.quantity) {
                    // Product quantity changed
                    changes.push({
                        productId: beforeItem.productId,
                        oldQuantity: beforeItem.quantity,
                        newQuantity: afterItem.quantity,
                        action: afterItem.quantity > beforeItem.quantity ? 'increased' : 'decreased'
                    })
                }
            })

            return changes
        },
        []
    )

    // Effect to detect and track bonus products when basket changes
    useEffect(() => {
        if (!basket || isPending) return

        const previousBasket = prevBasketRef.current
        if (!previousBasket) {
            prevBasketRef.current = basket
            return
        }

        // Analyze changes in qualifying products
        const qualifyingProductChanges = analyzeQualifyingProductChanges(
            previousBasket,
            basket,
            [] // addedProductIds - this would come from add-to-cart operations
        )

        if (qualifyingProductChanges.length > 0) {
            // Detect newly added bonus products
            const detectionResult = detectNewlyAddedBonusProducts(
                previousBasket,
                basket,
                qualifyingProductChanges
            )

            // Create/update manual bonus product collections
            if (detectionResult.qualifyingProductToBonusProducts) {
                createManualBonusProductCollections(
                    detectionResult.qualifyingProductToBonusProducts
                )
            }

            console.log('Manual Bonus Products Updated:', {
                qualifyingProductChanges: detectionResult.qualifyingProductChanges,
                newBonusProducts: detectionResult.newBonusProducts,
                collections: manualBonusProductCollections
            })
        }

        // Update previous basket reference
        prevBasketRef.current = basket
    }, [
        basket,
        isPending,
        analyzeQualifyingProductChanges,
        detectNewlyAddedBonusProducts,
        createManualBonusProductCollections,
        manualBonusProductCollections
    ])

    // Clear collections when basket is empty or customer logs out
    useEffect(() => {
        if (!basket?.productItems?.length || !isRegistered) {
            clearAllManualBonusProductCollections()
        }
    }, [basket?.productItems?.length, isRegistered, clearAllManualBonusProductCollections])

    return {
        manualBonusProductCollections,
        createManualBonusProductCollection,
        createManualBonusProductCollections,
        trimManualBonusProductCollection,
        getManualBonusProductCollection,
        removeManualBonusProductCollection,
        clearAllManualBonusProductCollections,
        detectNewlyAddedBonusProducts,
        analyzeQualifyingProductChanges
    }
}
