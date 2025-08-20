/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {nanoid} from 'nanoid'
import {useCurrentCustomer} from './use-current-customer'
import {usePickupShipment} from './use-pickup-shipment'
import {useMultiship} from './use-multiship'
import {isAddressEmpty} from '../utils/address-utils'

/**
 * Managing address selection state
 */
export const useAddressManagement = (basket, deliveryItems) => {
    const {data: customer} = useCurrentCustomer()
    const {isCurrentShippingMethodPickup} = usePickupShipment(basket)
    const {areAddressesEqual} = useMultiship(basket)

    const [guestAddresses, setGuestAddresses] = useState([])
    const [selectedGuestAddresses, setSelectedGuestAddresses] = useState({})
    const [selectedRegisteredUserAddresses, setSelectedRegisteredUserAddresses] = useState({})

    // track if already initialized addresses to prevent infinite loops
    const hasInitialized = useRef(false)

    const availableAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return guestAddresses
        }
        return customer?.addresses || []
    }, [customer, guestAddresses])

    // initialize address selections -registered users
    useEffect(() => {
        if (
            customer?.customerId &&
            !customer?.isGuest &&
            deliveryItems?.length > 0 &&
            availableAddresses.length > 0
        ) {
            const initialSelected = {}

            const existingShipments =
                basket?.shipments?.filter(
                    (shipment) =>
                        shipment.shippingAddress &&
                        !isCurrentShippingMethodPickup(shipment?.shippingMethod)
                ) || []

            if (existingShipments.length > 0) {
                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && shipment.shippingAddress) {
                        const matchingAddress = availableAddresses.find(
                            (addr) =>
                                areAddressesEqual &&
                                areAddressesEqual(addr, shipment.shippingAddress)
                        )

                        if (matchingAddress) {
                            initialSelected[addressKey] = matchingAddress.addressId
                        } else if (availableAddresses.length > 0) {
                            // fall back to first customer address if no match
                            initialSelected[addressKey] = availableAddresses[0].addressId
                        }
                    } else {
                        // set default for items that don't have a address assignment yet
                        if (availableAddresses.length > 0) {
                            const defaultAddress =
                                availableAddresses.find((addr) => addr.preferred) ||
                                availableAddresses[0]
                            if (defaultAddress) {
                                initialSelected[addressKey] = defaultAddress.addressId
                            }
                        }
                    }
                })
            } else if (availableAddresses.length > 0) {
                // Fall back to customer addresses if no existing shipments
                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    // preferred address or use first address as default
                    const defaultAddress =
                        availableAddresses.find((addr) => addr.preferred) || availableAddresses[0]
                    if (defaultAddress) {
                        initialSelected[addressKey] = defaultAddress.addressId
                    }
                })
            }

            // Only update if we have new selections and they're different from current
            if (Object.keys(initialSelected).length > 0) {
                setSelectedRegisteredUserAddresses((prev) => {
                    const newState = {...prev}
                    let hasChanges = false

                    deliveryItems.forEach((item) => {
                        const addressKey = item.itemId
                        if (!prev[addressKey] && initialSelected[addressKey]) {
                            newState[addressKey] = initialSelected[addressKey]
                            hasChanges = true
                        }
                    })

                    return hasChanges ? newState : prev
                })
            }
        }
    }, [
        customer?.customerId,
        customer?.isGuest,
        availableAddresses.length,
        basket?.shipments?.length,
        deliveryItems?.length,
        areAddressesEqual,
        isCurrentShippingMethodPickup
    ])

    // initialize address selections -guest
    useEffect(() => {
        if (customer?.isGuest && deliveryItems?.length > 0 && !hasInitialized.current) {
            const existingShipments =
                basket?.shipments?.filter(
                    (shipment) =>
                        shipment.shippingAddress &&
                        !isCurrentShippingMethodPickup(shipment?.shippingMethod)
                ) || []

            if (existingShipments.length > 0) {
                const newGuestAddresses = []
                const newSelectedAddresses = {}

                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && !isAddressEmpty(shipment.shippingAddress)) {
                        const existingAddress = guestAddresses.find(
                            (addr) =>
                                areAddressesEqual &&
                                areAddressesEqual(addr, shipment.shippingAddress)
                        )

                        if (existingAddress) {
                            newSelectedAddresses[addressKey] = existingAddress.addressId
                        } else {
                            const addressId = `guest_${item.itemId}`
                            const address = {
                                addressId,
                                firstName: shipment.shippingAddress.firstName,
                                lastName: shipment.shippingAddress.lastName,
                                address1: shipment.shippingAddress.address1,
                                city: shipment.shippingAddress.city,
                                stateCode: shipment.shippingAddress.stateCode,
                                postalCode: shipment.shippingAddress.postalCode,
                                countryCode: shipment.shippingAddress.countryCode,
                                phone: shipment.shippingAddress.phone,
                                isGuestAddress: true,
                                originalShipmentId: shipment.shipmentId
                            }

                            newGuestAddresses.push(address)
                            newSelectedAddresses[addressKey] = addressId
                        }
                    }
                })

                // update state if we have new addresses/selections
                if (newGuestAddresses.length > 0) {
                    setGuestAddresses((prev) => {
                        const allAddresses = [...prev, ...newGuestAddresses]
                        const uniqueAddresses = []

                        allAddresses.forEach((addr) => {
                            const isDuplicate = uniqueAddresses.some(
                                (existingAddr) =>
                                    areAddressesEqual && areAddressesEqual(addr, existingAddr)
                            )

                            if (!isDuplicate) {
                                uniqueAddresses.push(addr)
                            }
                        })

                        return uniqueAddresses
                    })
                }
                if (Object.keys(newSelectedAddresses).length > 0) {
                    setSelectedGuestAddresses((prev) => ({...prev, ...newSelectedAddresses}))
                }
                hasInitialized.current = true
            }
        }
    }, [
        customer?.isGuest,
        deliveryItems?.length,
        basket?.shipments?.length,
        isCurrentShippingMethodPickup,
        areAddressesEqual
    ])

    const selectedAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return selectedGuestAddresses
        }
        return selectedRegisteredUserAddresses
    }, [customer?.isGuest, selectedGuestAddresses, selectedRegisteredUserAddresses])

    const setAddressesForItems = useCallback(
        (itemIds, addressId) => {
            const itemIdArray = Array.isArray(itemIds) ? itemIds : [itemIds]

            if (customer?.isGuest) {
                setSelectedGuestAddresses((prev) => {
                    const newState = {...prev}
                    if (addressId === '') {
                        // Remove selections for specified items
                        itemIdArray.forEach((itemId) => {
                            delete newState[itemId]
                        })
                    } else {
                        // Set selections for specified items
                        itemIdArray.forEach((itemId) => {
                            newState[itemId] = addressId
                        })
                    }
                    return newState
                })
            } else {
                setSelectedRegisteredUserAddresses((prev) => {
                    const newState = {...prev}
                    if (addressId === '') {
                        // Remove selections for specified items
                        itemIdArray.forEach((itemId) => {
                            delete newState[itemId]
                        })
                    } else {
                        // Set selections for specified items
                        itemIdArray.forEach((itemId) => {
                            newState[itemId] = addressId
                        })
                    }
                    return newState
                })
            }
        },
        [customer?.isGuest]
    )

    const addGuestAddress = useCallback((address) => {
        const newAddress = {
            ...address,
            addressId: `guest_${nanoid()}`,
            isGuestAddress: true
        }
        setGuestAddresses((prev) => [...prev, newAddress])
        return newAddress
    }, [])

    return {
        availableAddresses,
        selectedAddresses,
        addGuestAddress,
        isGuest: customer?.isGuest,
        setAddressesForItems
    }
}
