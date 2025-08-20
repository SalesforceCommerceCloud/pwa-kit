import {useState, useEffect, useCallback, useMemo} from 'react'
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

    const availableAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return guestAddresses
        }
        return customer?.addresses || []
    }, [customer, guestAddresses])

    // Initialize address selections for registered users
    useEffect(() => {
        if (customer && !customer.isGuest && deliveryItems) {
            const initialSelected = {}

            // If there are existing shipments with addresses, try to match with customer addresses
            const existingShipments =
                basket?.shipments?.filter(
                    (shipment) =>
                        shipment.shippingAddress &&
                        !isCurrentShippingMethodPickup(shipment?.shippingMethod)
                ) || []

            if (existingShipments.length > 0) {
                // Initialize based on existing shipments using item.shipmentId
                deliveryItems.forEach((item) => {
                    const addressKey = item.itemId
                    const shipment = existingShipments.find((s) => s.shipmentId === item.shipmentId)

                    if (shipment && shipment.shippingAddress) {
                        // Try to find a matching customer address using areAddressesEqual
                        const matchingAddress = availableAddresses.find(
                            (addr) =>
                                areAddressesEqual &&
                                areAddressesEqual(addr, shipment.shippingAddress)
                        )

                        if (matchingAddress) {
                            initialSelected[addressKey] = matchingAddress.addressId
                        } else if (availableAddresses.length > 0) {
                            // Fall back to first customer address if no match found
                            initialSelected[addressKey] = availableAddresses[0].addressId
                        }
                    } else {
                        // Only set default for items that don't have a shipment assignment
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
                    // Find preferred address or use first address as default
                    const defaultAddress =
                        availableAddresses.find((addr) => addr.preferred) ||
                        availableAddresses[0]
                    if (defaultAddress) {
                        initialSelected[addressKey] = defaultAddress.addressId
                    }
                })
            }

            // Only update selectedRegisteredUserAddresses if it's empty or if we have new items that aren't selected yet
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
    }, [
        customer?.customerId,
        basket?.productItems?.length,
        availableAddresses.length,
        basket?.shipments?.length,
        deliveryItems,
        areAddressesEqual,
        isCurrentShippingMethodPickup
    ])

    // Initialize address selections for guest users
    useEffect(() => {
        if (customer && customer.isGuest && deliveryItems) {
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

                    if (shipment && !isAddressEmpty(shipment.shippingAddress)) {
                        const addressId = `guest_${shipment.shipmentId}`
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

                        // add guest address if not present
                        setGuestAddresses((prev) => {
                            const exists = prev.find((addr) => addr.addressId === addressId)
                            return exists ? prev : [...prev, address]
                        })

                        // assign to product
                        setSelectedGuestAddresses((prev) => ({
                            ...prev,
                            [addressKey]: addressId
                        }))
                    }
                })
            }
        }
    }, [customer?.isGuest, basket?.productItems?.length, basket?.shipments?.length, deliveryItems, isCurrentShippingMethodPickup])

    const selectedAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return selectedGuestAddresses
        }
        return selectedRegisteredUserAddresses
    }, [customer?.isGuest, selectedGuestAddresses, selectedRegisteredUserAddresses])

    const selectAddressForItem = useCallback((itemId, addressId) => {
        if (customer?.isGuest) {
            setSelectedGuestAddresses(prev => {
                const newState = {...prev}
                if (addressId === '') {
                    delete newState[itemId]
                } else {
                    newState[itemId] = addressId
                }
                return newState
            })
        } else {
            setSelectedRegisteredUserAddresses(prev => {
                const newState = {...prev}
                if (addressId === '') {
                    delete newState[itemId]
                } else {
                    newState[itemId] = addressId
                }
                return newState
            })
        }
    }, [customer?.isGuest])

    // Function to set addresses for multiple items (useful for initial assignment)
    const setAddressesForItems = useCallback((itemIds, addressId) => {
        if (customer?.isGuest) {
            const newState = {}
            itemIds.forEach(itemId => {
                newState[itemId] = addressId
            })
            setSelectedGuestAddresses(newState)
        } else {
            const newState = {}
            itemIds.forEach(itemId => {
                newState[itemId] = addressId
            })
            setSelectedRegisteredUserAddresses(newState)
        }
    }, [customer?.isGuest])

    const addGuestAddress = useCallback((address) => {
        const newAddress = {
            ...address,
            addressId: `guest_${nanoid()}`,
            isGuestAddress: true
        }
        setGuestAddresses(prev => [...prev, newAddress])
        return newAddress
    }, [])

    const updateGuestAddresses = useCallback((updater) => {
        setGuestAddresses(updater)
    }, [])

    // Internal functions for updating selected addresses
    const updateSelectedGuestAddresses = useCallback((updater) => {
        setSelectedGuestAddresses(updater)
    }, [])

    const updateSelectedRegisteredUserAddresses = useCallback((updater) => {
        setSelectedRegisteredUserAddresses(updater)
    }, [])

    // Check if all product items have an address selected
    const allItemsHaveAddress = useMemo(() => {
        return (deliveryItems ?? []).every((item) => {
            if (customer?.isGuest) {
                return selectedGuestAddresses[item.itemId]
            } else {
                return selectedRegisteredUserAddresses[item.itemId]
            }
        })
    }, [deliveryItems, customer?.isGuest, selectedGuestAddresses, selectedRegisteredUserAddresses])

    return {
        availableAddresses,
        selectedAddresses,
        guestAddresses,
        selectAddressForItem,
        setAddressesForItems,
        addGuestAddress,
        updateGuestAddresses,
        allItemsHaveAddress,
        isGuest: customer?.isGuest
    }
}
