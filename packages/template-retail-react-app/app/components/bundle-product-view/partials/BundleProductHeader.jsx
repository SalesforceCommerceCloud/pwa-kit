/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef, useEffect, useMemo, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'

import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

// project components
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import BundleProductHeaderViewLayout from '@salesforce/retail-react-app/app/components/bundle-product-view/partials/BundleProductHeaderView'

/**
 * Render a bundle product header view that includes name, image gallery, price,
 * variant selections, action buttons
 */
const BundleProductHeader = forwardRef(
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
            childProductOrderability,
            isBasketLoading = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel,
            showImageGallery = true,
            setSelectedBundleQuantity = () => {}
        },
        ref
    ) => {
        const {currency: activeCurrency} = useCurrency()
        const intl = useIntl()
        const location = useLocation()
        const {
            isOpen: isAddToCartModalOpen,
            onOpen: onAddToCartModalOpen,
            onClose: onAddToCartModalClose
        } = useAddToCartModalContext()
        const theme = useTheme()
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
            stepQuantity
        } = useDerivedProduct(product, false, false)
        const priceData = useMemo(() => {
            return getPriceData(product, {quantity})
        }, [product, quantity])

        const canAddToWishlist = !isProductLoading

        const {disableButton, customInventoryMessage} = useMemo(() => {
            let shouldDisableButton = showInventoryMessage
            let currentInventoryMsg = ''
            if (!shouldDisableButton && childProductOrderability) {
                // if any of the children are not orderable, it will disable the add to cart button
                const unavailableChildProductKey = Object.keys(childProductOrderability).find(
                    (key) => {
                        return childProductOrderability[key].showInventoryMessage
                    }
                )
                shouldDisableButton = !!unavailableChildProductKey
                if (unavailableChildProductKey) {
                    const unavailableChildProduct =
                        childProductOrderability[unavailableChildProductKey]
                    if (unavailableChildProduct.unfulfillable) {
                        currentInventoryMsg = intl.formatMessage(
                            {
                                defaultMessage: 'Only {stockLevel} left for {productName}!',
                                id: 'use_product.message.inventory_remaining_for_product'
                            },
                            {
                                stockLevel: unavailableChildProduct.stockLevel,
                                productName: unavailableChildProduct.productName
                            }
                        )
                    }
                    if (unavailableChildProduct.isOutOfStock) {
                        currentInventoryMsg = intl.formatMessage(
                            {
                                defaultMessage: 'Out of stock for {productName}',
                                id: 'use_product.message.out_of_stock_for_product'
                            },
                            {productName: unavailableChildProduct.productName}
                        )
                    }
                }
            }
            return {disableButton: shouldDisableButton, customInventoryMessage: currentInventoryMsg}
        }, [showInventoryMessage, childProductOrderability])

        // Bind the reference with our `scope` that includes the internal validate function for this component.
        // Other values can be added to this scope as required.
        if (typeof ref === 'function') {
            ref = ref.bind({validateOrderability: validateOrderability})
        }

        useEffect(() => {
            if (isAddToCartModalOpen) {
                onAddToCartModalClose()
            }
        }, [location.pathname])

        useEffect(() => {
            if (variant) {
                onVariantSelected(product, variant, quantity)
            }
        }, [variant?.productId, quantity])

        const validateAndShowError = () => {
            // Validate that all attributes are selected before proceeding.
            const hasValidSelection = validateOrderability()
            return hasValidSelection
        }

        return (
            <BundleProductHeaderViewLayout
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
                setSelectedBundleQuantity={setSelectedBundleQuantity}
                priceData={priceData}
                activeCurrency={activeCurrency}
                intl={intl}
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
                customInventoryMessage={customInventoryMessage}
                onAddToCartModalOpen={onAddToCartModalOpen}
                theme={theme}
                validateAndShowError={validateAndShowError}
            />
        )
    }
)

BundleProductHeader.displayName = 'BundleProductHeader'

BundleProductHeader.propTypes = {
    product: PropTypes.object,
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
    onVariantSelected: PropTypes.func,
    validateOrderability: PropTypes.func,
    showImageGallery: PropTypes.bool,
    setSelectedBundleQuantity: PropTypes.func
}

export default BundleProductHeader
