/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'
import useNavigation from '../../hooks/use-navigation'

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

// Hooks
import useBasket from '../../commerce-api/hooks/useBasket'
import useCustomerProductLists, {
    eventActions
} from '../../commerce-api/hooks/useCustomerProductLists'
import {useVariant} from '../../hooks'
import useEinstein from '../../commerce-api/hooks/useEinstein'

// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductView from '../../partials/product-view'

// Others/Utils
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

// constant
import {customerProductListTypes} from '../../constants'
import {rebuildPathWithParams} from '../../utils/url'
import {useHistory} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../account/constant'

const ProductDetail = ({category, product, isLoading}) => {
    const intl = useIntl()
    const basket = useBasket()
    const history = useHistory()
    const einstein = useEinstein()

    const [primaryCategory, setPrimaryCategory] = useState(category)

    const variant = useVariant(product)
    const customerProductLists = useCustomerProductLists()
    const navigate = useNavigation()
    const showToast = useToast()
    const handleAddToCart = async (variant, quantity) => {
        try {
            if (!variant?.orderable || !quantity) return
            // The basket accepts an array of `ProductItems`, so lets create a single
            // item array to add to the basket.
            const productItems = [
                {
                    productId: variant.productId,
                    quantity,
                    price: variant.price
                }
            ]

            basket.addItemToBasket(productItems)
        } catch (err) {
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
    }

    const onViewWishlistClick = () => {
        navigate('/account/wishlist')
    }

    const addItemToWishlist = async (quantity = 1) => {
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.
            if (!customerProductLists?.loaded) {
                const event = {
                    item: {...product, quantity},
                    action: eventActions.ADD,
                    listType: customerProductListTypes.WISHLIST
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const wishlist = customerProductLists.data.find(
                    (list) => list.type === customerProductListTypes.WISHLIST
                )
                const requestBody = {
                    productId: product.id,
                    priority: 1,
                    quantity,
                    public: false,
                    type: 'product'
                }

                const wishlistItem = await customerProductLists.createCustomerProductListItem(
                    requestBody,
                    wishlist.id
                )

                if (wishlistItem?.id) {
                    const toastAction = (
                        <Button variant="link" onClick={onViewWishlistClick}>
                            View
                        </Button>
                    )
                    showToast({
                        title: intl.formatMessage({defaultMessage: '1 item added to wishlist'}),
                        status: 'success',
                        action: toastAction
                    })
                }
            }
        } catch (error) {
            console.error(error)
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
    }

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

    useEffect(() => {
        if (product) {
            einstein.sendViewProduct(product)
        }
    }, [product])

    // update the variation attributes parameter on the url accordingly as the variant changes
    useEffect(() => {
        const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
            pid: variant?.productId
        })
        history.replace(updatedUrl)
    }, [variant])

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
                    addToWishlist={(variant, quantity) => addItemToWishlist(quantity)}
                    isProductLoading={isLoading}
                    isCustomerProductListLoading={customerProductLists.showLoader}
                />

                {/* Information Accordion */}
                <Stack direction="row" spacing={[0, 0, 0, 16]}>
                    <Accordion allowMultiple allowToggle maxWidth={'896px'} flex={[1, 1, 1, 5]}>
                        {/* Details */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {intl.formatMessage({
                                            defaultMessage: 'Product Detail'
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
                                        {intl.formatMessage({
                                            defaultMessage: 'Size & Fit'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {intl.formatMessage({defaultMessage: 'Coming Soon'})}
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Reviews */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {intl.formatMessage({
                                            defaultMessage: 'Reviews'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                Coming Soon
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Questions */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {intl.formatMessage({
                                            defaultMessage: 'Questions'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                Coming Soon
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                    <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                </Stack>

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="Complete The Set" />}
                        recommender={'complete-the-set'}
                        products={product && [product.id]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="You Might Also Like" />}
                        recommender={'pdp-similar-items'}
                        products={product && [product.id]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="Recently Viewed" />}
                        recommender={'viewed-recently-einstein'}
                        mx={{base: -4, md: -8, lg: 0}}
                    />
                </Stack>
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

ProductDetail.shouldGetProps = ({previousLocation, location}) => {
    const previousParams = new URLSearchParams(previousLocation?.search || '')
    const params = new URLSearchParams(location.search)

    // If the product changed via the pathname or `pid` param, allow updated
    // data to be retrieved.
    return (
        previousLocation?.pathname !== location.pathname ||
        previousParams.get('pid') !== params.get('pid')
    )
}

ProductDetail.getProps = async ({params, location, api}) => {
    const {productId} = params
    let category, product
    const urlParams = new URLSearchParams(location.search)

    product = await api.shopperProducts.getProduct({
        parameters: {
            id: urlParams.get('pid') || productId,
            allImages: true
        }
    })

    if (product?.primaryCategoryId) {
        category = await api.shopperProducts.getCategory({
            parameters: {id: product?.primaryCategoryId, levels: 1}
        })
    }

    // The `commerce-isomorphic-sdk` package does not throw errors, so
    // we have to check the returned object type to inconsistencies.
    if (typeof product?.type === 'string') {
        throw new HTTPNotFound(product.detail)
    }
    if (typeof category?.type === 'string') {
        throw new HTTPNotFound(category.detail)
    }

    return {category, product}
}

ProductDetail.propTypes = {
    /**
     * The category object used for breadcrumb construction.
     */
    category: PropTypes.object,
    /**
     * The product object to be shown on the page..
     */
    product: PropTypes.object,
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool,
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail
