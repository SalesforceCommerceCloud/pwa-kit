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
import BundleProductChildItemView from '@salesforce/retail-react-app/app/components/bundle-product-view/partials/BundleProductChildItemView'
/**
 * Render a bundle product child item view that includes name, image gallery, price,
 * variant selections, action buttons
 */

const BundleProductChildItem = forwardRef(
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
            isProductPartOfBundle = false,
            childOfBundleQuantity = 0,
            childProductOrderability,
            setChildProductOrderability,
            isBasketLoading = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel,
            showImageGallery = true,
            setSelectedBundleQuantity = () => {},
            selectedBundleParentQuantity = 1
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
        } = useDerivedProduct(product, false, true)
        const priceData = useMemo(() => {
            return getPriceData(product, {quantity})
        }, [product, quantity])
        const canAddToWishlist = !isProductLoading
        const errorContainerRef = useRef(null)

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

        // Set the quantity of bundle child in a product bundle to ensure availability messages appear
        if (
            quantity != selectedBundleParentQuantity * childOfBundleQuantity
        ) {
            setQuantity(selectedBundleParentQuantity * childOfBundleQuantity)
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

        useEffect(() => {
            const key = product.itemId ?? product.id
            // when showInventoryMessage is true, it means child product is not orderable
            setChildProductOrderability((previousState) => ({
                ...previousState,
                [key]: {
                    showInventoryMessage,
                    isOutOfStock,
                    unfulfillable,
                    stockLevel,
                    productName: product?.name
                }
            }))
        }, [showInventoryMessage, inventoryMessage])

        return (
            <BundleProductChildItemView
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
                isProductLoading={isProductLoading}
                isProductPartOfBundle={isProductPartOfBundle}
                childOfBundleQuantity={childOfBundleQuantity}
                childProductOrderability={childProductOrderability}
                setChildProductOrderability={setChildProductOrderability}
                isBasketLoading={isBasketLoading}
                onVariantSelected={onVariantSelected}
                validateOrderability={validateOrderability}
                showImageGallery={showImageGallery}
                setSelectedBundleQuantity={setSelectedBundleQuantity}
                selectedBundleParentQuantity={selectedBundleParentQuantity}
                priceData={priceData}
                activeCurrency={activeCurrency}
                showLoading={showLoading}
                showInventoryMessage={showInventoryMessage}
                inventoryMessage={inventoryMessage}
                validateAndShowError={validateAndShowError}
                quantity={quantity}
                minOrderQuantity={minOrderQuantity}
                setQuantity={setQuantity}
                variant={variant}
                variationParams={variationParams}
                variationAttributes={variationAttributes}
                stockLevel={stockLevel}
                stepQuantity={stepQuantity}
                isOutOfStock={isOutOfStock}
                unfulfillable={unfulfillable}
                canAddToWishlist={canAddToWishlist}
                showOptionsMessage={showOptionsMessage}
                errorContainerRef={errorContainerRef}
                onAddToCartModalOpen={onAddToCartModalOpen}
            />
        )
    }
)

BundleProductChildItem.displayName = 'BundleProductChildItem'

BundleProductChildItem.propTypes = {
    product: PropTypes.object,
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

export default BundleProductChildItem
