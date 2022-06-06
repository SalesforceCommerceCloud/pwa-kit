/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import useBasket from 'pwa-kit-commerce/commerce-api/hooks/useBasket'
import {useVariant} from '../hooks/use-variant'
import {useVariationParams} from '../hooks/use-variation-params'
import {useVariationAttributes} from '../hooks/use-variation-attributes'
import useQuantity from '../hooks/use-quantity'

const defaultValues = {
    product: {},
    addVariantToCart: () => {},
    addItemToWishList: () => {}
}

const ProductContext = React.createContext(defaultValues)

export const ProductProvider = ({children, product: initialProduct = {}}) => {
    const [product, setProduct] = React.useState(initialProduct)

    const showLoading = !product

    const {
        stockLevel,
        quantity,
        unfulfillable,
        stepQuantity,
        minOrderQuantity,
        setQuantity
    } = useQuantity(product)
    const variant = useVariant(product)
    const variationParams = useVariationParams(product)
    const variationAttributes = useVariationAttributes(product)

    React.useEffect(() => {
        // update the product after fetching
        setProduct(initialProduct)
    }, [initialProduct.id])

    const isOutOfStock =
        !stockLevel ||
        (!variant && Object.keys(variationParams).length === variationAttributes.length)
    const basket = useBasket()

    // React.useEffect(() => {}, [])
    const addVariantToCart = async (variant, quantity) => {
        try {
            if (!variant?.orderable || !quantity) return
            // The basket accepts an array of `ProductItems`, so lets create a single
            // item array to add to the basket.
            const productItems = [
                {
                    productId: variant.productId,
                    quantity,
                    price: variant.prices
                }
            ]

            await basket.addItemToBasket(productItems)
        } catch (error) {
            console.error('error')
        }
    }
    return (
        <ProductContext.Provider
            value={{
                ...defaultValues,
                product,
                showLoading,
                quantity,
                unfulfillable,
                stepQuantity,
                minOrderQuantity,
                isOutOfStock,
                setQuantity,
                setProduct,
                variant,
                variationParams,
                variationAttributes,
                addVariantToCart
            }}
        >
            {children}
        </ProductContext.Provider>
    )
}

const useProduct = () => {
    const context = React.useContext(ProductContext)

    if (context === undefined) {
        throw new Error('useStore must be used within StoreContext')
    }

    return context
}

export default useProduct
