// Handles cart-related actions for product detail page

/**
 * Handles adding products to cart and sending data to Einstein.
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
 * Validates all child products in a set or bundle, scrolling to the first unselected product if needed.
 * @param {Object} childProductRefs - Ref object containing child product refs and their validateOrderability methods.
 * @param {Object} comboProduct - The normalized set or bundle product object.
 * @param {Object} childProductSelection - The current selection state for child products.
 * @returns {boolean} True if all required child products are selected, false otherwise.
 */
export const handleChildProductValidation = (childProductRefs, comboProduct, childProductSelection) => {
    // Run validation for all child products. This will ensure the error messages are shown.
    Object.values(childProductRefs.current).forEach(({validateOrderability}) => {
        validateOrderability({scrollErrorIntoView: false})
    })

    // Using state for which child products are selected, scroll to the first one that isn't selected and requires a variant selection.
    const selectedProductIds = Object.keys(childProductSelection)
    const firstUnselectedProduct = comboProduct.childProducts.find(
        ({product: childProduct}) => {
            // Skip validation for standard products (no variations)
            if (childProduct.type?.item) {
                return false
            }
            return !selectedProductIds.includes(childProduct.id)
        }
    )?.product

    if (firstUnselectedProduct) {
        // Get the reference to the product view and scroll to it.
        const {ref} = childProductRefs.current[firstUnselectedProduct.id]

        if (ref.scrollIntoView) {
            ref.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            })
        }

        return false
    }

    return true
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

        const itemsToBeUpdated = getUpdateBundleChildArray(
            currentBundle,
            childProductSelections
        )

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
    return handleAddToCart(productSelectionValues, addItemToNewOrExistingBasket, einstein, showError)
}