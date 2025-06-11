import React, {useCallback, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'
import {
    normalizeSetBundleProduct,
} from '@salesforce/retail-react-app/app/utils/product-utils'
import {getAddToCartHandler} from '@salesforce/retail-react-app/app/utils/cart-handlers'
import SetProductHeader from '@salesforce/retail-react-app/app/components/set-product-view/partials/SetProductHeader'
import SetProductChildItem from '@salesforce/retail-react-app/app/components/set-product-view/partials/SetProductChildItem'

const SetProductView = ({
    product,
    einstein,
    primaryCategory,
    handleAddToWishlist,
    isProductLoading,
    isBasketLoading,
    isWishlistLoading,
    updateItemsInBasketMutation,
    showError
}) => {
    const [childProductSelection, setChildProductSelection] = useState({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const childProductRefs = useRef({})

    const comboProduct = normalizeSetBundleProduct(product)
    
    const handleChildAddToCart = (childProduct) => {
        const addToCartHandler = getAddToCartHandler({
            product: childProduct,
            updateItemsInBasketMutation,
            childProductSelection,
            einstein,
            showError
        })
        
        return ({variant, quantity}) => {
            return addToCartHandler({
                variant,
                quantity
            })
        }
    }

    const handleChildProductValidation = useCallback(() => {
        // Run validation for all child products. This will ensure the error
        // messages are shown.
        Object.values(childProductRefs.current).forEach(({validateOrderability}) => {
            validateOrderability({scrollErrorIntoView: false})
        })

        // Using ot state for which child products are selected, scroll to the first
        // one that isn't selected.
        const selectedProductIds = Object.keys(childProductSelection)
        const firstUnselectedProduct = comboProduct.childProducts.find(
            ({product: childProduct}) => !selectedProductIds.includes(childProduct.id)
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
    }, [product, childProductSelection])

    return (
        <>
            <SetProductHeader
                product={product}
                category={primaryCategory?.parentCategoryTree || []}
                addToCart={getAddToCartHandler({
                    product,
                    updateItemsInBasketMutation,
                    childProductSelection,
                    einstein,
                    showError
                })}
                addToWishlist={handleAddToWishlist}
                isProductLoading={isProductLoading}
                isBasketLoading={isBasketLoading}
                isWishlistLoading={isWishlistLoading}
                validateOrderability={handleChildProductValidation}
                childProductOrderability={childProductOrderability}
            />

            <hr />

            {/* Render the child products */}
            {comboProduct.childProducts?.map(
                ({product: childProduct, quantity: childQuantity}) => (
                    <Box key={childProduct.id} data-testid="child-product">
                        <SetProductChildItem
                            ref={(componentRef) => {
                                if (componentRef) {
                                    childProductRefs.current[childProduct.id] = {
                                        ref: componentRef,
                                        validateOrderability: componentRef.validateOrderability || (() => {
                                            return true
                                        })
                                    }
                                } else {
                                    // Clean up ref when component unmounts
                                    delete childProductRefs.current[childProduct.id]
                                }
                            }}
                            product={childProduct}
                            addToCart={handleChildAddToCart(childProduct)}
                            addToWishlist={handleAddToWishlist}
                            onVariantSelected={(product, variant, quantity) => {
                                if (quantity) {
                                    setChildProductSelection((previousState) => ({
                                        ...previousState,
                                        [product.id]: {
                                            product,
                                            variant,
                                            quantity
                                        }
                                    }))
                                } else {
                                    const selections = {...childProductSelection}
                                    delete selections[product.id]
                                    setChildProductSelection(selections)
                                }
                            }}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                            setChildProductOrderability={setChildProductOrderability}
                        />
                        <InformationAccordion product={childProduct} />

                        <Box display={['none', 'none', 'none', 'block']}>
                            <hr />
                        </Box>
                    </Box>
                )
            )}
        </>
    )
}

SetProductView.propTypes = {
    product: PropTypes.object.isRequired,
    primaryCategory: PropTypes.object,
    einstein: PropTypes.object,
    handleAddToWishlist: PropTypes.func.isRequired,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    updateItemsInBasketMutation: PropTypes.object,
    showError: PropTypes.func
}

export default SetProductView 