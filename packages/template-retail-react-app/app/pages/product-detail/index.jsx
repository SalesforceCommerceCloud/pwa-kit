/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    Stack
} from '@chakra-ui/react'
import {useProduct, useCategory, useShopperBasketsMutation} from 'commerce-sdk-react-preview'

// Hooks
import {useCurrentBasket} from '../../hooks/use-current-basket'
import {useVariant} from '../../hooks'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../hooks/useEinstein'
import {useServerContext} from 'pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductView from '../../partials/product-view'

// constant
import {
    API_ERROR_MESSAGE,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '../../constants'
import {rebuildPathWithParams} from '../../utils/url'
import {useHistory, useLocation, useParams} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'
import {useAddToCartModalContext} from '../../hooks/use-add-to-cart-modal'

const ProductDetail = () => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const toast = useToast()
    const navigate = useNavigation()
    const {onOpen: onAddToCartModalOpen} = useAddToCartModalContext()

    /****************************** Basket *********************************/
    const {hasBasket, basket} = useCurrentBasket()
    const createBasket = useShopperBasketsMutation('createBasket')
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    const {res} = useServerContext()
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
    }

    /*************************** Product Detail and Category ********************/
    const {productId} = useParams()
    const urlParams = new URLSearchParams(location.search)
    const {data: product, isLoading: isProductLoading} = useProduct(
        {
            parameters: {
                id: urlParams.get('pid') || productId,
                allImages: true
            }
        },
        {
            // When shoppers select a different variant (and the app fetches the new data),
            // the old data is still rendered (and not the skeletons).
            keepPreviousData: true
        }
    )
    // Note: Since category needs id from product detail, it can't be server side rendered atm
    // until we can do dependent query on server
    const {data: category} = useCategory({
        parameters: {
            id: product?.primaryCategoryId,
            level: 1
        }
    })
    const variant = useVariant(product)
    const [primaryCategory, setPrimaryCategory] = useState(category)
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
    const wishlist = useWishlist()

    // TODO: DRY this handler when intl provider is available globally
    const handleAddToWishlist = async (quantity) => {
        try {
            await wishlist.createListItem({
                id: product.id,
                quantity
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                status: 'success',
                action: (
                    // it would be better if we could use <Button as={Link}>
                    // but unfortunately the Link component is not compatible
                    // with Chakra Toast, since the ToastManager is rendered via portal
                    // and the toast doesn't have access to intl provider, which is a
                    // requirement of the Link component.
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
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

    const addItemToBasket = (basketId, variant, quantity) => {
        const productItems = [
            {
                productId: variant.productId,
                quantity,
                price: variant.price
            }
        ]

        addItemToBasketMutation.mutate(
            {parameters: {basketId}, body: productItems},
            {
                onSuccess: () => {
                    // only show this modal when a product is successfully add to cart
                    onAddToCartModalOpen({product, quantity})
                },
                onError: () => {
                    showError()
                }
            }
        )
    }

    const handleAddToCart = async (variant, quantity) => {
        if (!variant?.orderable || !quantity) return
        if (!hasBasket) {
            createBasket.mutate(
                {body: {}},
                {
                    onSuccess: (basket) => {
                        addItemToBasket(basket.basketId, variant, quantity)
                    },
                    onError: () => {
                        showError()
                    }
                }
            )
        } else {
            addItemToBasket(basket.basketId, variant, quantity)
        }
    }

    /**************** Einstein ****************/
    useEffect(() => {
        if (product) {
            einstein.sendViewProduct(product)
        }
    }, [product])

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Helmet>
                <title>{product?.pageTitle}</title>
                <meta name="description" content={product?.pageDescription} />
            </Helmet>

            <Stack spacing={16}>
                <ProductView
                    product={product}
                    category={primaryCategory?.parentCategoryTree || []}
                    addToCart={(variant, quantity) => handleAddToCart(variant, quantity)}
                    addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                    isProductLoading={isProductLoading}
                    isCustomerProductListLoading={!wishlist.isInitialized}
                />

                {/* Information Accordion */}
                <Stack direction="row" spacing={[0, 0, 0, 16]}>
                    <Accordion allowMultiple allowToggle maxWidth={'896px'} flex={[1, 1, 1, 5]}>
                        {/* Details */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Product Detail',
                                            id: 'product_detail.accordion.button.product_detail'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: product?.longDescription
                                    }}
                                />
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Size & Fit */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Size & Fit',
                                            id: 'product_detail.accordion.button.size_fit'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Reviews */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Reviews',
                                            id: 'product_detail.accordion.button.reviews'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Questions */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Questions',
                                            id: 'product_detail.accordion.button.questions'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                    <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                </Stack>

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="Complete the Set"
                                id="product_detail.recommended_products.title.complete_set"
                            />
                        }
                        recommender={'complete-the-set'}
                        products={[product]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="You might also like"
                                id="product_detail.recommended_products.title.might_also_like"
                            />
                        }
                        recommender={'pdp-similar-items'}
                        products={[product]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="Recently Viewed"
                                id="product_detail.recommended_products.title.recently_viewed"
                            />
                        }
                        recommender={'viewed-recently-einstein'}
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
