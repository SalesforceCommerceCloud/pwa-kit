/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {nanoid} from 'nanoid'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    areAddressesEqual,
    isAddressEmpty
} from '@salesforce/retail-react-app/app/utils/address-utils'
import {isPickupMethod} from '@salesforce/retail-react-app/app/utils/shipment-utils'

/**
 * Managing address selection state with product delivery items
 */
export const useProductAddressAssignment = (basket) => {
    const {data: customer} = useCurrentCustomer()

    const deliveryItems = useMemo(() => {
        return (
            basket?.productItems?.filter((item) => {
                const shipment = basket?.shipments?.find((s) => s.shipmentId === item.shipmentId)
                return !isPickupMethod(shipment?.shippingMethod)
            }) || []
        )
    }, [basket?.productItems, basket?.shipments])

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
            customer?.isRegistered &&
            deliveryItems?.length > 0 &&
            availableAddresses.length > 0
        ) {
            const initialSelected = {}

            const existingShipments =
                basket?.shipments?.filter(
                    (shipment) =>
                        shipment.shippingAddress && !isPickupMethod(shipment?.shippingMethod)
                ) || []

            if (existingShipments.length > 0) {
                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && shipment.shippingAddress) {
                        const matchingAddress = availableAddresses.find((addr) =>
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
        deliveryItems?.length
    ])

    // initialize address selections -guest
    useEffect(() => {
        if (customer?.isGuest && deliveryItems?.length > 0 && !hasInitialized.current) {
            const existingShipments =
                basket?.shipments?.filter(
                    (shipment) =>
                        shipment.shippingAddress && !isPickupMethod(shipment?.shippingMethod)
                ) || []

            if (existingShipments.length > 0) {
                const newGuestAddresses = []
                const newSelectedAddresses = {}

                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && !isAddressEmpty(shipment.shippingAddress)) {
                        const existingAddress = [...guestAddresses, ...newGuestAddresses].find(
                            (addr) => areAddressesEqual(addr, shipment.shippingAddress)
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
                            const isDuplicate = uniqueAddresses.some((existingAddr) =>
                                areAddressesEqual(addr, existingAddr)
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
    }, [customer?.isGuest, basket?.productItems?.length, basket?.shipments?.length])

    const selectedAddresses = customer?.isGuest
        ? selectedGuestAddresses
        : selectedRegisteredUserAddresses

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

    const itemAddressMap = useMemo(() => {
        const map = {}
        deliveryItems.forEach((item) => {
            const addressId = selectedAddresses[item.itemId]
            const address = availableAddresses.find((addr) => addr.addressId === addressId)
            if (address) {
                map[item.itemId] = address
            }
        })
        return map
    }, [deliveryItems, selectedAddresses, availableAddresses])

    const allItemsHaveAddresses = useMemo(() => {
        return deliveryItems.every((item) => itemAddressMap[item.itemId])
    }, [deliveryItems, itemAddressMap])

    return {
        availableAddresses: availableAddresses || [],
        selectedAddresses: selectedAddresses || {},
        addGuestAddress,
        setAddressesForItems,
        deliveryItems: deliveryItems || [],
        allItemsHaveAddresses
    }
}
