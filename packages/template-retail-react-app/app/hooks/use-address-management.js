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
    
    // Track if we've already initialized addresses to prevent infinite loops
    const hasInitialized = useRef(false)

    const availableAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return guestAddresses
        }
        return customer?.addresses || []
    }, [customer, guestAddresses])

    // Initialize address selections for registered users
    useEffect(() => {
        // Only run when we have a registered customer and delivery items
        if (customer?.customerId && !customer?.isGuest && deliveryItems?.length > 0 && availableAddresses.length > 0) {
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

    // Initialize address selections for guest users
    useEffect(() => {
        // Only run once when guest user and delivery items are available
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
                        // Check if this address already exists by comparing content
                        const existingAddress = guestAddresses.find(addr => 
                            areAddressesEqual && areAddressesEqual(addr, shipment.shippingAddress)
                        )

                        if (existingAddress) {
                            // Use existing address ID
                            newSelectedAddresses[addressKey] = existingAddress.addressId
                        } else {
                            // Create new address only if it doesn't exist
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

                // Only update state if we have new addresses or selections
                if (newGuestAddresses.length > 0) {
                    setGuestAddresses(prev => {
                        // Combine existing and new addresses, then deduplicate by content
                        const allAddresses = [...prev, ...newGuestAddresses]
                        
                        // Use areAddressesEqual to keep only unique addresses
                        const uniqueAddresses = []
                        
                        allAddresses.forEach(addr => {
                            const isDuplicate = uniqueAddresses.some(existingAddr => 
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
                    setSelectedGuestAddresses(prev => ({...prev, ...newSelectedAddresses}))
                }

                // Mark as initialized to prevent running again
                hasInitialized.current = true
            }
        }
    }, [customer?.isGuest, deliveryItems?.length, basket?.shipments?.length, isCurrentShippingMethodPickup, areAddressesEqual])

    const selectedAddresses = useMemo(() => {
        if (customer?.isGuest) {
            return selectedGuestAddresses
        }
        return selectedRegisteredUserAddresses
    }, [customer?.isGuest, selectedGuestAddresses, selectedRegisteredUserAddresses])



    // Function to set addresses for items (handles both single and multiple items)
    const setAddressesForItems = useCallback((itemIds, addressId) => {
        // Handle both single item (string) and multiple items (array)
        const itemIdArray = Array.isArray(itemIds) ? itemIds : [itemIds]
        
        if (customer?.isGuest) {
            setSelectedGuestAddresses(prev => {
                const newState = {...prev}
                if (addressId === '') {
                    // Remove selections for specified items
                    itemIdArray.forEach(itemId => {
                        delete newState[itemId]
                    })
                } else {
                    // Set selections for specified items
                    itemIdArray.forEach(itemId => {
                        newState[itemId] = addressId
                    })
                }
                return newState
            })
        } else {
            setSelectedRegisteredUserAddresses(prev => {
                const newState = {...prev}
                if (addressId === '') {
                    // Remove selections for specified items
                    itemIdArray.forEach(itemId => {
                        delete newState[itemId]
                    })
                } else {
                    // Set selections for specified items
                    itemIdArray.forEach(itemId => {
                        newState[itemId] = addressId
                    })
                }
                return newState
            })
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
    
    return {
        availableAddresses,
        selectedAddresses,
        addGuestAddress,
        isGuest: customer?.isGuest,
        setAddressesForItems
    }
}
