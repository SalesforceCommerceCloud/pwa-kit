/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useProductAddressAssignment} from '@salesforce/retail-react-app/app/hooks/use-product-address-assignment'

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')

import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const mockUseCurrentCustomer = useCurrentCustomer

const mockBasket = {
    basketId: 'basket-1',
    productItems: [
        {itemId: 'item-1', productId: 'product-1', shipmentId: 'shipment-1'},
        {itemId: 'item-2', productId: 'product-2', shipmentId: 'shipment-2'}
    ],
    shipments: [
        {
            shipmentId: 'shipment-1',
            shippingMethod: {id: 'delivery-method-1'},
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US',
                phone: '1234567890'
            }
        },
        {
            shipmentId: 'shipment-2',
            shippingMethod: {id: 'delivery-method-2'},
            shippingAddress: {
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '456 Another St',
                city: 'Another City',
                stateCode: 'NY',
                postalCode: '67890',
                countryCode: 'US',
                phone: '0987654321'
            }
        }
    ]
}

const mockCustomer = {
    customerId: 'customer-1',
    isGuest: false,
    isRegistered: true,
    addresses: [
        {
            addressId: 'addr-1',
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Test St',
            city: 'Test City',
            stateCode: 'CA',
            postalCode: '12345',
            countryCode: 'US',
            phone: '1234567890',
            preferred: true
        },
        {
            addressId: 'addr-2',
            firstName: 'Jane',
            lastName: 'Smith',
            address1: '456 Another St',
            city: 'Another City',
            stateCode: 'NY',
            postalCode: '67890',
            countryCode: 'US',
            phone: '0987654321',
            preferred: false
        }
    ]
}

const mockGuestCustomer = {
    customerId: 'guest-1',
    isGuest: true,
    addresses: []
}

