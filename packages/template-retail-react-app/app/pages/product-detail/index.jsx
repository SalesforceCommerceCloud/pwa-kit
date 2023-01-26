/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {Box, Button, Stack} from '@chakra-ui/react'

// Hooks
import useBasket from '../../commerce-api/hooks/useBasket'
import {useVariant} from '../../hooks'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../commerce-api/hooks/useEinstein'

// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductView from '../../partials/product-view'
import InformationAccordion from './partials/information-accordion'

// Others/Utils
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

// constant
import {
    API_ERROR_MESSAGE,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '../../constants'
import {rebuildPathWithParams} from '../../utils/url'
import {useHistory} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'

const ProductDetail = ({category, product, isLoading}) => {
    const {formatMessage} = useIntl()
    const basket = useBasket()
    const history = useHistory()
    const einstein = useEinstein()
    const variant = useVariant(product)
    const toast = useToast()
    const navigate = useNavigation()
    const [primaryCategory, setPrimaryCategory] = useState(category)
    const [productSetSelection, setProductSetSelection] = useState({})
    const setProductsRefs = React.useRef({})

    const isProductASet = product?.type.set

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

    const handleAddToCart = async (productSelectionValues) => {
        let returnVal

        try {
            const productItems = productSelectionValues.map(({variant, quantity}) => ({
                productId: variant.productId,
                price: variant.price,
                quantity
            }))

            await basket.addItemToBasket(productItems)

            // If the items were sucessfully added, set the return value to be used
            // by the add to cart modal.
            returnVal = productSelectionValues
        } catch (error) {
            showError(error)
        }

        return returnVal
    }

    /**************** Product Set Handlers ****************/
    const handleProductSetValidation = () => {
        // Scroll to the first product without its options selected.
        const productSelectionKeys = Object.keys(productSetSelection)
        const unselected = product.setProducts.find(({id}) => !productSelectionKeys.includes(id))

        // Run "internal" validation on this product to show the error.
        Object.values(setProductsRefs.current).forEach(({scope}) => {
            scope.validate()
        })

        if (unselected) {
            const {ref} = setProductsRefs.current[unselected.id]

            // Scroll the first unselected product into view.
            ref.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            })

            return false
        }

        return true
    }

    const handleProductSetAddToCart = () => {
        // Get all the selected products, and pass them to the addToCart handler which
        // accepts an array.
        const productSelectionValues = Object.values(productSetSelection)
        return handleAddToCart(productSelectionValues)
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
                {isProductASet ? (
                    <Fragment>
                        {/* Product Set: parent product */}
                        <ProductView
                            product={product}
                            category={primaryCategory?.parentCategoryTree || []}
                            addToCart={handleProductSetAddToCart}
                            addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                            isProductLoading={isLoading}
                            isCustomerProductListLoading={!wishlist.isInitialized}
                            validate={handleProductSetValidation}
                        />

                        <hr />

                        {/* TODO: consider `childProduct.belongsToSet` */}
                        {// Product Set: render the child products
                        product.setProducts.map((childProduct) => (
                            <Fragment key={childProduct.id}>
                                <ProductView
                                    // Do no use an arrow function as we are manipulating the functions scope.
                                    ref={function(ref) {
                                        // Assign the "set" scope of the ref, this is how we access the internal
                                        // validation.
                                        setProductsRefs.current[childProduct.id] = {
                                            ref,
                                            scope: this
                                        }
                                    }}
                                    product={childProduct}
                                    isProductPartOfSet={true}
                                    addToCart={(variant, quantity) =>
                                        handleAddToCart([
                                            {product: childProduct, variant, quantity}
                                        ])
                                    }
                                    addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                                    variantSelected={(product, variant, quantity) => {
                                        if (quantity) {
                                            setProductSetSelection((previousState) => ({
                                                ...previousState,
                                                [product.id]: {
                                                    product,
                                                    variant,
                                                    quantity
                                                }
                                            }))
                                        } else {
                                            const selections = {...productSetSelection}
                                            delete selections[product.id]
                                            setProductSetSelection(selections)
                                        }
                                    }}
                                    isProductLoading={isLoading}
                                    isCustomerProductListLoading={!wishlist.isInitialized}
                                />
                                <InformationAccordion product={childProduct} />

                                <Box display={['none', 'none', 'none', 'block']}>
                                    <hr />
                                </Box>
                            </Fragment>
                        ))}
                    </Fragment>
                ) : (
                    <Fragment>
                        <ProductView
                            product={product}
                            category={primaryCategory?.parentCategoryTree || []}
                            addToCart={(variant, quantity) =>
                                handleAddToCart([{product, variant, quantity}])
                            }
                            addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                            isProductLoading={isLoading}
                            isCustomerProductListLoading={!wishlist.isInitialized}
                        />
                        <InformationAccordion product={product} />
                    </Fragment>
                )}

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
                        products={product}
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
                        products={product}
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

ProductDetail.getProps = async ({res, params, location, api}) => {
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

    // Set the `cache-control` header values similar to those on the product-list.
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
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
