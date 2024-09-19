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
    useProducts,
    useCategory,
    useShopperCustomersMutation,
    useShopperBasketsMutation,
    useCustomerId,
    useShopperBasketsMutationHelper
} from '@salesforce/commerce-sdk-react'

// Hooks
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
// Project Components
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'

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

const ProductDetail = () => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const activeData = useActiveData()
    const toast = useToast()
    const navigate = useNavigation()
    const customerId = useCustomerId()

    /****************************** Basket *********************************/
    const {isLoading: isBasketLoading} = useCurrentBasket()
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
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
                    'bundled_products'
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
            keepPreviousData: true
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

    /**************** Einstein ****************/
    useEffect(() => {
        if (product && product.type.set) {
            einstein.sendViewProduct(product)
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
                {isProductASet || isProductABundle ? (
                    <Fragment>
                        <ProductView
                            product={product}
                            category={primaryCategory?.parentCategoryTree || []}
                            addToCart={
                                isProductASet
                                    ? handleProductSetAddToCart
                                    : handleProductBundleAddToCart
                            }
                            addToWishlist={handleAddToWishlist}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                            validateOrderability={handleChildProductValidation}
                            childProductOrderability={childProductOrderability}
                            setSelectedBundleQuantity={setSelectedBundleQuantity}
                        />

                        <hr />

                        {/* TODO: consider `childProduct.belongsToSet` */}
                        {
                            // Render the child products
                            comboProduct.childProducts.map(
                                ({product: childProduct, quantity: childQuantity}) => (
                                    <Box key={childProduct.id} data-testid="child-product">
                                        <ProductView
                                            // Do not use an arrow function as we are manipulating the functions scope.
                                            ref={function (ref) {
                                                // Assign the "set" scope of the ref, this is how we access the internal
                                                // validation.
                                                childProductRefs.current[childProduct.id] = {
                                                    ref,
                                                    validateOrderability: this.validateOrderability
                                                }
                                            }}
                                            product={childProduct}
                                            isProductPartOfSet={isProductASet}
                                            isProductPartOfBundle={isProductABundle}
                                            childOfBundleQuantity={childQuantity}
                                            selectedBundleParentQuantity={selectedBundleQuantity}
                                            addToCart={
                                                isProductASet
                                                    ? (variant, quantity) =>
                                                          handleAddToCart([
                                                              {
                                                                  product: childProduct,
                                                                  variant,
                                                                  quantity
                                                              }
                                                          ])
                                                    : null
                                            }
                                            addToWishlist={
                                                isProductASet ? handleAddToWishlist : null
                                            }
                                            onVariantSelected={(product, variant, quantity) => {
                                                if (quantity) {
                                                    setChildProductSelection((previousState) => ({
                                                        ...previousState,
                                                        [product.id]: {
                                                            product,
                                                            variant,
                                                            quantity: isProductABundle
                                                                ? childQuantity
                                                                : quantity
                                                        }
                                                    }))
                                                } else {
                                                    const selections = {...childProductSelection}
                                                    delete selections[product.id]
                                                    setChildProductSelection(selections)
                                                }
                                            }}
                                            isProductLoading={isProductLoading}
                                            isBasketLoading={isBasketLoading}
                                            isWishlistLoading={isWishlistLoading}
                                            setChildProductOrderability={
                                                setChildProductOrderability
                                            }
                                        />
                                        <InformationAccordion product={childProduct} />

                                        <Box display={['none', 'none', 'none', 'block']}>
                                            <hr />
                                        </Box>
                                    </Box>
                                )
                            )
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
