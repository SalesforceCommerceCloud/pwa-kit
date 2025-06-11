/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useCallback, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    normalizeSetBundleProduct,
    getUpdateBundleChildArray
} from '@salesforce/retail-react-app/app/utils/product-utils'

// Components
import {Box, Button, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    useProduct,
    useCategory,
    useShopperCustomersMutation,
    useShopperBasketsMutation,
    useCustomerId,
} from '@salesforce/commerce-sdk-react'

// Hooks
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'
import BundleProductView from '@salesforce/retail-react-app/app/components/bundle-product-view'

import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

// constant
import {
    API_ERROR_MESSAGE,
    EINSTEIN_RECOMMENDERS,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST,
    STALE_WHILE_REVALIDATE
} from '@salesforce/retail-react-app/app/constants'
import {rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'
import {useHistory, useLocation, useParams} from 'react-router-dom'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {getAddToCartHandler} from '@salesforce/retail-react-app/app/utils/cart-handlers'
import VariationGroupView from '@salesforce/retail-react-app/app/components/variation-group-view'
import SetProductView from '@salesforce/retail-react-app/app/components/set-product-view'

const ProductDetail = () => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()
    const toast = useToast()
    const navigate = useNavigation()
    const customerId = useCustomerId()

    /****************************** Basket *********************************/
    const {isLoading: isBasketLoading} = useCurrentBasket()
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')
    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }

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
            keepPreviousData: true
        }
    )
    const isProductASet = product?.type.set
    const isProductABundle = product?.type.bundle

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

    /**************** Wishlist ****************/
    const {data: wishlist, isLoading: isWishlistLoading} = useWishList()
    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )

    const handleAddToWishlist = (product, variant, quantity) => {
        const isItemInWishlist = wishlist?.customerProductListItems?.find(
            (i) => i.productId === variant?.productId || i.productId === product?.id
        )

        if (!isItemInWishlist) {
            createCustomerProductListItem.mutate(
                {
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        // NOTE: API does not respect quantity, it always adds 1
                        quantity,
                        productId: variant?.productId || product?.id,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
                },
                {
                    onSuccess: () => {
                        toast({
                            title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                            status: 'success',
                            action: (
                                // it would be better if we could use <Button as={Link}>
                                // but unfortunately the Link component is not compatible
                                // with Chakra Toast, since the ToastManager is rendered via portal
                                // and the toast doesn't have access to intl provider, which is a
                                // requirement of the Link component.
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/account/wishlist')}
                                >
                                    {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                                </Button>
                            )
                        })
                    },
                    onError: () => {
                        showError()
                    }
                }
            )
        } else {
            toast({
                title: formatMessage(TOAST_MESSAGE_ALREADY_IN_WISHLIST),
                status: 'info',
                action: (
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        }
    }

    /**************** Add To Cart ****************/
    const showToast = useToast()
    const showError = () => {
        showToast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    // Use the new handler from the utility
    const handleAddToCart = getAddToCartHandler({
        product,
        updateItemsInBasketMutation,
        einstein,
        showError
    })

    /**************** Einstein ****************/
    useEffect(() => {
        if (product && product.type.set) {
            einstein.sendViewProduct(product)
            dataCloud.sendViewProduct(product)
            const childrenProducts = product.setProducts
            childrenProducts.map((child) => {
                try {
                    einstein.sendViewProduct(child)
                } catch (err) {
                    logger.error('Einstein sendViewProduct error', {
                        namespace: 'ProductDetail.useEffect',
                        additionalProperties: {error: err, child}
                    })
                }
                activeData.sendViewProduct(category, child, 'detail')
                dataCloud.sendViewProduct(child)
            })
        } else if (product) {
            try {
                einstein.sendViewProduct(product)
            } catch (err) {
                logger.error('Einstein sendViewProduct error', {
                    namespace: 'ProductDetail.useEffect',
                    additionalProperties: {error: err, product}
                })
            }
            activeData.sendViewProduct(category, product, 'detail')
            dataCloud.sendViewProduct(product)
        }
    }, [product])


    const renderProductView = () => {
        if (isProductASet) {
            return <SetProductView product={product} 
                einstein={einstein}
                primaryCategory={primaryCategory}
                handleAddToWishlist={handleAddToWishlist}
                isProductLoading={isProductLoading}
                isBasketLoading={isBasketLoading}
                isWishlistLoading={isWishlistLoading}
                updateItemsInBasketMutation={updateItemsInBasketMutation}
                showError={showError}
            /> 
        }
        else if (isProductABundle) {
            return <BundleProductView
                product={product}
                einstein={einstein}
                primaryCategory={primaryCategory}
                handleAddToWishlist={handleAddToWishlist}
                isProductLoading={isProductLoading}
                isBasketLoading={isBasketLoading}
                isWishlistLoading={isWishlistLoading}
                updateItemsInBasketMutation={updateItemsInBasketMutation}
                showError={showError}
            />
        }
        else {
            return <Fragment>
                <VariationGroupView
                    product={product}
                    category={primaryCategory?.parentCategoryTree || []}
                    addToCart={handleAddToCart}
                    addToWishlist={handleAddToWishlist}
                    isProductLoading={isProductLoading}
                    isBasketLoading={isBasketLoading}
                    isWishlistLoading={isWishlistLoading}
                />
                <InformationAccordion product={product} />
            </Fragment>
        }
    }

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Helmet>
                <title>{product?.pageTitle}</title>
                {product?.pageMetaTags?.length > 0 &&
                    product.pageMetaTags.map(({id, value}) => (
                        <meta name={id} content={value} key={id} />
                    ))}
                {/* Fallback for description if not included in pageMetaTags */}
                {!product?.pageMetaTags?.some((tag) => tag.id === 'description') &&
                    product?.pageDescription && (
                        <meta name="description" content={product.pageDescription} />
                    )}
            </Helmet>

            <Stack spacing={16}>
                {renderProductView()}

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    {!isProductASet && (
                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="Complete the Set"
                                    id="product_detail.recommended_products.title.complete_set"
                                />
                            }
                            recommender={EINSTEIN_RECOMMENDERS.PDP_COMPLETE_SET}
                            products={[product]}
                            mx={{base: -4, md: -8, lg: 0}}
                            shouldFetch={() => product?.id}
                        />
                    )}
                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="You might also like"
                                id="product_detail.recommended_products.title.might_also_like"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_MIGHT_ALSO_LIKE}
                        products={[product]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        // The Recently Viewed recommender doesn't use `products`, so instead we
                        // provide a key to update the recommendations on navigation.
                        key={location.key}
                        title={
                            <FormattedMessage
                                defaultMessage="Recently Viewed"
                                id="product_detail.recommended_products.title.recently_viewed"
                            />
                        }
                        recommender={EINSTEIN_RECOMMENDERS.PDP_RECENTLY_VIEWED}
                        mx={{base: -4, md: -8, lg: 0}}
                    />
                </Stack>
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

ProductDetail.propTypes = {
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail
