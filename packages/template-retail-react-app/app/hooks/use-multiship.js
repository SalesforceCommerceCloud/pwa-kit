/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import {usePickupShipment} from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'
import {useShipmentOperations} from '@salesforce/retail-react-app/app/hooks/use-shipment-operations'
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'

import {
    getItemsForShipment,
    findEmptyShipments,
    findExistingDeliveryShipment,
    findExistingPickupShipment,
    findUnusedDeliveryShipment,
    areAddressesEqual,
    findDeliveryShipmentWithSameAddress,
    findDeliveryShipmentWithoutAddress,
    findShipmentToConsolidate
} from '@salesforce/retail-react-app/app/utils/shipment-utils'

/**
 * Custom hook to handle multiship functionality for cart items
 * @param {Object} basket - The current basket object
 * @returns {Object} Object containing helper functions for multiship management
 */
export const useMultiship = (basket) => {
    const {
        isCurrentShippingMethodPickup,
        getDefaultShippingMethodId,
        getPickupShippingMethodId,
        getShippingAddressForStore,
        configureDefaultShipmentIfNeeded
    } = usePickupShipment(basket)

    const {
        createShipment: createShipmentOperation,
        removeShipment: removeShipmentOperation,
        updateShipmentAddress,
        updateShippingMethod
    } = useShipmentOperations(basket?.basketId)

    const {
        updateItemToPickupShipment,
        updateItemToDeliveryShipment,
        updateItemsToDeliveryShipment,
        updateItemsToPickupShipment,
        updateDeliveryOption: updateDeliveryOptionOperation
    } = useItemShipmentManagement(basket?.basketId)

    // Hook for shipping methods for the main shipment - we'll use this as a fallback
    //
    // TODO: Ideally we would not use the shipping methods for the main shipment on all shipments
    //
    const {refetch: refetchShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            }
        },
        {
            enabled: false // Disable automatic fetching, we'll fetch manually when needed
        }
    )

    /**
     * Assigns default shipping methods to shipments that don't have one
     * Note: Currently uses the same shipping methods as the main shipment ('me') for all shipments
     * This is a limitation due to React hooks constraints - ideally each shipment would get its own shipping methods
     * @returns {Promise<void>} Promise that resolves when all updates are complete
     */
    const assignDefaultShippingMethodsToShipments = async () => {
        if (!basket?.basketId || !basket?.shipments?.length) {
            return
        }

        // Find shipments that don't have a shipping method assigned
        const shipmentsWithoutMethod = basket.shipments.filter(
            (shipment) => !shipment.shippingMethod
        )

        if (shipmentsWithoutMethod.length === 0) {
            return
        }

        try {
            // Get shipping methods (using main shipment as reference)
            // Note: This is a limitation - all shipments will get the same options
            const {data: shippingMethods} = await refetchShippingMethods()
            const defaultShippingMethodId = getDefaultShippingMethodId(shippingMethods)

            // Update each shipment that doesn't have a shipping method
            const updatePromises = shipmentsWithoutMethod.map(async (shipment) => {
                try {
                    await updateShippingMethod(shipment.shipmentId, defaultShippingMethodId)
                } catch (error) {
                    console.error(
                        `Failed to assign shipping method to shipment ${shipment.shipmentId}:`,
                        error
                    )
                }
            })

            await Promise.all(updatePromises)
        } catch (error) {
            console.error('Failed to fetch shipping methods:', error)
        }
    }

    /**
     * Creates a new delivery shipment without a shipping method, or configures and returns the default shipment for delivery if it's empty
     * The default shipping method will be assigned later by assignDefaultShippingMethodsToShipments
     * @param {Object} basket - The basket object
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewDeliveryShipment = async (basket) => {
        // If default shipment is empty, configure it for delivery and return
        const defaultShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )
        const isDefaultShipmentEmpty =
            defaultShipment &&
            !basket.productItems?.some((item) => item.shipmentId === DEFAULT_SHIPMENT_ID)

        if (isDefaultShipmentEmpty) {
            return await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, false)
        }

        // Otherwise, create a new shipment without a shipping method
        // The assignDefaultShippingMethodsToShipments function will handle setting the default shipping method
        const newShipment = await createShipmentOperation()
        return {shipments: [newShipment]}
    }

    /**
     * Ensures a delivery shipment exists and returns it
     * Creates a new delivery shipment if none exists
     * @returns {Promise<string>} The delivery shipment ID
     */
    const findOrCreateDeliveryShipment = async () => {
        // Check if there's an existing delivery shipment
        let existingDeliveryShipment = findExistingDeliveryShipment(
            basket,
            isCurrentShippingMethodPickup
        )

        if (!existingDeliveryShipment) {
            // Create a new delivery shipment
            const newShipmentResponse = await createNewDeliveryShipment(basket)
            // Use the new shipment from the response
            existingDeliveryShipment = newShipmentResponse?.shipments?.find(
                (shipment) => !isCurrentShippingMethodPickup(shipment.shippingMethod)
            )
        }

        return existingDeliveryShipment?.shipmentId
    }

    /**
     * Ensures a pickup shipment exists for the specified store and returns it
     * Creates a new pickup shipment if none exists for the store
     * @param {Object} storeInfo - The store object containing id and inventoryId
     * @returns {Promise<string>} The pickup shipment ID
     */
    const findOrCreatePickupShipment = async (storeInfo) => {
        if (!storeInfo?.id) {
            throw new Error('No store selected for pickup')
        }

        if (!storeInfo.inventoryId) {
            throw new Error('Selected store does not have an inventory ID')
        }

        // Check if there's an existing pickup shipment for this store
        let existingPickupShipment = findExistingPickupShipment(
            basket,
            storeInfo.id,
            isCurrentShippingMethodPickup
        )

        if (!existingPickupShipment) {
            // Create a new pickup shipment for this store
            const newShipmentResponse = await createNewPickupShipment(basket, storeInfo)
            // Find the newly created pickup shipment
            existingPickupShipment = newShipmentResponse?.shipments?.find(
                (shipment) =>
                    isCurrentShippingMethodPickup(shipment.shippingMethod) &&
                    shipment.c_fromStoreId === storeInfo.id
            )
        }

        return existingPickupShipment?.shipmentId
    }

    /**
     * Creates a new pickup shipment for the specified store, or configures and returns the default shipment for pickup if it's empty
     * @param {Object} basket - The basket object
     * @param {Object} storeInfo - The store object containing id and inventoryId
     * @returns {Promise<Object>} The created shipment response
     */
    const createNewPickupShipment = async (basket, storeInfo) => {
        // If default shipment is empty, configure it for pickup and return
        const defaultShipment = basket.shipments?.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )
        const isDefaultShipmentEmpty =
            defaultShipment &&
            !basket.productItems?.some((item) => item.shipmentId === DEFAULT_SHIPMENT_ID)

        if (isDefaultShipmentEmpty) {
            return await configureDefaultShipmentIfNeeded(
                basket,
                DEFAULT_SHIPMENT_ID,
                true,
                storeInfo
            )
        }

        // Get shipping methods to determine the pickup shipping method ID
        const {data: shippingMethods} = await refetchShippingMethods()
        const pickupShippingMethodId = getPickupShippingMethodId(shippingMethods)

        if (!pickupShippingMethodId) {
            throw new Error('No pickup shipping method found')
        }

        // Create a new shipment with pickup configuration
        const newShipment = await createShipmentOperation(getShippingAddressForStore(storeInfo), {
            shippingMethodId: pickupShippingMethodId,
            storeId: storeInfo.id
        })

        return {
            shipments: [
                {
                    shipmentId: newShipment.shipmentId,
                    shippingMethod: {id: pickupShippingMethodId},
                    c_fromStoreId: storeInfo.id
                }
            ]
        }
    }

    /**
     * Creates a new delivery shipment with the specified address
     * @param {Object} basket - The basket object
     * @param {Object} address - The address to use for the shipment
     * @returns {Promise<Object>} The created shipment object
     */
    const createNewDeliveryShipmentWithAddress = async (basket, address) => {
        if (!basket?.basketId || !address) return null

        return await createShipmentOperation(address)
    }

    /**
     * Updates the delivery address for a specific shipment
     * @param {string} shipmentId - The shipment ID to update
     * @param {Object} address - The new address to set for the shipment
     * @returns {Promise<Object>} The updated basket response
     */
    const updateDeliveryAddressForShipment = async (shipmentId, address) => {
        if (!basket?.basketId || !shipmentId || !address) {
            return null
        }

        return await updateShipmentAddress(shipmentId, address)
    }

    /**
     * Updates delivery option for a product item
     * @param {Object} productItem - The product item
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} storeInfo - The selected store object (required for pickup)
     * @param {string} defaultInventoryId - The default inventory ID to use for delivery items (required)
     * @returns {Promise<void>}
     */
    const updateDeliveryOption = async (
        productItem,
        selectedPickup,
        storeInfo,
        defaultInventoryId
    ) => {
        await updateDeliveryOptionOperation(
            productItem,
            selectedPickup,
            storeInfo,
            defaultInventoryId,
            findOrCreatePickupShipment,
            findOrCreateDeliveryShipment
        )
    }

    /**
     * Fetches the appropriate shipment ID for product items based on pickup selection
     * @param {boolean} selectedPickup - Whether pickup is selected (true) or delivery is selected (false)
     * @param {Object} selectedStore - Selected store information
     * @returns {Promise<string>} The target shipment ID
     */
    const getShipmentForItems = async (selectedPickup, selectedStore) => {
        let targetShipmentId = DEFAULT_SHIPMENT_ID

        if (basket) {
            // Ensure a suitable shipment exists
            if (selectedPickup) {
                targetShipmentId = await findOrCreatePickupShipment(selectedStore)
            } else {
                targetShipmentId = await findOrCreateDeliveryShipment()
            }
        }
        return targetShipmentId
    }

    /**
     * Consolidates items from a source shipment into the default shipment
     * @param {Object} sourceShipment - The shipment to consolidate from
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if consolidation was successful
     */
    const consolidateIntoDefaultShipment = async (sourceShipment, itemsToMove) => {
        try {
            const isSourcePickup = isCurrentShippingMethodPickup(sourceShipment.shippingMethod)

            if (isSourcePickup) {
                return await consolidatePickupShipment(sourceShipment, itemsToMove)
            } else {
                return await consolidateDeliveryShipment(sourceShipment, itemsToMove)
            }
        } catch (error) {
            console.error(`Failed to consolidate shipment ${sourceShipment.shipmentId}:`, error)
            return false
        }
    }

    /**
     * Consolidates a pickup shipment into the default shipment
     * @param {Object} sourceShipment - The pickup shipment to consolidate
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if successful
     */
    const consolidatePickupShipment = async (sourceShipment, itemsToMove) => {
        const storeId = sourceShipment.c_fromStoreId
        const inventoryId = itemsToMove[0]?.inventoryId

        if (!storeId || !inventoryId) {
            console.warn('Missing store or inventory information for pickup consolidation')
            return false
        }

        const storeInfo = {id: storeId, inventoryId: inventoryId}

        await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, true, storeInfo)
        await updateItemsToPickupShipment(itemsToMove, DEFAULT_SHIPMENT_ID, inventoryId)

        return true
    }

    /**
     * Consolidates a delivery shipment into the default shipment
     * @param {Object} sourceShipment - The delivery shipment to consolidate
     * @param {Array} itemsToMove - The items to move
     * @returns {Promise<boolean>} True if successful
     */
    const consolidateDeliveryShipment = async (sourceShipment, itemsToMove) => {
        const defaultInventoryId = itemsToMove[0]?.inventoryId

        await configureDefaultShipmentIfNeeded(basket, DEFAULT_SHIPMENT_ID, false, null)
        await updateDeliveryAddressForShipment(DEFAULT_SHIPMENT_ID, sourceShipment.shippingAddress)
        await updateItemsToDeliveryShipment(itemsToMove, DEFAULT_SHIPMENT_ID, defaultInventoryId)

        return true
    }

    /**
     * Removes a shipment from the basket
     * @param {string} shipmentId - The shipment ID to remove
     * @returns {Promise<boolean>} True if removal was successful
     */
    const removeShipment = async (shipmentId) => {
        try {
            await removeShipmentOperation(shipmentId)
            return true
        } catch (error) {
            console.error(`Failed to remove shipment ${shipmentId}:`, error)
            return false
        }
    }

    /**
     * Removes multiple shipments in parallel
     * @param {Array} shipments - Array of shipments to remove
     * @returns {Promise<void>}
     */
    const removeShipmentsInParallel = async (shipments) => {
        const removalPromises = shipments.map((shipment) => removeShipment(shipment.shipmentId))
        await Promise.all(removalPromises)
    }

    /**
     * Handles consolidation when the default shipment is empty
     * @param {Object} basket - The basket object
     * @param {Array} emptyShipments - Array of empty shipments
     * @returns {Promise<string|null>} The shipment ID that was consolidated, or null
     */
    const handleDefaultShipmentConsolidation = async (basket, emptyShipments) => {
        const defaultShipment = emptyShipments.find(
            (shipment) => shipment.shipmentId === DEFAULT_SHIPMENT_ID
        )

        if (!defaultShipment) {
            return null
        }

        const sourceShipment = findShipmentToConsolidate(basket)
        if (!sourceShipment) {
            return null
        }

        const itemsToMove = getItemsForShipment(basket, sourceShipment.shipmentId)
        if (itemsToMove.length === 0) {
            return null
        }

        const consolidationSuccessful = await consolidateIntoDefaultShipment(
            sourceShipment,
            itemsToMove
        )

        if (consolidationSuccessful) {
            await removeShipment(sourceShipment.shipmentId)
            return sourceShipment.shipmentId
        }

        return null
    }

    /**
     * Removes empty shipments from the basket
     * Special handling for "me" shipment: if "me" is empty but other shipments have items,
     * transfers items to "me" and reconfigures it appropriately, then removes the original shipment
     * @returns {Promise<void>}
     */
    const removeEmptyShipments = async (basket) => {
        if (!basket?.basketId || !basket?.shipments?.length) {
            return
        }

        const emptyShipments = findEmptyShipments(basket)
        if (emptyShipments.length === 0) {
            return
        }

        // Handle default shipment consolidation first
        const consolidatedShipmentId = await handleDefaultShipmentConsolidation(
            basket,
            emptyShipments
        )

        // Remove remaining empty shipments (excluding "me" and any that were consolidated)
        const shipmentsToRemove = emptyShipments.filter((shipment) => {
            return (
                shipment.shipmentId !== DEFAULT_SHIPMENT_ID &&
                shipment.shipmentId !== consolidatedShipmentId
            )
        })

        if (shipmentsToRemove.length > 0) {
            await removeShipmentsInParallel(shipmentsToRemove)
        }
    }

    return {
        assignDefaultShippingMethodsToShipments,
        updateDeliveryOption,
        removeEmptyShipments,
        findExistingDeliveryShipment: (basket) =>
            findExistingDeliveryShipment(basket, isCurrentShippingMethodPickup),
        findExistingPickupShipment: (basket, storeId) =>
            findExistingPickupShipment(basket, storeId, isCurrentShippingMethodPickup),
        createNewDeliveryShipment,
        createNewDeliveryShipmentWithAddress,
        createNewPickupShipment,
        updateItemToDeliveryShipment,
        updateItemsToDeliveryShipment,
        updateItemToPickupShipment,
        updateItemsToPickupShipment,
        findDeliveryShipmentWithSameAddress: (basket, address) =>
            findDeliveryShipmentWithSameAddress(basket, address, isCurrentShippingMethodPickup),
        findDeliveryShipmentWithoutAddress: (basket) =>
            findDeliveryShipmentWithoutAddress(basket, isCurrentShippingMethodPickup),
        findOrCreateDeliveryShipment,
        findOrCreatePickupShipment,
        getShipmentForItems,
        findEmptyShipments,
        findShipmentToConsolidate,
        getItemsForShipment,
        findUnusedDeliveryShipment: (basket, usedShipmentIds = []) =>
            findUnusedDeliveryShipment(basket, usedShipmentIds, isCurrentShippingMethodPickup),
        updateDeliveryAddressForShipment,
        areAddressesEqual
    }
}
