/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Handles adding products to cart and sending data to Einstein.
 * Refactoring and BOPIS support to be handled in W-18989389
 * @param {Array} productSelectionValues
 * @param {Function} addItemToNewOrExistingBasket
 * @param {Object} einstein
 * @param {Function} showError
 * @returns {Promise<Array>|undefined}
 */
export const handleAddToCart = async (
    productSelectionValues,
    addItemToNewOrExistingBasket,
    einstein,
    showError
) => {
    try {
        const productItems = productSelectionValues.map(({variant, product, quantity}) => ({
            productId: variant?.productId || product?.id,
            price: variant?.price || product?.price,
            quantity
        }))

        await addItemToNewOrExistingBasket(productItems)

        const productItemsForEinstein = productSelectionValues.map(
            ({product, variant, quantity}) => ({
                product,
                productId: variant?.productId || product?.id,
                price: variant?.price || product?.price,
                quantity
            })
        )
        einstein.sendAddToCart(productItemsForEinstein)

        // If the items were successfully added, set the return value to be used
        // by the add to cart modal.
        return productSelectionValues
    } catch (error) {
        console.log('error', error)
        showError(error)
    }
}

/**
 * Handles adding a product bundle to the cart, including updating child variant selections if needed.
 * @param {Object} product - The parent product (bundle).
 * @param {Object} childProductSelection - Object containing selected child products.
 * @param {number} selectedQuantity - Quantity of the bundle to add.
 * @param {Function} addItemToNewOrExistingBasket - Function to add items to the basket.
 * @param {Object} updateItemsInBasketMutation - Mutation object for updating items in the basket.
 * @param {Object} einstein - Einstein tracking object.
 * @param {Function} showError - Function to show errors.
 * @param {Function} getUpdateBundleChildArray - Utility to get update array for bundle children.
 * @returns {Promise<Array>|undefined}
 */
export const handleProductBundleAddToCart = async (
    product,
    childProductSelection,
    selectedQuantity,
    addItemToNewOrExistingBasket,
    updateItemsInBasketMutation,
    einstein,
    showError,
    getUpdateBundleChildArray
) => {
    try {
        const childProductSelections = Object.values(childProductSelection)

        const productItems = [
            {
                productId: product.id,
                price: product.price,
                quantity: selectedQuantity,
                // The add item endpoint in the shopper baskets API does not respect variant selections
                // for bundle children, so we have to make a follow up call to update the basket
                // with the chosen variant selections
                bundledProductItems: childProductSelections.map((child) => {
                    return {
                        productId: child.variant?.productId || child.product?.id,
                        quantity: child.quantity
                    }
                })
            }
        ]

        const res = await addItemToNewOrExistingBasket(productItems)

        const bundleChildMasterIds = childProductSelections.map((child) => {
            return child.product.id
        })

        // since the returned data includes all products in basket
        // here we compare list of productIds in bundleProductItems of each productItem to filter out the
        // current bundle that was last added into cart
        const currentBundle = res.productItems.find((productItem) => {
            if (!productItem.bundledProductItems?.length) return
            const bundleChildIds = productItem.bundledProductItems?.map((item) => {
                // seek out the bundle child that still uses masterId as product id
                return item.productId
            })
            return bundleChildIds.every((id) => bundleChildMasterIds.includes(id))
        })

        const itemsToBeUpdated = getUpdateBundleChildArray(currentBundle, childProductSelections)

        if (itemsToBeUpdated.length) {
            // make a follow up call to update child variant selection for product bundle
            // since add item endpoint doesn't currently consider product bundle child variants
            await updateItemsInBasketMutation.mutateAsync({
                method: 'PATCH',
                parameters: {
                    basketId: res.basketId
                },
                body: itemsToBeUpdated
            })
        }

        einstein.sendAddToCart(productItems)

        return childProductSelections
    } catch (error) {
        showError(error)
    }
}

/**
 * Handles adding a product set to the cart.
 * @param {Object} childProductSelection - Object containing selected child products.
 * @param {Function} addItemToNewOrExistingBasket - Function to add items to the basket.
 * @param {Object} einstein - Einstein tracking object.
 * @param {Function} showError - Function to show errors.
 * @returns {Promise<Array>|undefined}
 */
export const handleProductSetAddToCart = (
    childProductSelection,
    addItemToNewOrExistingBasket,
    einstein,
    showError
) => {
    // Get all the selected products, and pass them to the addToCart handler which accepts an array.
    const productSelectionValues = Object.values(childProductSelection)
    return handleAddToCart(
        productSelectionValues,
        addItemToNewOrExistingBasket,
        einstein,
        showError
    )
}
