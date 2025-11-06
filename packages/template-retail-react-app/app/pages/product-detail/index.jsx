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
import {getUpdateBundleChildArray} from '@salesforce/retail-react-app/app/utils/product-utils'

// Components
import {Box, Button, Stack, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
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
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import usePickupShipment from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
// Project Components
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'
import Island from '@salesforce/retail-react-app/app/components/island'

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
import {useStoreLocatorModal} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {isPickupMethod} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {useProductInventory} from '@salesforce/retail-react-app/app/hooks/use-product-inventory'

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
    const {onOpen: onOpenStoreLocator} = useStoreLocatorModal()
    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED

    /****************************** Basket *********************************/
    const {data: basket, isLoading: isBasketLoading} = useCurrentBasket()
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')
    const {res} = useServerContext()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }

    /*************************** Pick up in Store ********************/
    const {selectedStore} = useSelectedStore()
    const selectedInventoryId = selectedStore?.inventoryId || null

    const {addInventoryIdsToPickupItems, updateDefaultShipmentIfNeeded, hasPickupItems} =
        usePickupShipment(basket)

    /*************************** Multiship ********************/
    const {getShipmentIdForItems} = useMultiship(basket)

    /*************************** Product Detail and Category ********************/
    const {productId} = useParams()
    const urlParams = new URLSearchParams(location.search)
    const {
        data: productResponse,
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
                allImages: true,
                ...(selectedInventoryId ? {inventoryIds: selectedInventoryId} : {})
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
            id: productResponse?.primaryCategoryId,
            levels: 1
        }
    })

    /****************************** Sets and Bundles *********************************/
    const [childProductSelection, setChildProductSelection] = useState({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedBundleQuantity, setSelectedBundleQuantity] = useState(1)
    const childProductRefs = React.useRef({})
    const isProductASet = productResponse?.type.set
    const isProductABundle = productResponse?.type.bundle

    const childVariantIds =
        isProductABundle || isProductASet
            ? Object.keys(childProductSelection)?.map(
                  (key) =>
                      childProductSelection[key].variant?.productId ||
                      childProductSelection[key].product?.id
              )
            : []

    const {data: variantProductData} = useProducts(
        {
            parameters: {
                ids: childVariantIds.join(','),
                allImages: false,
                ...(selectedInventoryId ? {inventoryIds: selectedInventoryId} : {}),
                expand: ['availability', 'variations'],
                select: '(data.(id,inventory,inventories,master))'
            }
        },
        {
            enabled: childVariantIds.length > 0,
            keepPreviousData: true
        }
    )

    const product = useProductInventory(
        productResponse,
        variantProductData,
        selectedInventoryId,
        isProductASet,
        isProductABundle
    )

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
    const showError = (errorMessage) => {
        const errorText =
            typeof errorMessage === 'string' ? errorMessage : formatMessage(API_ERROR_MESSAGE)

        showToast({
            title: errorText,
            status: 'error'
        })
    }

    const [pickupInStoreMap, setPickupInStoreMap] = useState({})

    const handlePickupInStoreChange = (productId, checked) => {
        setPickupInStoreMap((prev) => ({
            ...prev,
            [productId]: checked
        }))
    }

    const handleAddToCart = async (productSelectionValues = []) => {
        try {
            let productItems = productSelectionValues.map((item) => {
                const {variant, quantity} = item
                // Use variant if present, otherwise use the main product
                const prod = variant || item.product || product
                return {
                    productId: prod?.productId || prod?.id, // productId for variant, id for product
                    price: prod?.price,
                    quantity
                }
            })
            // Add inventory IDs for pickup items using the hook helper
            productItems = addInventoryIdsToPickupItems(
                productItems,
                pickupInStoreMap,
                selectedStore
            )
            // Defensive check: This block ensures that if, for any reason, pickup is selected for a product but no store (inventoryId) is set,
            // we show an error. With the current UI logic, this should never be reached, but it guards against unexpected state.
            if (
                productItems.some(
                    (item) =>
                        item.inventoryId === undefined &&
                        pickupInStoreMap[item.productId || item.id]
                )
            ) {
                showError(
                    formatMessage({
                        id: 'product_view.error.no_store_selected_for_pickup',
                        defaultMessage: 'No valid store or inventory found for pickup'
                    })
                )
                return
            }

            // Check if any products have pickup selected
            const hasAnyPickupSelected = hasPickupItems(
                productSelectionValues,
                pickupInStoreMap,
                product
            )

            const currentShippingMethodIsPickup = isPickupMethod(
                basket?.shipments?.[0]?.shippingMethod
            )
            // Only perform the check if the basket exists and has at least one item
            if (!multishipEnabled && basket && basket.productItems?.length > 0) {
                if (hasAnyPickupSelected && !currentShippingMethodIsPickup) {
                    throw new Error(
                        formatMessage({
                            id: 'product_view.error.select_ship_to_address',
                            defaultMessage:
                                "Select 'Ship to Address' to match the delivery method for the items in your cart."
                        })
                    )
                }
                if (!hasAnyPickupSelected && currentShippingMethodIsPickup) {
                    throw new Error(
                        formatMessage({
                            id: 'product_view.error.select_pickup_in_store',
                            defaultMessage:
                                "Select 'Pick Up in Store' to match the delivery method for the items in your cart."
                        })
                    )
                }
            }

            // Fetch and assign a suitable shipment for product items
            const targetShipmentId = await getShipmentIdForItems(
                hasAnyPickupSelected,
                selectedStore
            )

            if (targetShipmentId) {
                productItems = productItems.map((item) => ({
                    ...item,
                    shipmentId: targetShipmentId
                }))
            }

            const basketResponse = await addItemToNewOrExistingBasket(productItems)

            // Configure shipping method for default shipment based on pickup selection
            await updateDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            const productItemsForEinstein = productSelectionValues.map(
                ({product, variant, quantity}) => ({
                    product,
                    productId: variant?.productId || product?.id,
                    price: variant?.price || product?.price,
                    quantity
                })
            )
            einstein.sendAddToCart(productItemsForEinstein)

            return productSelectionValues
        } catch (error) {
            showError(error.message)
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
        // one that isn't selected and requires a variant selection.
        const selectedProductIds = Object.keys(childProductSelection)
        const firstUnselectedProduct = product?.childProducts?.find(({product: childProduct}) => {
            // Skip validation for standard products (no variations)
            if (childProduct.type?.item) {
                return false
            }
            return !selectedProductIds.includes(childProduct.id)
        })?.product

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
    // 1. Gather the selected child products from state.
    // 2. Call handleAddToCart with the selected products.
    // 3. The add-to-cart modal will be opened in handleAddToCart.
    const handleProductSetAddToCart = () => {
        // Get all the selected products, and pass them to the addToCart handler which
        // accepts an array.
        const productSelectionValues = Object.values(childProductSelection)
        return handleAddToCart(productSelectionValues)
    }

    /**************** Product Bundle Handlers ****************/
    // Top level bundle does not have variants
    const handleProductBundleAddToCart = async ([{quantity: selectedQuantity}]) => {
        try {
            const childProductSelections = Object.values(childProductSelection)
            // Check if any products have pickup selected (including main product and bundle items)
            const bundleSelectionValues = [
                {product, variant: null, selectedQuantity},
                ...childProductSelections
            ]
            const hasAnyPickupSelected = hasPickupItems(
                bundleSelectionValues,
                pickupInStoreMap,
                product
            )

            // Check for delivery method conflicts before adding to cart
            if (!multishipEnabled && basket && basket.productItems?.length > 0) {
                const currentShippingMethod = basket?.shipments?.[0]?.shippingMethod
                const currentShippingMethodIsPickup = isPickupMethod(currentShippingMethod)

                // If there's no shipping method, treat it as non-pickup (ship to address)
                if (
                    hasAnyPickupSelected &&
                    (!currentShippingMethod || !currentShippingMethodIsPickup)
                ) {
                    throw new Error(
                        formatMessage({
                            id: 'product_view.error.select_ship_to_address',
                            defaultMessage:
                                "Select 'Ship to Address' to match the delivery method for the items in your cart."
                        })
                    )
                } else if (
                    !hasAnyPickupSelected &&
                    currentShippingMethod &&
                    currentShippingMethodIsPickup
                ) {
                    throw new Error(
                        formatMessage({
                            id: 'product_view.error.select_pickup_in_store',
                            defaultMessage:
                                "Select 'Pick Up in Store' to match the delivery method for the items in your cart."
                        })
                    )
                }
            }

            let productItems = [
                {
                    productId: product.id,
                    price: product.price,
                    quantity: selectedQuantity,
                    // The add item endpoint in the shopper baskets API does not respect variant selections
                    // for bundle children, so we have to make a follow up call to update the basket
                    // with the chosen variant selections
                    bundledProductItems: childProductSelections.map((child) => {
                        return {
                            productId: child.variant?.productId || child.product?.id,
                            quantity: child.quantity
                        }
                    })
                }
            ]

            // Add inventory IDs for pickup items using the hook helper
            productItems = addInventoryIdsToPickupItems(
                productItems,
                pickupInStoreMap,
                selectedStore
            )

            // Fetch and assign a suitable shipment for product items
            const targetShipmentId = await getShipmentIdForItems(
                hasAnyPickupSelected,
                selectedStore
            )

            if (targetShipmentId) {
                productItems = productItems.map((item) => ({
                    ...item,
                    shipmentId: targetShipmentId
                }))
            }

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

            // Configure shipping method based on pickup selection
            await updateDefaultShipmentIfNeeded(
                res,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

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

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Heading as="h1" srOnly>
                <FormattedMessage
                    defaultMessage="Product Details"
                    id="product_detail.title.product_details"
                />
            </Heading>
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
                {isProductASet || isProductABundle ? (
                    <Fragment>
                        <Island hydrateOn={'visible'}>
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
                                selectedBundleParentQuantity={selectedBundleQuantity}
                                pickupInStore={!!pickupInStoreMap[product?.id]}
                                setPickupInStore={(checked) =>
                                    product && handlePickupInStoreChange(product.id, checked)
                                }
                                onOpenStoreLocator={onOpenStoreLocator}
                                showDeliveryOptions={storeLocatorEnabled}
                            />
                        </Island>

                        <hr />

                        {
                            // Render the child products
                            product?.childProducts?.map(
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
                                                    ? (productSelectionValues) =>
                                                          handleAddToCart(productSelectionValues)
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
                                                    const selections = {
                                                        ...childProductSelection
                                                    }
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
                                            pickupInStore={
                                                !!pickupInStoreMap[
                                                    childProductSelection[childProduct?.id]?.variant
                                                        ?.productId
                                                ]
                                            }
                                            setPickupInStore={(checked) =>
                                                childProduct &&
                                                handlePickupInStoreChange(
                                                    childProductSelection[childProduct?.id]?.variant
                                                        ?.productId,
                                                    checked
                                                )
                                            }
                                            onOpenStoreLocator={onOpenStoreLocator}
                                            showDeliveryOptions={
                                                storeLocatorEnabled && !isProductABundle
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
                        <Island hydrateOn={'visible'}>
                            <ProductView
                                product={product}
                                category={primaryCategory?.parentCategoryTree || []}
                                addToCart={handleAddToCart}
                                addToWishlist={handleAddToWishlist}
                                isProductLoading={isProductLoading}
                                isBasketLoading={isBasketLoading}
                                isWishlistLoading={isWishlistLoading}
                                childProductOrderability={childProductOrderability}
                                setChildProductOrderability={setChildProductOrderability}
                                setSelectedBundleQuantity={setSelectedBundleQuantity}
                                selectedBundleParentQuantity={selectedBundleQuantity}
                                pickupInStore={!!pickupInStoreMap[product?.id]}
                                setPickupInStore={(checked) =>
                                    product && handlePickupInStoreChange(product.id, checked)
                                }
                                onOpenStoreLocator={onOpenStoreLocator}
                                showDeliveryOptions={storeLocatorEnabled}
                            />
                            <InformationAccordion product={product} />
                        </Island>
                    </Fragment>
                )}

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    {!isProductASet && (
                        <Island hydrateOn={'visible'}>
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
                        </Island>
                    )}
                    <Island hydrateOn={'visible'}>
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
                    </Island>

                    <Island hydrateOn={'visible'}>
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
                    </Island>
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
