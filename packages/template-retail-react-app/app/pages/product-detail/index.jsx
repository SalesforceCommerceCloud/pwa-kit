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

// Components
import {Box, Button, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    useProduct,
    useCategory,
    useShopperBasketsMutation,
    useShopperCustomersMutation,
    useCustomerId
} from '@salesforce/commerce-sdk-react'

// Hooks
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'

// constant
import {
    API_ERROR_MESSAGE,
    EINSTEIN_RECOMMENDERS,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import {rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'
import {useHistory, useLocation, useParams} from 'react-router-dom'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

const ProductDetail = () => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const toast = useToast()
    const navigate = useNavigation()
    const [productSetSelection, setProductSetSelection] = useState({})
    const childProductRefs = React.useRef({})
    const customerId = useCustomerId()
    /****************************** Basket *********************************/
    const {data: basket} = useCurrentBasket()
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    const {res} = useServerContext()
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
    }
    const isBasketLoading = !basket?.basketId

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
    const isProductASet = product?.type.set
    // Note: Since category needs id from product detail, it can't be server side rendered atm
    // until we can do dependent query on server
    const {data: category} = useCategory({
        parameters: {
            id: product?.primaryCategoryId,
            level: 1
        }
    })
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
        createCustomerProductListItem.mutate(
            {
                parameters: {
                    listId: wishlist.id,
                    customerId
                },
                body: {
                    // NOTE: APi does not respect quantity, it always adds 1
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
                            <Button variant="link" onClick={() => navigate('/account/wishlist')}>
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
        try {
            const productItems = productSelectionValues.map(({variant, quantity}) => ({
                productId: variant.productId,
                price: variant.price,
                quantity
            }))

            await addItemToBasketMutation.mutateAsync({
                parameters: {basketId: basket.basketId},
                body: productItems
            })

            einstein.sendAddToCart(productItems)

            // If the items were successfully added, set the return value to be used
            // by the add to cart modal.
            return productSelectionValues
        } catch (error) {
            showError(error)
        }
    }

    /**************** Product Set Handlers ****************/
    const handleProductSetValidation = useCallback(() => {
        // Run validation for all child products. This will ensure the error
        // messages are shown.
        Object.values(childProductRefs.current).forEach(({validateOrderability}) => {
            validateOrderability({scrollErrorIntoView: false})
        })

        // Using ot state for which child products are selected, scroll to the first
        // one that isn't selected.
        const selectedProductIds = Object.keys(productSetSelection)
        const firstUnselectedProduct = product.setProducts.find(
            ({id}) => !selectedProductIds.includes(id)
        )

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
    }, [product, productSetSelection])

    const handleProductSetAddToCart = () => {
        // Get all the selected products, and pass them to the addToCart handler which
        // accepts an array.
        const productSelectionValues = Object.values(productSetSelection)
        return handleAddToCart(productSelectionValues)
    }

    /**************** Einstein ****************/
    useEffect(() => {
        if (product && product.type.set) {
            einstein.sendViewProduct(product)
            const childrenProducts = product.setProducts
            childrenProducts.map((child) => {
                einstein.sendViewProduct(child)
            })
        } else if (product) {
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
                            addToWishlist={handleAddToWishlist}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                            validateOrderability={handleProductSetValidation}
                        />

                        <hr />

                        {/* TODO: consider `childProduct.belongsToSet` */}
                        {
                            // Product Set: render the child products
                            product.setProducts.map((childProduct) => (
                                <Box key={childProduct.id} data-testid="child-product">
                                    <ProductView
                                        // Do no use an arrow function as we are manipulating the functions scope.
                                        ref={function (ref) {
                                            // Assign the "set" scope of the ref, this is how we access the internal
                                            // validation.
                                            childProductRefs.current[childProduct.id] = {
                                                ref,
                                                validateOrderability: this.validateOrderability
                                            }
                                        }}
                                        product={childProduct}
                                        isProductPartOfSet={true}
                                        addToCart={(variant, quantity) =>
                                            handleAddToCart([
                                                {product: childProduct, variant, quantity}
                                            ])
                                        }
                                        addToWishlist={handleAddToWishlist}
                                        onVariantSelected={(product, variant, quantity) => {
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
                                        isProductLoading={isProductLoading}
                                        isBasketLoading={isBasketLoading}
                                        isWishlistLoading={isWishlistLoading}
                                    />
                                    <InformationAccordion product={childProduct} />

                                    <Box display={['none', 'none', 'none', 'block']}>
                                        <hr />
                                    </Box>
                                </Box>
                            ))
                        }
                    </Fragment>
                ) : (
                    <Fragment>
                        <ProductView
                            product={product}
                            category={primaryCategory?.parentCategoryTree || []}
                            addToCart={(variant, quantity) =>
                                handleAddToCart([{product, variant, quantity}])
                            }
                            addToWishlist={handleAddToWishlist}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                        />
                        <InformationAccordion product={product} />
                    </Fragment>
                )}

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