describe('useProductAddressAssignment', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false
        })
    })

    describe('deliveryItems filtering', () => {
        test('should filter out pickup shipments', () => {
            const pickupBasket = {
                ...mockBasket,
                shipments: mockBasket.shipments.map((s) => ({
                    ...s,
                    shippingMethod: {...s.shippingMethod, c_storePickupEnabled: true}
                }))
            }

            const {result} = renderHook(() => useProductAddressAssignment(pickupBasket))

            expect(result.current.deliveryItems).toHaveLength(0)
        })

        test('should include delivery shipments', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.deliveryItems).toHaveLength(2)
            expect(result.current.deliveryItems[0].itemId).toBe('item-1')
            expect(result.current.deliveryItems[1].itemId).toBe('item-2')
        })

        test('should handle empty basket', () => {
            const emptyBasket = {...mockBasket, productItems: []}
            const {result} = renderHook(() => useProductAddressAssignment(emptyBasket))

            expect(result.current.deliveryItems).toHaveLength(0)
        })
    })

    describe('availableAddresses', () => {
        test('should return customer addresses for registered users', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.availableAddresses).toHaveLength(2)
            expect(result.current.availableAddresses[0].addressId).toBe('addr-1')
            expect(result.current.availableAddresses[1].addressId).toBe('addr-2')
        })

        test('should return guest addresses for guest users from existing shipments', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.availableAddresses).toHaveLength(2)
            expect(result.current.availableAddresses[0].isGuestAddress).toBe(true)
        })
    })

    describe('registered user address initialization', () => {
        test('should initialize addresses from existing shipments', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.selectedAddresses['item-1']).toBe('addr-1')
            expect(result.current.selectedAddresses['item-2']).toBe('addr-2')
        })

        test('should fall back to preferred address when no shipment match', () => {
            const basketWithoutShipments = {
                ...mockBasket,
                shipments: []
            }

            const {result} = renderHook(() => useProductAddressAssignment(basketWithoutShipments))

            expect(result.current.selectedAddresses['item-1']).toBe('addr-1')
            expect(result.current.selectedAddresses['item-2']).toBe('addr-1')
        })

        test('should use first address when no preferred address exists', () => {
            const customerWithoutPreferred = {
                ...mockCustomer,
                addresses: mockCustomer.addresses.map((addr) => ({...addr, preferred: false}))
            }

            mockUseCurrentCustomer.mockReturnValue({
                data: customerWithoutPreferred,
                isLoading: false
            })

            const basketWithoutShipments = {
                ...mockBasket,
                shipments: []
            }

            const {result} = renderHook(() => useProductAddressAssignment(basketWithoutShipments))

            expect(result.current.selectedAddresses['item-1']).toBe('addr-1')
            expect(result.current.selectedAddresses['item-2']).toBe('addr-1')
        })
    })

    describe('guest user address initialization', () => {
        test('should initialize guest addresses from existing shipments', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.availableAddresses).toHaveLength(2)
            expect(result.current.selectedAddresses['item-1']).toMatch(/^guest_/)
            expect(result.current.selectedAddresses['item-2']).toMatch(/^guest_/)
        })

        test('should prevent duplicate guest addresses', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const basketWithDuplicateAddresses = {
                ...mockBasket,
                shipments: [
                    mockBasket.shipments[0],
                    {
                        ...mockBasket.shipments[1],
                        shippingAddress: mockBasket.shipments[0].shippingAddress
                    }
                ]
            }

            const {result} = renderHook(() =>
                useProductAddressAssignment(basketWithDuplicateAddresses)
            )

            expect(result.current.availableAddresses).toHaveLength(1)
        })

        test('should only initialize once', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const {result, rerender} = renderHook(() => useProductAddressAssignment(mockBasket))

            const initialAddressCount = result.current.availableAddresses.length

            rerender()

            expect(result.current.availableAddresses).toHaveLength(initialAddressCount)
        })

        test('should reuse same address for multiple items with identical shipping address', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            // Create a basket where both items are in the same shipment
            const basketWithSameAddress = {
                basketId: 'basket-1',
                productItems: [
                    {itemId: 'item-1', productId: 'product-1', shipmentId: 'shipment-1'},
                    {itemId: 'item-2', productId: 'product-2', shipmentId: 'shipment-1'}
                ],
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingMethod: {id: 'delivery-method-1'},
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'San Francisco',
                            stateCode: 'CA',
                            postalCode: '94105',
                            countryCode: 'US',
                            phone: '4155551234'
                        }
                    }
                ]
            }

            const {result} = renderHook(() => useProductAddressAssignment(basketWithSameAddress))

            // Should create only one address entry for both items
            expect(result.current.availableAddresses).toHaveLength(1)

            // Both items should reference the same address ID
            const addressId1 = result.current.selectedAddresses['item-1']
            const addressId2 = result.current.selectedAddresses['item-2']

            expect(addressId1).toBeDefined()
            expect(addressId2).toBeDefined()
            expect(addressId1).toBe(addressId2)

            // The address should match what was in the shipment
            const address = result.current.availableAddresses[0]
            expect(address.firstName).toBe('John')
            expect(address.lastName).toBe('Doe')
            expect(address.address1).toBe('123 Main St')

            // All items should have addresses (button should be enabled)
            expect(result.current.allItemsHaveAddresses).toBe(true)
        })
    })

    describe('addGuestAddress', () => {
        test('should add new guest address with unique ID', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            const newAddress = {
                firstName: 'New',
                lastName: 'User',
                address1: '789 New St',
                city: 'New City',
                stateCode: 'TX',
                postalCode: '55555',
                countryCode: 'US',
                phone: '5555555555'
            }

            act(() => {
                const addedAddress = result.current.addGuestAddress(newAddress)
                expect(addedAddress.addressId).toMatch(/^guest_/)
                expect(addedAddress.isGuestAddress).toBe(true)
            })

            expect(result.current.availableAddresses).toHaveLength(3)
            const addedAddress = result.current.availableAddresses.find(
                (addr) => addr.firstName === 'New'
            )
            expect(addedAddress).toBeDefined()
            expect(addedAddress.firstName).toBe('New')
        })
    })

    describe('setAddressesForItems', () => {
        test('should set addresses for registered users', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            act(() => {
                result.current.setAddressesForItems(['item-1'], 'addr-2')
            })

            expect(result.current.selectedAddresses['item-1']).toBe('addr-2')
        })

        test('should set addresses for guest users', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: mockGuestCustomer,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            act(() => {
                result.current.setAddressesForItems(['item-1'], 'guest_new')
            })

            expect(result.current.selectedAddresses['item-1']).toBe('guest_new')
        })

        test('should handle multiple items', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            act(() => {
                result.current.setAddressesForItems(['item-1', 'item-2'], 'addr-2')
            })

            expect(result.current.selectedAddresses['item-1']).toBe('addr-2')
            expect(result.current.selectedAddresses['item-2']).toBe('addr-2')
        })

        test('should clear addresses when empty string provided', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            act(() => {
                result.current.setAddressesForItems(['item-1'], '')
            })

            expect(result.current.selectedAddresses['item-1']).toBeUndefined()
        })
    })

    describe('address selection state', () => {
        test('should have selected addresses for items', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.selectedAddresses['item-1']).toBeDefined()
            expect(result.current.selectedAddresses['item-1']).toBe('addr-1')
        })

        test('should handle items without addresses', () => {
            const basketWithoutAddresses = {
                ...mockBasket,
                shipments: []
            }

            const {result} = renderHook(() => useProductAddressAssignment(basketWithoutAddresses))

            expect(result.current.selectedAddresses['item-1']).toBeDefined()
        })
    })

    describe('allItemsHaveAddresses', () => {
        test('should return true when all items have addresses', () => {
            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.allItemsHaveAddresses).toBe(true)
        })

        test('should return true when items have addresses from customer data', () => {
            const basketWithoutAddresses = {
                ...mockBasket,
                shipments: []
            }

            const {result} = renderHook(() => useProductAddressAssignment(basketWithoutAddresses))

            expect(result.current.allItemsHaveAddresses).toBe(true)
        })
    })

    describe('edge cases', () => {
        test('should handle null basket', () => {
            const {result} = renderHook(() => useProductAddressAssignment(null))

            expect(result.current.deliveryItems).toHaveLength(0)
            expect(result.current.availableAddresses).toHaveLength(2)
            expect(result.current.selectedAddresses).toEqual({})
            expect(result.current.allItemsHaveAddresses).toBe(true)
        })

        test('should handle undefined customer', () => {
            mockUseCurrentCustomer.mockReturnValue({
                data: undefined,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.availableAddresses).toHaveLength(0)
        })

        test('should handle empty addresses array', () => {
            const customerWithoutAddresses = {
                ...mockCustomer,
                addresses: []
            }

            mockUseCurrentCustomer.mockReturnValue({
                data: customerWithoutAddresses,
                isLoading: false
            })

            const {result} = renderHook(() => useProductAddressAssignment(mockBasket))

            expect(result.current.availableAddresses).toHaveLength(0)
            expect(result.current.allItemsHaveAddresses).toBe(false)
        })
    })
})
