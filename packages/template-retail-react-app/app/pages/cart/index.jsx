/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Chakra Components
import {
    Box,
    Button,
    Stack,
    Grid,
    GridItem,
    Container,
    useDisclosure,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import BonusProductsTitle from '@salesforce/retail-react-app/app/pages/cart/partials/bonus-products-title'
import CartCta from '@salesforce/retail-react-app/app/pages/cart/partials/cart-cta'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import CartSkeleton from '@salesforce/retail-react-app/app/pages/cart/partials/cart-skeleton'
import CartTitle from '@salesforce/retail-react-app/app/pages/cart/partials/cart-title'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'
import EmptyCart from '@salesforce/retail-react-app/app/pages/cart/partials/empty-cart'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import OrderTypeDisplay from '@salesforce/retail-react-app/app/pages/cart/partials/order-type-display'
import PickupOrDelivery from '@salesforce/retail-react-app/app/components/pickup-or-delivery'
import ProductItemList from '@salesforce/retail-react-app/app/components/product-item-list'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'
import BundleProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal/bundle'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import CartProductListWithGroupedBonusProducts from '@salesforce/retail-react-app/app/pages/cart/partials/cart-product-list-with-grouped-bonus-products'
import SelectBonusProductsCard from '@salesforce/retail-react-app/app/pages/cart/partials/select-bonus-products-card'
import {DELIVERY_OPTIONS} from '@salesforce/retail-react-app/app/components/pickup-or-delivery'

// Hooks
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {useStoreLocatorModal} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

// Bonus Product Utilities
import {
    useBasketProductsWithPromotions,
    getPromotionCalloutText,
    findAllBonusProductItemsToRemove,
    getBonusProductsForSpecificCartItem
} from '@salesforce/retail-react-app/app/utils/bonus-product'
import {useBonusProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-view-modal'
import {useBonusProductSelectionModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'

// Constants
import {
    API_ERROR_MESSAGE,
    EINSTEIN_RECOMMENDERS,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART,
    TOAST_MESSAGE_ALREADY_IN_WISHLIST,
    TOAST_MESSAGE_STORE_INSUFFICIENT_INVENTORY,
    STORE_LOCATOR_IS_ENABLED
} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'

// Utilities
import debounce from 'lodash/debounce'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    useShopperBasketsMutation,
    useProducts,
    useShopperCustomersMutation,
    useStores
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal'
import {getUpdateBundleChildArray} from '@salesforce/retail-react-app/app/utils/product-utils'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'

const DEBOUNCE_WAIT = 750

const Cart = () => {
    const {data: basket, isLoading, derivedData} = useCurrentBasket()

    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED

    // State for tracking items being removed (for UI feedback)
    const [removingItemIds, setRemovingItemIds] = React.useState([])

    // Get configuration for bonus product grouping
    const config = getConfig()
    const groupBonusProductsWithQualifyingProduct =
        config.app?.pages?.cart?.groupBonusProductsWithQualifyingProduct ?? true

    // Pickup in Store - inventory at current store and all unique store IDs from all shipments
    const {selectedStore} = useSelectedStore()
    const selectedInventoryId = selectedStore?.inventoryId || null
    const allStoreIds = derivedData?.pickupStoreIds?.join(',') ?? ''
    const {data: storeData} = useStores(
        {
            parameters: {
                ids: allStoreIds
            }
        },
        {
            enabled: !!allStoreIds && storeLocatorEnabled
        }
    )
    const uniqueInventoryIds = [
        ...new Set(
            [selectedInventoryId]
                .concat(storeData?.data?.map((store) => store.inventoryId))
                .filter(Boolean)
        )
    ].join(',')

    const {
        updateDeliveryOption,
        updateShipmentsWithoutMethods,
        getItemsForShipment,
        findOrCreatePickupShipment,
        moveItemsToPickupShipment
    } = useMultiship(basket)
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''

    // Bonus Product Logic
    const {
        data: productsWithPromotions,
        ruleBasedQualifyingProductsMap,
        isLoading: isPromotionDataLoading
    } = useBasketProductsWithPromotions(basket)
    const bonusProductViewModal = useBonusProductViewModal()
    const {onOpen: openBonusSelectionModal} = useBonusProductSelectionModalContext()

    // Handle opening bonus product selection modal (not the view modal directly)
    const handleSelectBonusProducts = () => {
        const bonusDiscountLineItems = basket?.bonusDiscountLineItems || []
        if (bonusDiscountLineItems.length > 0) {
            openBonusSelectionModal({
                bonusDiscountLineItems: bonusDiscountLineItems
            })
        }
    }
    const {data: products, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true,
                perPricebook: true,
                ...(uniqueInventoryIds ? {inventoryIds: uniqueInventoryIds} : {})
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    const {data: customer} = useCurrentCustomer()
    const {customerId, isRegistered} = customer

    /***************** Product Bundles ************************/
    const bundleChildVariantIds = []
    basket?.productItems?.forEach((productItem) => {
        productItem?.bundledProductItems?.forEach((childProduct) => {
            bundleChildVariantIds.push(childProduct.productId)
        })
    })

    const {data: bundleChildProductData} = useProducts(
        {
            parameters: {
                ids: bundleChildVariantIds?.join(','),
                allImages: false,
                ...(uniqueInventoryIds ? {inventoryIds: uniqueInventoryIds} : {}),
                expand: ['availability', 'variations'],
                select: '(data.(id,inventory,inventories,master))'
            }
        },
        {
            enabled: bundleChildVariantIds?.length > 0,
            keepPreviousData: true,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    // We use the `products` object to reference products by itemId instead of productId
    // Since with product bundles, even though the parent productId is the same,
    // variant selection of the bundle children can be different,
    // and require unique references to each product bundle
    const productsByItemId = useMemo(() => {
        const getLowestStockInfo = (
            parentProduct,
            productItem,
            bundleChildProductData,
            inventoryId = null
        ) => {
            const isDefaultInventory = !inventoryId
            const parentInventory = isDefaultInventory
                ? parentProduct.inventory
                : parentProduct.inventories?.find((inv) => inv.id === inventoryId)

            let lowestStockLevel = parentInventory?.stockLevel ?? Number.MAX_SAFE_INTEGER
            let productWithLowestInventory = ''

            productItem.bundledProductItems.forEach((bundleChild) => {
                const childProduct = bundleChildProductData[bundleChild.productId]
                const childInventory = isDefaultInventory
                    ? childProduct?.inventory
                    : childProduct?.inventories?.find((inv) => inv.id === inventoryId)
                const childStockLevel = childInventory?.stockLevel ?? Number.MAX_SAFE_INTEGER

                if (childStockLevel < lowestStockLevel) {
                    lowestStockLevel = childStockLevel
                    productWithLowestInventory = bundleChild.productName
                }
            })

            return {lowestStockLevel, productWithLowestInventory}
        }

        const updateProductsByItemId = {}
        basket?.productItems?.forEach((productItem) => {
            let currentProduct = products?.[productItem?.productId]

            if (currentProduct && productItem?.bundledProductItems && bundleChildProductData) {
                // Calculate and update the default inventory for the bundle.
                if (currentProduct.inventory) {
                    const {lowestStockLevel, productWithLowestInventory} = getLowestStockInfo(
                        currentProduct,
                        productItem,
                        bundleChildProductData
                    )
                    currentProduct = {
                        ...currentProduct,
                        inventory: {
                            ...currentProduct.inventory,
                            stockLevel: lowestStockLevel,
                            lowestStockLevelProductName: productWithLowestInventory
                        }
                    }
                }

                // Calculate and update in-store inventories for the bundle.
                if (currentProduct.inventories) {
                    const updatedInventories = currentProduct.inventories.map((inventory) => {
                        const {
                            lowestStockLevel: lowestInStoreStockLevel,
                            productWithLowestInventory: productWithLowestInventoryForStore
                        } = getLowestStockInfo(
                            currentProduct,
                            productItem,
                            bundleChildProductData,
                            inventory.id
                        )

                        return {
                            ...inventory,
                            stockLevel: lowestInStoreStockLevel,
                            lowestStockLevelProductName: productWithLowestInventoryForStore
                        }
                    })

                    currentProduct = {
                        ...currentProduct,
                        inventories: updatedInventories
                    }
                }
            }
            updateProductsByItemId[productItem.itemId] = currentProduct
        })
        return updateProductsByItemId
    }, [basket, products, bundleChildProductData])

    /*****************Basket Mutation************************/
    const updateItemInBasketMutation = useShopperBasketsMutation('updateItemInBasket')
    const updateItemsInBasketMutation = useShopperBasketsMutation('updateItemsInBasket')
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    /*****************Basket Mutation************************/

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [localIsGiftItems, setLocalIsGiftItems] = useState({})
    const [isCartItemLoading, setCartItemLoading] = useState(false)
    const [isProcessingShippingMethods, setIsProcessingShippingMethods] = useState(false)

    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    const modalProps = useDisclosure()
    const storeLocatorModal = useStoreLocatorModal()

    // Custom handler for opening store locator from cart's "Change Store" button
    const handleChangeStoreFromCart = async (shipmentInfo) => {
        if (
            !isProductsLoading &&
            selectedStore?.id &&
            selectedStore.inventoryId &&
            shipmentInfo.store?.id !== selectedStore.id &&
            shipmentInfo.shipment?.shipmentId
        ) {
            try {
                setCartItemLoading(true)

                // Get all items from the source shipment that have inventory at the new store
                const itemsInShipment = getItemsForShipment(
                    basket,
                    shipmentInfo.shipment?.shipmentId
                )
                const itemsToMove = itemsInShipment.filter(
                    (productItem) =>
                        productsByItemId?.[productItem.itemId]?.inventories?.find(
                            (inventory) => inventory.id === selectedStore?.inventoryId
                        )?.stockLevel >= productItem.quantity
                )
                if (itemsToMove.length) {
                    const targetShipment = await findOrCreatePickupShipment(selectedStore)
                    await moveItemsToPickupShipment(
                        itemsToMove,
                        targetShipment?.shipmentId,
                        selectedStore.inventoryId
                    )
                }

                if (itemsInShipment.length !== itemsToMove.length) {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_STORE_INSUFFICIENT_INVENTORY),
                        status: 'error'
                    })
                }
            } catch (error) {
                console.error('Failed to change store for pickup shipment:', error)
                showError()
            } finally {
                setCartItemLoading(false)
            }
        }
    }

    /******************* Assign Default Shipping Methods to Shipments *******************/
    // Assign default shipping methods to any shipments that don't have one
    // This runs when the basket is first loaded and whenever shipments change
    useEffect(() => {
        const assignDefaultShippingMethods = async () => {
            if (isProcessingShippingMethods || !basket?.basketId) {
                return
            }

            // Check if any shipments need shipping methods to avoid unnecessary processing
            const hasShipmentsWithoutMethod = basket.shipments?.some(
                (shipment) => !shipment.shippingMethod
            )

            if (!hasShipmentsWithoutMethod) {
                return
            }

            setIsProcessingShippingMethods(true)
            try {
                await updateShipmentsWithoutMethods()
            } catch (error) {
                console.error('Failed to assign default shipping methods:', error)
            } finally {
                setIsProcessingShippingMethods(false)
            }
        }

        assignDefaultShippingMethods()
    }, [basket?.basketId, basket?.shipments?.length, isProcessingShippingMethods])

    /************************* Error handling ***********************/
    const showError = () => {
        toast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }
    /************************* Error handling ***********************/

    /**************** Wishlist ****************/
    const {data: wishlist} = useWishList()

    const createCustomerProductListItem = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const handleAddToWishlist = async (product) => {
        try {
            if (!customerId || !wishlist) {
                return
            }

            const isItemInWishlist = wishlist?.customerProductListItems?.find(
                (i) => i.productId === product?.id
            )

            if (!isItemInWishlist) {
                await createCustomerProductListItem.mutateAsync({
                    parameters: {
                        listId: wishlist.id,
                        customerId
                    },
                    body: {
                        // NOTE: APi does not respect quantity, it always adds 1
                        quantity: product.quantity,
                        productId: product.productId,
                        public: false,
                        priority: 1,
                        type: 'product'
                    }
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
        } catch {
            showError()
        }
    }
    /**************** Wishlist ****************/

    /***************************** Update Cart **************************/
    const handleUpdateCart = async (variant, quantity) => {
        // close the modal before handle the change
        onClose()
        // using try-catch is better than using onError callback since we have many mutation calls logic here
        try {
            setCartItemLoading(true)
            const productIds = basket.productItems.map(({productId}) => productId)

            // The user is selecting different variant, and it has not existed in basket
            if (selectedItem.id !== variant.productId && !productIds.includes(variant.productId)) {
                const item = {
                    productId: variant.productId,
                    quantity,
                    price: variant.price
                }
                return await updateItemInBasketMutation.mutateAsync({
                    parameters: {
                        basketId: basket.basketId,
                        itemId: selectedItem.itemId
                    },
                    body: item
                })
            }

            // The user is selecting different variant, and it has existed in basket
            // remove this item in the basket, change the quantity for the new selected variant in the basket
            if (selectedItem.id !== variant.productId && productIds.includes(variant.productId)) {
                await removeItemFromBasketMutation.mutateAsync({
                    parameters: {
                        basketId: basket.basketId,
                        itemId: selectedItem.itemId
                    }
                })
                const basketItem = basket.productItems.find(
                    ({productId}) => productId === variant.productId
                )
                const newQuantity = quantity + basketItem.quantity
                return await changeItemQuantity(newQuantity, basketItem)
            }

            // the user only changes quantity of the same variant
            if (selectedItem.quantity !== quantity) {
                return await changeItemQuantity(quantity, selectedItem)
            }
        } catch {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleUpdateBundle = async (bundle, bundleQuantity, childProducts) => {
        // close the modal before handle the change
        onClose()

        try {
            setCartItemLoading(true)
            const itemsToBeUpdated = getUpdateBundleChildArray(bundle, childProducts)

            // We only update the parent bundle when the quantity changes
            // Since top level bundles don't have variants
            if (bundle.quantity !== bundleQuantity) {
                itemsToBeUpdated.unshift({
                    itemId: bundle.itemId,
                    productId: bundle.productId,
                    quantity: bundleQuantity
                })
            }

            if (itemsToBeUpdated.length) {
                await updateItemsInBasketMutation.mutateAsync({
                    method: 'PATCH',
                    parameters: {
                        basketId: basket.basketId
                    },
                    body: itemsToBeUpdated
                })
            }
        } catch {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleIsAGiftChange = async (product, checked) => {
        try {
            const previousVal = localIsGiftItems[product.itemId]
            setLocalIsGiftItems({
                ...localIsGiftItems,
                [product.itemId]: checked
            })
            setCartItemLoading(true)
            setSelectedItem(product)
            await updateItemInBasketMutation.mutateAsync(
                {
                    parameters: {basketId: basket?.basketId, itemId: product.itemId},
                    body: {
                        productId: product.id,
                        quantity: parseInt(product.quantity),
                        gift: checked
                    }
                },
                {
                    onSettled: () => {
                        // reset the state
                        setCartItemLoading(false)
                        setSelectedItem(undefined)
                    },
                    onSuccess: () => {
                        setLocalIsGiftItems({...localIsGiftItems, [product.itemId]: undefined})
                    },
                    onError: () => {
                        // reset the quantity to the previous value
                        setLocalIsGiftItems({...localIsGiftItems, [product.itemId]: previousVal})
                        showError()
                    }
                }
            )
        } catch (e) {
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleUnavailableProducts = async (unavailableProductIds) => {
        const productItems = basket?.productItems?.filter((item) =>
            unavailableProductIds?.includes(item.productId)
        )

        await Promise.all(
            productItems.map(async (item) => {
                await handleRemoveItem(item)
            })
        )
    }
    /***************************** Update Cart **************************/

    /***************************** Update quantity **************************/
    const changeItemQuantity = debounce(async (quantity, product) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        const previousQuantity = localQuantity[product.itemId]
        setLocalQuantity({...localQuantity, [product.itemId]: quantity})
        setCartItemLoading(true)
        setSelectedItem(product)

        await updateItemInBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket?.basketId, itemId: product.itemId},
                body: {
                    productId: product.id,
                    quantity: parseInt(quantity)
                }
            },
            {
                onSettled: () => {
                    // reset the state
                    setCartItemLoading(false)
                    setSelectedItem(undefined)
                },
                onSuccess: () => {
                    setLocalQuantity({...localQuantity, [product.itemId]: undefined})
                },
                onError: () => {
                    // reset the quantity to the previous value
                    setLocalQuantity({...localQuantity, [product.itemId]: previousQuantity})
                    showError()
                }
            }
        )
    }, DEBOUNCE_WAIT)

    const handleChangeItemQuantity = async (product, value) => {
        const productItemInventory =
            productsByItemId?.[product.itemId]?.inventories?.find(
                (inventory) => inventory.id === product.inventoryId
            ) || productsByItemId?.[product.itemId]?.inventory
        const stockLevel = productItemInventory?.stockLevel ?? 1

        // Handle removing of the items when 0 is selected.
        if (value === 0) {
            // Flush last call to keep ui in sync with data.
            changeItemQuantity.flush()

            // Set the selected item to the current product to the modal acts on it.
            setSelectedItem(product)

            // Show the modal.
            modalProps.onOpen()

            // Return false as 0 isn't valid section.
            return false
        }

        // Cancel any pending handlers.
        changeItemQuantity.cancel()

        // Allow use to selected values above the inventory.
        if (value > stockLevel || value === product.quantity) {
            return true
        }

        // Take action.
        changeItemQuantity(value, product)

        return true
    }
    /***************************** Update quantity **************************/

    /***************************** Remove Item from basket **************************/
    const handleRemoveItem = (product) => {
        setSelectedItem(product)
        setCartItemLoading(true)

        // Check if this is a bonus product that needs bulk removal
        if (product.bonusProductLineItem) {
            // Find all bonus product items that should be removed together
            const itemsToRemove = findAllBonusProductItemsToRemove(basket, product)

            if (itemsToRemove.length > 1) {
                // Set removing state for UI feedback
                const itemIdsToRemove = itemsToRemove.map((item) => item.itemId)
                setRemovingItemIds(itemIdsToRemove)

                // Track removal progress
                let index = 0
                let successfulRemovals = 0

                // Sequential removal function to avoid race conditions
                const removeNextItem = () => {
                    if (index >= itemsToRemove.length) {
                        // All items processed
                        setCartItemLoading(false)
                        setSelectedItem(undefined)
                        setRemovingItemIds([])

                        // Show success toast for successful removals
                        if (successfulRemovals > 0) {
                            const totalQuantity = itemsToRemove
                                .slice(0, successfulRemovals)
                                .reduce((total, item) => total + (item.quantity || 0), 0)
                            toast({
                                title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {
                                    quantity: totalQuantity
                                }),
                                status: 'success'
                            })
                        }
                        return
                    }

                    const currentItem = itemsToRemove[index]

                    removeItemFromBasketMutation.mutate(
                        {
                            parameters: {basketId: basket.basketId, itemId: currentItem.itemId}
                        },
                        {
                            onSettled: () => {
                                index++
                                // Process next item after this one settles
                                setTimeout(removeNextItem, 100)
                            },
                            onSuccess: () => {
                                successfulRemovals++
                            },
                            onError: (error) => {
                                console.error('Item removal error:', error)
                            }
                        }
                    )
                }

                removeNextItem()
            } else {
                // Single bonus product item
                removeItemFromBasketMutation.mutate(
                    {
                        parameters: {basketId: basket.basketId, itemId: product.itemId}
                    },
                    {
                        onSettled: () => {
                            setCartItemLoading(false)
                            setSelectedItem(undefined)
                        },
                        onSuccess: () => {
                            toast({
                                title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {
                                    quantity: 1
                                }),
                                status: 'success'
                            })
                        },
                        onError: (error) => {
                            console.error('Bonus product removal error:', error)
                            showError()
                        }
                    }
                )
            }
        } else {
            // Regular (non-bonus) product removal
            removeItemFromBasketMutation.mutate(
                {
                    parameters: {basketId: basket.basketId, itemId: product.itemId}
                },
                {
                    onSettled: () => {
                        setCartItemLoading(false)
                        setSelectedItem(undefined)
                    },
                    onSuccess: () => {
                        toast({
                            title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {
                                quantity: 1
                            }),
                            status: 'success'
                        })
                    },
                    onError: (error) => {
                        console.error('Product removal error:', error)
                        showError()
                    }
                }
            )
        }
    }

    // Create shipment-specific data, but group all qualifying products together for bonus product grouping
    const shipmentData = useMemo(() => {
        if (!basket?.shipments?.length) return []

        const pickupShipments = []
        const deliveryShipments = []

        // Separate pickup and delivery shipments
        basket.shipments.forEach((shipment) => {
            const isPickupOrder = storeLocatorEnabled && isPickupShipment(shipment)
            const storeId = shipment?.c_fromStoreId
            const store = storeData?.data?.find((store) => store.id === storeId)

            // Filter products for this shipment
            const shipmentProducts =
                basket.productItems?.filter(
                    (productItem) => productItem.shipmentId === shipment.shipmentId
                ) || []

            // Categorize products into regular and bonus for this shipment
            const categorizedProducts = shipmentProducts.reduce(
                (acc, productItem) => {
                    // All bonus products go to bonusProducts array (both grouped and orphaned)
                    if (productItem.bonusProductLineItem) {
                        acc.bonusProducts.push(productItem)
                    } else {
                        // Only non-bonus products go to regular products
                        acc.regularProducts.push(productItem)
                    }
                    return acc
                },
                {regularProducts: [], bonusProducts: []}
            )

            const shipmentData = {
                shipment,
                isPickupOrder,
                store,
                categorizedProducts,
                itemsInShipment:
                    categorizedProducts.regularProducts.length +
                    categorizedProducts.bonusProducts.length
            }

            // Only add shipments that have regular products
            if (shipmentData.categorizedProducts.regularProducts.length > 0) {
                if (isPickupOrder) {
                    pickupShipments.push(shipmentData)
                } else {
                    deliveryShipments.push(shipmentData)
                }
            }
        })

        const result = [...pickupShipments]

        // Combine all delivery shipments into one for display purposes
        if (deliveryShipments.length > 0) {
            const combinedDeliveryProducts = deliveryShipments.reduce(
                (acc, shipmentData) => {
                    acc.regularProducts.push(...shipmentData.categorizedProducts.regularProducts)
                    acc.bonusProducts.push(...shipmentData.categorizedProducts.bonusProducts)
                    return acc
                },
                {regularProducts: [], bonusProducts: []}
            )

            result.push({
                shipment: null, // No specific shipment for combined delivery
                isPickupOrder: false,
                store: null, // No specific store for combined delivery
                categorizedProducts: combinedDeliveryProducts,
                itemsInShipment:
                    combinedDeliveryProducts.regularProducts.length +
                    combinedDeliveryProducts.bonusProducts.length
            })
        }

        return result
    }, [basket?.shipments, basket?.productItems, storeData])

    // Helper function to get shipment info for a product
    const getShipmentInfoForProduct = (productItem) => {
        const shipment = basket?.shipments?.find((s) => s.shipmentId === productItem.shipmentId)
        if (!shipment) return null

        const isPickupOrder = storeLocatorEnabled && isPickupShipment(shipment)
        const storeId = shipment?.c_fromStoreId
        const store = storeData?.data?.find((store) => store.id === storeId)

        return {
            shipment,
            isPickupOrder,
            store
        }
    }

    /***************************** Delivery Options **************************/

    const onDeliveryOptionChange = async (productItem, selectedDeliveryOption) => {
        try {
            setCartItemLoading(true)
            setSelectedItem(productItem)

            const selectedPickup = selectedDeliveryOption === DELIVERY_OPTIONS.PICKUP

            // If the user selects pickup and no store is selected, open the store locator modal
            if (selectedPickup && !selectedStore) {
                storeLocatorModal.onOpen()
                return
            }

            const productData = products?.[productItem.productId]
            const defaultInventoryId = productData?.inventory?.id

            if (!defaultInventoryId) {
                throw new Error(`No inventory ID found for product ${productItem.productId}`)
            }

            await updateDeliveryOption(
                productItem,
                selectedPickup,
                selectedStore,
                defaultInventoryId
            )
        } catch (error) {
            console.error('Error changing delivery option:', error)
            showError()
        } finally {
            setCartItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    // Function to render deliveryActions
    const renderDeliveryActions = (productItem, shipmentInfo) => {
        const showDeliveryOptions = storeLocatorEnabled && multishipEnabled
        if (!showDeliveryOptions) {
            return null
        }

        // Check if this product has bonus products associated with it
        // If it does, hide the delivery group selector
        const hasBonusProducts =
            getBonusProductsForSpecificCartItem(
                basket,
                productItem,
                productsWithPromotions,
                ruleBasedQualifyingProductsMap
            ).length > 0

        if (hasBonusProducts) {
            return null
        }

        const deliveryOption = shipmentInfo.isPickupOrder
            ? DELIVERY_OPTIONS.PICKUP
            : DELIVERY_OPTIONS.DELIVERY

        const selectedStoreInventoryAvailable =
            productsByItemId?.[productItem.itemId]?.inventories?.find(
                (inventory) => inventory.id === selectedInventoryId
            )?.stockLevel >= productItem.quantity
        const defaultInventoryAvailable =
            productsByItemId?.[productItem.itemId]?.inventory?.stockLevel >= productItem.quantity
        const isPickupDisabled = !shipmentInfo.isPickupOrder && !selectedStoreInventoryAvailable
        const isShipDisabled = shipmentInfo.isPickupOrder && !defaultInventoryAvailable

        return (
            <PickupOrDelivery
                isPickupDisabled={isPickupDisabled}
                isShipDisabled={isShipDisabled}
                value={deliveryOption}
                onChange={(selectedValue) => onDeliveryOptionChange(productItem, selectedValue)}
            />
        )
    }

    // Function to render secondary actions for product items
    const renderSecondaryActions = ({isAGift}) => (
        <CartSecondaryButtonGroup
            isAGift={isAGift}
            onIsAGiftChange={handleIsAGiftChange}
            onAddToWishlistClick={handleAddToWishlist}
            onEditClick={(product) => {
                setSelectedItem(product)
                onOpen()
            }}
            onRemoveItemClick={handleRemoveItem}
        />
    )

    /********* Rendering  UI **********/
    if (isLoading) {
        return <CartSkeleton />
    }

    if (!isLoading && !basket?.productItems?.length) {
        return <EmptyCart isRegistered={isRegistered} />
    }

    return (
        <Box background="gray.50" flex="1" data-testid="sf-cart-container">
            <Heading as="h1" srOnly>
                <FormattedMessage defaultMessage="Shopping Cart" id="cart.title.shopping_cart" />
            </Heading>
            <Container
                maxWidth="container.xl"
                px={[4, 6, 6, 4]}
                paddingTop={{base: 8, lg: 8}}
                paddingBottom={{base: 8, lg: 14}}
            >
                <Stack spacing={24}>
                    <Stack spacing={4}>
                        <CartTitle />
                        <Grid
                            templateColumns={{base: '1fr', lg: '66% 1fr'}}
                            gap={{base: 10, xl: 20}}
                        >
                            <GridItem>
                                <Stack spacing={6}>
                                    {shipmentData.map((shipmentInfo) => (
                                        <Box
                                            key={
                                                shipmentInfo.shipment?.shipmentId ||
                                                'combined-delivery'
                                            }
                                            bg="white"
                                            borderLeft="1px solid"
                                            borderRight="1px solid"
                                            borderBottom="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            borderTopRadius="none"
                                            overflow="hidden"
                                            boxShadow="sm"
                                            p={4}
                                        >
                                            {/* Order Type Display */}
                                            {storeLocatorEnabled && (
                                                <OrderTypeDisplay
                                                    isPickupOrder={shipmentInfo.isPickupOrder}
                                                    store={shipmentInfo.store}
                                                    itemsInShipment={shipmentInfo.itemsInShipment}
                                                    totalItemsInCart={
                                                        basket?.productItems?.length || 0
                                                    }
                                                    onChangeStore={
                                                        selectedStore &&
                                                        selectedStore.id !== shipmentInfo.store?.id
                                                            ? () =>
                                                                  handleChangeStoreFromCart(
                                                                      shipmentInfo
                                                                  )
                                                            : null
                                                    }
                                                />
                                            )}

                                            {/* Conditional Bonus Product Rendering with Shipment-based Structure */}
                                            {groupBonusProductsWithQualifyingProduct ? (
                                                /* Grouped layout: Groups bonus products with their qualifying products */
                                                <CartProductListWithGroupedBonusProducts
                                                    nonBonusProducts={
                                                        shipmentInfo.categorizedProducts
                                                            .regularProducts
                                                    }
                                                    basket={basket}
                                                    productsWithPromotions={productsWithPromotions}
                                                    ruleBasedQualifyingProductsMap={
                                                        ruleBasedQualifyingProductsMap
                                                    }
                                                    isPromotionDataLoading={isPromotionDataLoading}
                                                    renderProductItem={(
                                                        productItem,
                                                        idx,
                                                        options
                                                    ) => (
                                                        <ProductItemList
                                                            key={productItem.itemId}
                                                            productItems={[productItem]}
                                                            productsByItemId={productsByItemId}
                                                            isProductsLoading={isProductsLoading}
                                                            localQuantity={localQuantity}
                                                            localIsGiftItems={localIsGiftItems}
                                                            isCartItemLoading={isCartItemLoading}
                                                            selectedItem={selectedItem}
                                                            removingItemIds={removingItemIds}
                                                            onItemQuantityChange={
                                                                handleChangeItemQuantity
                                                            }
                                                            onRemoveItemClick={handleRemoveItem}
                                                            renderSecondaryActions={
                                                                renderSecondaryActions
                                                            }
                                                            getShipmentInfoForProduct={
                                                                getShipmentInfoForProduct
                                                            }
                                                            renderDeliveryActions={(
                                                                productItem
                                                            ) => {
                                                                const productShipmentInfo =
                                                                    getShipmentInfoForProduct(
                                                                        productItem
                                                                    )
                                                                return productShipmentInfo
                                                                    ? renderDeliveryActions(
                                                                          productItem,
                                                                          productShipmentInfo
                                                                      )
                                                                    : null
                                                            }}
                                                            {...options}
                                                        />
                                                    )}
                                                    getPromotionCalloutText={
                                                        getPromotionCalloutText
                                                    }
                                                    onSelectBonusProducts={
                                                        handleSelectBonusProducts
                                                    }
                                                    hideBorder={true}
                                                />
                                            ) : (
                                                /* Simple layout: Renders all cart items individually with separate bonus product cards */
                                                <Stack gap={4}>
                                                    {/* Render all cart items in simple layout */}
                                                    {shipmentInfo.categorizedProducts.regularProducts?.map(
                                                        (productItem) => (
                                                            <ProductItemList
                                                                key={productItem.itemId}
                                                                productItems={[productItem]}
                                                                productsByItemId={productsByItemId}
                                                                isProductsLoading={
                                                                    isProductsLoading
                                                                }
                                                                localQuantity={localQuantity}
                                                                localIsGiftItems={localIsGiftItems}
                                                                isCartItemLoading={
                                                                    isCartItemLoading
                                                                }
                                                                selectedItem={selectedItem}
                                                                removingItemIds={removingItemIds}
                                                                onItemQuantityChange={
                                                                    handleChangeItemQuantity
                                                                }
                                                                onRemoveItemClick={handleRemoveItem}
                                                                renderSecondaryActions={
                                                                    renderSecondaryActions
                                                                }
                                                                getShipmentInfoForProduct={
                                                                    getShipmentInfoForProduct
                                                                }
                                                                renderDeliveryActions={(
                                                                    productItem
                                                                ) =>
                                                                    renderDeliveryActions(
                                                                        productItem,
                                                                        shipmentInfo
                                                                    )
                                                                }
                                                            />
                                                        )
                                                    )}
                                                    {/* Render grouped bonus products from this shipment */}
                                                    {shipmentInfo.categorizedProducts.bonusProducts
                                                        ?.filter(
                                                            (productItem) =>
                                                                productItem.bonusDiscountLineItemId
                                                        )
                                                        ?.map((productItem) => (
                                                            <ProductItemList
                                                                key={productItem.itemId}
                                                                productItems={[productItem]}
                                                                productsByItemId={productsByItemId}
                                                                isProductsLoading={
                                                                    isProductsLoading
                                                                }
                                                                localQuantity={localQuantity}
                                                                localIsGiftItems={localIsGiftItems}
                                                                isCartItemLoading={
                                                                    isCartItemLoading
                                                                }
                                                                selectedItem={selectedItem}
                                                                removingItemIds={removingItemIds}
                                                                onItemQuantityChange={
                                                                    handleChangeItemQuantity
                                                                }
                                                                onRemoveItemClick={handleRemoveItem}
                                                                renderSecondaryActions={
                                                                    renderSecondaryActions
                                                                }
                                                                getShipmentInfoForProduct={
                                                                    getShipmentInfoForProduct
                                                                }
                                                                renderDeliveryActions={(
                                                                    productItem
                                                                ) => {
                                                                    const productShipmentInfo =
                                                                        getShipmentInfoForProduct(
                                                                            productItem
                                                                        )
                                                                    return productShipmentInfo
                                                                        ? renderDeliveryActions(
                                                                              productItem,
                                                                              productShipmentInfo
                                                                          )
                                                                        : null
                                                                }}
                                                            />
                                                        ))}
                                                    {/* Render SelectBonusProductsCard for each bonusDiscountLineItem */}
                                                    {basket.bonusDiscountLineItems?.map(
                                                        (bonusDiscountLineItem) => {
                                                            // Find a qualifying product that triggered this bonus opportunity
                                                            const qualifyingProduct =
                                                                basket.productItems?.find(
                                                                    (item) =>
                                                                        !item.bonusProductLineItem &&
                                                                        item.priceAdjustments?.some(
                                                                            (adj) =>
                                                                                adj.promotionId ===
                                                                                bonusDiscountLineItem.promotionId
                                                                        )
                                                                ) || {
                                                                    productId:
                                                                        bonusDiscountLineItem.promotionId
                                                                } // Fallback

                                                            return (
                                                                <SelectBonusProductsCard
                                                                    key={bonusDiscountLineItem.id}
                                                                    qualifyingProduct={
                                                                        qualifyingProduct
                                                                    }
                                                                    basket={basket}
                                                                    productsWithPromotions={
                                                                        productsWithPromotions
                                                                    }
                                                                    remainingBonusProductsData={{
                                                                        bonusItems: [],
                                                                        hasRemainingCapacity: true,
                                                                        aggregatedMaxBonusItems:
                                                                            bonusDiscountLineItem.maxBonusItems ||
                                                                            0,
                                                                        aggregatedSelectedItems: 0
                                                                    }}
                                                                    bonusDiscountLineItem={
                                                                        bonusDiscountLineItem
                                                                    }
                                                                    getPromotionCalloutText={
                                                                        getPromotionCalloutText
                                                                    }
                                                                    onSelectBonusProducts={
                                                                        handleSelectBonusProducts
                                                                    }
                                                                />
                                                            )
                                                        }
                                                    )}
                                                    {/* Render orphaned bonus products (bonus products without bonusDiscountLineItemId) */}
                                                    {(() => {
                                                        const orphanedBonusProducts =
                                                            shipmentInfo.categorizedProducts.bonusProducts?.filter(
                                                                (productItem) =>
                                                                    !productItem.bonusDiscountLineItemId
                                                            ) || []
                                                        return (
                                                            orphanedBonusProducts.length > 0 && (
                                                                <>
                                                                    <BonusProductsTitle
                                                                        bonusItemsCount={
                                                                            orphanedBonusProducts.length
                                                                        }
                                                                    />
                                                                    <ProductItemList
                                                                        productItems={
                                                                            orphanedBonusProducts
                                                                        }
                                                                        productsByItemId={
                                                                            productsByItemId
                                                                        }
                                                                        isProductsLoading={
                                                                            isProductsLoading
                                                                        }
                                                                        localQuantity={
                                                                            localQuantity
                                                                        }
                                                                        localIsGiftItems={
                                                                            localIsGiftItems
                                                                        }
                                                                        isCartItemLoading={
                                                                            isCartItemLoading
                                                                        }
                                                                        selectedItem={selectedItem}
                                                                        removingItemIds={
                                                                            removingItemIds
                                                                        }
                                                                        onItemQuantityChange={
                                                                            handleChangeItemQuantity
                                                                        }
                                                                        onRemoveItemClick={
                                                                            handleRemoveItem
                                                                        }
                                                                        renderSecondaryActions={
                                                                            renderSecondaryActions
                                                                        }
                                                                        renderDeliveryActions={(
                                                                            productItem
                                                                        ) => {
                                                                            const productShipmentInfo =
                                                                                getShipmentInfoForProduct(
                                                                                    productItem
                                                                                )
                                                                            return productShipmentInfo
                                                                                ? renderDeliveryActions(
                                                                                      productItem,
                                                                                      productShipmentInfo
                                                                                  )
                                                                                : null
                                                                        }}
                                                                    />
                                                                </>
                                                            )
                                                        )
                                                    })()}
                                                </Stack>
                                            )}

                                            {/* Fallback: Orphan Bonus Products (only when using grouped layout and there are unassigned bonus products) */}
                                            {(() => {
                                                const orphanedBonusProducts =
                                                    shipmentInfo.categorizedProducts.bonusProducts.filter(
                                                        (productItem) =>
                                                            !productItem.bonusDiscountLineItemId
                                                    )
                                                return (
                                                    groupBonusProductsWithQualifyingProduct &&
                                                    orphanedBonusProducts.length > 0 && (
                                                        <>
                                                            <BonusProductsTitle
                                                                bonusItemsCount={
                                                                    orphanedBonusProducts.length
                                                                }
                                                            />
                                                            <ProductItemList
                                                                productItems={orphanedBonusProducts}
                                                                productsByItemId={productsByItemId}
                                                                isProductsLoading={
                                                                    isProductsLoading
                                                                }
                                                                localQuantity={localQuantity}
                                                                localIsGiftItems={localIsGiftItems}
                                                                isCartItemLoading={
                                                                    isCartItemLoading
                                                                }
                                                                selectedItem={selectedItem}
                                                                removingItemIds={removingItemIds}
                                                                onItemQuantityChange={
                                                                    handleChangeItemQuantity
                                                                }
                                                                onRemoveItemClick={handleRemoveItem}
                                                                renderSecondaryActions={
                                                                    renderSecondaryActions
                                                                }
                                                                renderDeliveryActions={(
                                                                    productItem
                                                                ) => {
                                                                    const productShipmentInfo =
                                                                        getShipmentInfoForProduct(
                                                                            productItem
                                                                        )
                                                                    return productShipmentInfo
                                                                        ? renderDeliveryActions(
                                                                              productItem,
                                                                              productShipmentInfo
                                                                          )
                                                                        : null
                                                                }}
                                                            />
                                                        </>
                                                    )
                                                )
                                            })()}
                                        </Box>
                                    ))}
                                </Stack>
                                <Box>
                                    {isOpen && !selectedItem.bundledProductItems && (
                                        <ProductViewModal
                                            isOpen={isOpen}
                                            onOpen={onOpen}
                                            onClose={onClose}
                                            product={selectedItem}
                                            updateCart={(variant, quantity) =>
                                                handleUpdateCart(variant, quantity)
                                            }
                                            showDeliveryOptions={false}
                                        />
                                    )}
                                    {isOpen && selectedItem.bundledProductItems && (
                                        <BundleProductViewModal
                                            isOpen={isOpen}
                                            onOpen={onOpen}
                                            onClose={onClose}
                                            product={selectedItem}
                                            updateCart={(product, quantity, childProducts) =>
                                                handleUpdateBundle(product, quantity, childProducts)
                                            }
                                            showDeliveryOptions={false}
                                        />
                                    )}
                                </Box>
                            </GridItem>
                            <GridItem>
                                <Stack spacing={4}>
                                    <OrderSummary
                                        showPromoCodeForm={true}
                                        isEstimate={true}
                                        basket={basket}
                                    />
                                    <Box display={{base: 'none', lg: 'block'}}>
                                        <CartCta />
                                    </Box>
                                </Stack>
                            </GridItem>
                        </Grid>

                        {/* Product Recommendations */}
                        <Stack spacing={16}>
                            <RecommendedProducts
                                title={
                                    <FormattedMessage
                                        defaultMessage="Recently Viewed"
                                        id="cart.recommended_products.title.recently_viewed"
                                    />
                                }
                                recommender={EINSTEIN_RECOMMENDERS.CART_RECENTLY_VIEWED}
                                mx={{base: -4, sm: -6, lg: 0}}
                            />

                            <RecommendedProducts
                                title={
                                    <FormattedMessage
                                        defaultMessage="You May Also Like"
                                        id="cart.recommended_products.title.may_also_like"
                                    />
                                }
                                recommender={EINSTEIN_RECOMMENDERS.CART_MAY_ALSO_LIKE}
                                products={basket?.productItems}
                                shouldFetch={() =>
                                    basket?.basketId && basket.productItems?.length > 0
                                }
                                mx={{base: -4, sm: -6, lg: 0}}
                            />
                        </Stack>
                    </Stack>
                </Stack>
            </Container>

            <Box
                h="130px"
                position="sticky"
                bottom={0}
                bg="white"
                display={{base: 'block', lg: 'none'}}
                align="center"
            >
                <CartCta />
            </Box>
            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={() => {
                    handleRemoveItem(selectedItem)
                }}
                onAlternateAction={() => {}}
                {...modalProps}
            />

            <UnavailableProductConfirmationModal
                productItems={basket?.productItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />

            {/* Bonus Product View Modal */}
            {bonusProductViewModal.isOpen && bonusProductViewModal.data && (
                <BonusProductViewModal
                    product={bonusProductViewModal.data.product}
                    isOpen={bonusProductViewModal.isOpen}
                    onClose={bonusProductViewModal.onClose}
                    bonusDiscountLineItemId={bonusProductViewModal.data.bonusDiscountLineItemId}
                    promotionId={bonusProductViewModal.data.promotionId}
                />
            )}
        </Box>
    )
}

Cart.getTemplateName = () => 'cart'

export default Cart
