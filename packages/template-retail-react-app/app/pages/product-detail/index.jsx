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
<<<<<<< HEAD
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
=======
import {Box, Button, Stack} from '@chakra-ui/react'
>>>>>>> develop

// Hooks
import {useCurrentBasket} from '../../hooks/use-current-basket'
import {useVariant} from '../../hooks'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../commerce-api/hooks/useEinstein'
import {useServerContext} from 'pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductView from '../../partials/product-view'
import InformationAccordion from './partials/information-accordion'

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
<<<<<<< HEAD
    const {onOpen: onAddToCartModalOpen} = useAddToCartModalContext()
=======
    const [primaryCategory, setPrimaryCategory] = useState(category)
    const [productSetSelection, setProductSetSelection] = useState({})
    const childProductRefs = React.useRef({})

    const isProductASet = product?.type.set
>>>>>>> develop

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
    const handleAddToWishlist = async (product, variant, quantity) => {
        try {
            await wishlist.createListItem({
                id: variant?.productId || product?.id,
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
<<<<<<< HEAD

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
=======

    const handleAddToCart = async (productSelectionValues) => {
        try {
            const productItems = productSelectionValues.map(({variant, quantity}) => ({
                productId: variant.productId,
                price: variant.price,
                quantity
            }))

            await basket.addItemToBasket(productItems)

            // If the items were sucessfully added, set the return value to be used
            // by the add to cart modal.
            return productSelectionValues
        } catch (error) {
            showError(error)
>>>>>>> develop
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
<<<<<<< HEAD
                <ProductView
                    product={product}
                    category={primaryCategory?.parentCategoryTree || []}
                    addToCart={(variant, quantity) => handleAddToCart(variant, quantity)}
                    addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                    isProductLoading={isProductLoading}
                    isCustomerProductListLoading={!wishlist.isInitialized}
                />
=======
                {isProductASet ? (
                    <Fragment>
                        {/* Product Set: parent product */}
                        <ProductView
                            product={product}
                            category={primaryCategory?.parentCategoryTree || []}
                            addToCart={handleProductSetAddToCart}
                            addToWishlist={(product, variant, quantity) =>
                                handleAddToWishlist(product, variant, quantity)
                            }
                            isProductLoading={isLoading}
                            isCustomerProductListLoading={!wishlist.isInitialized}
                            validateOrderability={handleProductSetValidation}
                        />
>>>>>>> develop

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
                                        addToWishlist={(product, variant, quantity) =>
                                            handleAddToWishlist(product, variant, quantity)
                                        }
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
                                        isProductLoading={isLoading}
                                        isCustomerProductListLoading={!wishlist.isInitialized}
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
                            addToWishlist={(product, variant, quantity) =>
                                handleAddToWishlist(product, variant, quantity)
                            }
                            isProductLoading={isLoading}
                            isCustomerProductListLoading={!wishlist.isInitialized}
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
                            recommender={'complete-the-set'}
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
