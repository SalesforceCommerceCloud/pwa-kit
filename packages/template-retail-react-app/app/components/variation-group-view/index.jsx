/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef, useEffect, useMemo, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

// project components
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import VariationGroupViewLayout from '@salesforce/retail-react-app/app/components/variation-group-view/partials/VariationGroupViewLayout'
/**
 * Render a product detail view that includes name, image gallery, price,
 * variant selections, action buttons
 */

const VariationGroupView = forwardRef(
    (
        {
            product,
            category,
            showFullLink = false,
            imageSize = 'md',
            isWishlistLoading = false,
            addToCart,
            updateCart,
            addToWishlist,
            updateWishlist,
            isProductLoading,
            isBasketLoading = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel,
            showImageGallery = true
        },
        ref
    ) => {
        const {currency: activeCurrency} = useCurrency()
        const location = useLocation()
        const {
            isOpen: isAddToCartModalOpen,
            onOpen: onAddToCartModalOpen,
            onClose: onAddToCartModalClose
        } = useAddToCartModalContext()
        const [showOptionsMessage, toggleShowOptionsMessage] = useState(false)
        const {
            showLoading,
            showInventoryMessage,
            inventoryMessage,
            quantity,
            minOrderQuantity,
            setQuantity,
            variant,
            variationParams,
            variationAttributes,
            stockLevel,
            stepQuantity,
            isOutOfStock,
            unfulfillable
        } = useDerivedProduct(product, false, false)
        const priceData = useMemo(() => {
            return getPriceData(product, {quantity})
        }, [product, quantity])
        const canAddToWishlist = !isProductLoading
        const errorContainerRef = useRef(null)
        const disableButton = showInventoryMessage

        const validateAndShowError = (opts = {}) => {
            const {scrollErrorIntoView = true} = opts
            // Validate that all attributes are selected before proceeding.
            const hasValidSelection = validateOrderability(variant, quantity, stockLevel)
            const showError = !hasValidSelection
            const scrollToError = showError && scrollErrorIntoView

            toggleShowOptionsMessage(showError)

            if (scrollToError) {
                errorContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }

            return hasValidSelection
        }

        // Bind the reference with our `scope` that includes the internal validate function for this component.
        // Other values can be added to this scope as required.
        if (typeof ref === 'function') {
            ref = ref.bind({validateOrderability: validateAndShowError})
        }

        useEffect(() => {
            if (isAddToCartModalOpen) {
                onAddToCartModalClose()
            }
        }, [location.pathname])

        useEffect(() => {
            if (
                validateOrderability(variant, quantity, stockLevel)
            ) {
                toggleShowOptionsMessage(false)
            }
        }, [variationParams])

        useEffect(() => {
            if (variant) {
                onVariantSelected(product, variant, quantity)
            }
        }, [variant?.productId, quantity])

        return (
            <VariationGroupViewLayout
                ref={ref}
                product={product}
                category={category}
                showFullLink={showFullLink}
                imageSize={imageSize}
                isWishlistLoading={isWishlistLoading}
                addToCart={addToCart}
                updateCart={updateCart}
                addToWishlist={addToWishlist}
                updateWishlist={updateWishlist}
                isBasketLoading={isBasketLoading}
                showImageGallery={showImageGallery}
                priceData={priceData}
                activeCurrency={activeCurrency}
                showLoading={showLoading}
                showInventoryMessage={showInventoryMessage}
                inventoryMessage={inventoryMessage}
                quantity={quantity}
                minOrderQuantity={minOrderQuantity}
                setQuantity={setQuantity}
                variant={variant}
                variationParams={variationParams}
                variationAttributes={variationAttributes}
                stepQuantity={stepQuantity}
                disableButton={disableButton}
                canAddToWishlist={canAddToWishlist}
                showOptionsMessage={showOptionsMessage}
                errorContainerRef={errorContainerRef}
                onAddToCartModalOpen={onAddToCartModalOpen}
                validateAndShowError={validateAndShowError}
            />
        )
    }
)

VariationGroupView.displayName = 'VariationGroupView'

VariationGroupView.propTypes = {
    product: PropTypes.object,
    isProductPartOfSet: PropTypes.bool,
    isProductPartOfBundle: PropTypes.bool,
    childOfBundleQuantity: PropTypes.number,
    category: PropTypes.array,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateCart: PropTypes.func,
    updateWishlist: PropTypes.func,
    showFullLink: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md']),
    childProductOrderability: PropTypes.object,
    setChildProductOrderability: PropTypes.func,
    onVariantSelected: PropTypes.func,
    validateOrderability: PropTypes.func,
    showImageGallery: PropTypes.bool,
    setSelectedBundleQuantity: PropTypes.func,
    selectedBundleParentQuantity: PropTypes.number
}

export default VariationGroupView
