/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useState} from 'react'
import {keepPreviousData} from '@tanstack/react-query'
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'

import {
    useProduct,
    useProducts,
    useCategory,
    useShopperBasketsMutation,
    useShopperBasketsMutationHelper
} from '@salesforce/commerce-sdk-react'
import {useHistory, useLocation, useParams} from 'react-router-dom'

import {useCurrentBasket, useVariant} from '../../../hooks'
import {useEinstein} from '../../../hooks/use-einstein'

//@sfdc-extension-line SFDC_EXT_WISHLIST
import {useWishList} from '../../../hooks/use-wish-list'

import {normalizeSetBundleProduct, getUpdateBundleChildArray} from '../../../utils/product-utils'
import {useErrorHandler} from '../../../hooks/use-errors'

import {rebuildPathWithParams} from '../../../utils/url'

export const useProductDetailData = () => {
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const showError = useErrorHandler()
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    const {addToWishlist, isPending: isWishlistLoading} = useWishList()

    /****************************** Basket *********************************/
    const {isLoading: isBasketLoading} = useCurrentBasket()
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')

    /*************************** Product Detail and Category ********************/
    const {productId} = useParams()
    const urlParams = new URLSearchParams(location.search)
    const {
        data: product,
        isLoading: isProductLoading,
        isError: isProductError,
        error: productError
    } = useProduct(
        {
            parameters: {
                id: urlParams.get('pid') || productId,
                perPricebook: true,
                expand: [
                    'availability',
                    'promotions',
                    'options',
                    'images',
                    'prices',
                    'variations',
                    'set_products',
                    'bundled_products',
                    'page_meta_tags'
                ],
                allImages: true
            }
        },
        {
            // When shoppers select a different variant (and the app fetches the new data),
            // the old data is still rendered (and not the skeletons).
            placeholderData: keepPreviousData
        }
    )

    // Note: Since category needs id from product detail, it can't be server side rendered atm
    // until we can do dependent query on server
    const {
        data: category,
        isError: isCategoryError,
        error: categoryError
    } = useCategory({
        parameters: {
            id: product?.primaryCategoryId,
            levels: 1
        }
    })

    /****************************** Sets and Bundles *********************************/
    const [childProductSelection, setChildProductSelection] = useState({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedBundleQuantity, setSelectedBundleQuantity] = useState(1)
    const childProductRefs = React.useRef({})
    const isProductASet = product?.type.set
    const isProductABundle = product?.type.bundle

    let bundleChildVariantIds = ''
    if (isProductABundle)
        bundleChildVariantIds = Object.keys(childProductSelection)
            ?.map((key) => childProductSelection[key].variant.productId)
            .join(',')

    const {data: bundleChildrenData} = useProducts(
        {
            parameters: {
                ids: bundleChildVariantIds,
                allImages: false,
                expand: ['availability', 'variations'],
                select: '(data.(id,inventory,master))'
            }
        },
        {
            enabled: bundleChildVariantIds?.length > 0,
            placeholderData: keepPreviousData
        }
    )

    if (isProductABundle && bundleChildrenData) {
        // Loop through the bundle children and update the inventory for variant selection
        product.bundledProducts.forEach(({product: childProduct}, index) => {
            const matchingChildProduct = bundleChildrenData.data.find(
                (bundleChild) => bundleChild.master.masterId === childProduct.id
            )
            if (matchingChildProduct) {
                product.bundledProducts[index].product = {
                    ...childProduct,
                    inventory: matchingChildProduct.inventory
                }
            }
        })
    }

    const comboProduct = isProductASet || isProductABundle ? normalizeSetBundleProduct(product) : {}

    /**************** Error Handling ****************/

    if (isProductError) {
        const errorStatus = productError?.response?.status
        switch (errorStatus) {
            case 404:
                throw new HTTPNotFound('Product Not Found.')
            default:
                throw new HTTPError(errorStatus, `HTTP Error ${errorStatus} occurred.`)
        }
    }
    if (isCategoryError) {
        const errorStatus = categoryError?.response?.status
        switch (errorStatus) {
            case 404:
                throw new HTTPNotFound('Category Not Found.')
            default:
                throw new HTTPError(errorStatus, `HTTP Error ${errorStatus} occurred.`)
        }
    }

    const [primaryCategory, setPrimaryCategory] = useState(category)
    const variant = useVariant(product)
    // This page uses the `primaryCategoryId` to retrieve the category data. This attribute
    // is only available on `master` products. Since a variation will be loaded once all the
    // attributes are selected (to get the correct inventory values), the category information
    // is overridden. This will allow us to keep the initial category around until a different
    // master product is loaded.
    useEffect(() => {
        if (category) {
            setPrimaryCategory(category)
        }
    }, [category])

    /**************** Product Variant ****************/
    useEffect(() => {
        if (!variant) {
            return
        }
        // update the variation attributes parameter on
        // the url accordingly as the variant changes
        const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
            pid: variant?.productId
        })
        history.replace(updatedUrl)
    }, [variant])

    /**************** Add To Cart ****************/

    const handleAddToCart = async (productSelectionValues) => {
        try {
            const productItems = productSelectionValues.map(({variant, quantity}) => ({
                productId: variant.productId,
                price: variant.price,
                quantity
            }))

            await addItemToNewOrExistingBasket(productItems)

            einstein.sendAddToCart(productItems)

            // If the items were successfully added, set the return value to be used
            // by the add to cart modal.
            return productSelectionValues
        } catch (error) {
            console.log('error', error)
            showError(error)
        }
    }

    /**************** Product Set/Bundles Handlers ****************/
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

    /**************** Product Set Handlers ****************/
    const handleProductSetAddToCart = () => {
        // Get all the selected products, and pass them to the addToCart handler which
        // accepts an array.
        const productSelectionValues = Object.values(childProductSelection)
        return handleAddToCart(productSelectionValues)
    }

    /**************** Product Bundle Handlers ****************/
    // Top level bundle does not have variants
    const handleProductBundleAddToCart = async (variant, selectedQuantity) => {
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
                            productId: child.variant.productId,
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

    return {
        product,
        isProductLoading,
        primaryCategory,
        isProductASet,
        isProductABundle,
        comboProduct,
        childProductRefs,
        childProductSelection,
        setChildProductSelection,
        childProductOrderability,
        setChildProductOrderability,
        selectedBundleQuantity,
        setSelectedBundleQuantity,
        handleAddToCart,
        //@sfdc-extension-line SFDC_EXT_WISHLIST
        handleAddToWishlist: addToWishlist,
        handleProductSetAddToCart,
        handleProductBundleAddToCart,
        handleChildProductValidation,
        isBasketLoading,
        //@sfdc-extension-line SFDC_EXT_WISHLIST
        isWishlistLoading
    }
}
