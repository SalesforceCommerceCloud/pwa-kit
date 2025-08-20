/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getItemsForShipment,
    findEmptyShipments,
    groupItemsByAddress,
    findExistingDeliveryShipment,
    findExistingPickupShipment,
    findUnusedDeliveryShipment,
    areAddressesEqual,
    cleanAddressForOrder,
    findDeliveryShipmentWithSameAddress,
    findDeliveryShipmentWithoutAddress,
    findShipmentToConsolidate,
    isDefaultShipmentEmpty
} from '@salesforce/retail-react-app/app/utils/shipment-utils'

// Mock the address-utils module
jest.mock('@salesforce/retail-react-app/app/utils/address-utils', () => ({
    isAddressEmpty: jest.fn()
}))

// Mock the constants module
jest.mock('@salesforce/retail-react-app/app/constants', () => ({
    DEFAULT_SHIPMENT_ID: 'me'
}))

describe('shipment-utils', () => {
    let mockBasket
    let mockIsPickupMethod

    beforeEach(() => {
        mockBasket = {
            basketId: 'test-basket',
            shipments: [
                {
                    shipmentId: 'me',
                    shippingMethod: {id: 'delivery-method'},
                    shippingAddress: {
                        address1: '123 Main St',
                        city: 'Test City',
                        stateCode: 'CA',
                        postalCode: '12345',
                        countryCode: 'US'
                    }
                },
                {
                    shipmentId: 'shipment-2',
                    shippingMethod: {id: 'pickup-method'},
                    c_fromStoreId: 'store-1'
                },
                {
                    shipmentId: 'shipment-3',
                    shippingMethod: {id: 'delivery-method-2'},
                    shippingAddress: null
                }
            ],
            productItems: [
                {productId: 'prod-1', shipmentId: 'me'},
                {productId: 'prod-2', shipmentId: 'me'},
                {productId: 'prod-3', shipmentId: 'shipment-2'},
                {productId: 'prod-4', shipmentId: 'shipment-3'}
            ]
        }

        mockIsPickupMethod = jest.fn((shippingMethod) => {
            return shippingMethod?.id === 'pickup-method'
        })

        // Mock isAddressEmpty to return false by default
        const {isAddressEmpty} = jest.requireMock(
            '@salesforce/retail-react-app/app/utils/address-utils'
        )
        isAddressEmpty.mockReturnValue(false)
    })

    describe('getItemsForShipment', () => {
        test('should return items for a specific shipment', () => {
            const items = getItemsForShipment(mockBasket, 'me')
            expect(items).toHaveLength(2)
            expect(items[0].productId).toBe('prod-1')
            expect(items[1].productId).toBe('prod-2')
        })

        test('should return empty array for non-existent shipment', () => {
            const items = getItemsForShipment(mockBasket, 'non-existent')
            expect(items).toHaveLength(0)
        })

        test('should return empty array for null/undefined inputs', () => {
            expect(getItemsForShipment(null, 'me')).toEqual([])
            expect(getItemsForShipment(mockBasket, null)).toEqual([])
            expect(getItemsForShipment(undefined, 'me')).toEqual([])
        })
    })

    describe('findEmptyShipments', () => {
        test('should return empty shipments', () => {
            const emptyShipments = findEmptyShipments(mockBasket)
            expect(emptyShipments).toHaveLength(0) // All shipments have items in this case
        })

        test('should return empty array for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: []}
            const emptyShipments = findEmptyShipments(basketWithoutShipments)
            expect(emptyShipments).toEqual([])
        })

        test('should return empty array for null/undefined basket', () => {
            expect(findEmptyShipments(null)).toEqual([])
            expect(findEmptyShipments(undefined)).toEqual([])
        })
    })

    describe('groupItemsByAddress', () => {
        test('should group items by address', () => {
            const items = [
                {id: '1', address: {city: 'City1'}},
                {id: '2', address: {city: 'City1'}},
                {id: '3', address: {city: 'City2'}}
            ]

            const getAddressForItem = (item) => item.address

            const groups = groupItemsByAddress(items, getAddressForItem)

            expect(Object.keys(groups)).toHaveLength(2)
            expect(groups[JSON.stringify({city: 'City1'})]).toHaveLength(2)
            expect(groups[JSON.stringify({city: 'City2'})]).toHaveLength(1)
        })

        test('should return empty object for invalid inputs', () => {
            expect(groupItemsByAddress(null, () => ({}))).toEqual({})
            expect(groupItemsByAddress([], null)).toEqual({})
        })
    })

    describe('findExistingDeliveryShipment', () => {
        test('should find delivery shipment', () => {
            const shipment = findExistingDeliveryShipment(mockBasket, mockIsPickupMethod)
            expect(shipment.shipmentId).toBe('me')
        })

        test('should return null if no delivery shipment found', () => {
            const pickupOnlyBasket = {
                ...mockBasket,
                shipments: mockBasket.shipments.filter((s) => s.shipmentId === 'shipment-2')
            }
            const shipment = findExistingDeliveryShipment(pickupOnlyBasket, mockIsPickupMethod)
            expect(shipment).toBeNull()
        })
    })

    describe('findExistingPickupShipment', () => {
        test('should find pickup shipment for specific store', () => {
            const shipment = findExistingPickupShipment(mockBasket, 'store-1', mockIsPickupMethod)
            expect(shipment.shipmentId).toBe('shipment-2')
        })

        test('should return null if no pickup shipment found for store', () => {
            const shipment = findExistingPickupShipment(
                mockBasket,
                'non-existent-store',
                mockIsPickupMethod
            )
            expect(shipment).toBeNull()
        })
    })

    describe('findUnusedDeliveryShipment', () => {
        test('should find unused delivery shipment', () => {
            const shipment = findUnusedDeliveryShipment(mockBasket, ['me'], mockIsPickupMethod)
            expect(shipment.shipmentId).toBe('shipment-3')
        })

        test('should return null if all delivery shipments are used', () => {
            const shipment = findUnusedDeliveryShipment(
                mockBasket,
                ['me', 'shipment-3'],
                mockIsPickupMethod
            )
            expect(shipment).toBeNull()
        })
    })

    describe('areAddressesEqual', () => {
        test('should return true for identical addresses', () => {
            const address1 = {
                address1: '123 Main St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US'
            }
            const address2 = {...address1}

            expect(areAddressesEqual(address1, address2)).toBe(true)
        })

        test('should return false for different addresses', () => {
            const address1 = {
                address1: '123 Main St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US'
            }
            const address2 = {
                address1: '456 Oak St',
                city: 'Other City',
                stateCode: 'NY',
                postalCode: '67890',
                countryCode: 'US'
            }

            expect(areAddressesEqual(address1, address2)).toBe(false)
        })

        test('should handle null/undefined values', () => {
            const address1 = {
                address1: '123 Main St',
                city: 'Test City',
                stateCode: null,
                postalCode: undefined,
                countryCode: 'US'
            }
            const address2 = {
                address1: '123 Main St',
                city: 'Test City',
                stateCode: '',
                postalCode: '',
                countryCode: 'US'
            }

            expect(areAddressesEqual(address1, address2)).toBe(true)
        })
    })

    describe('cleanAddressForOrder', () => {
        test('should clean address object', () => {
            const dirtyAddress = {
                address1: '123 Main St',
                city: 'Test City',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '123-456-7890',
                postalCode: '12345',
                stateCode: 'CA',
                extraField: 'should be removed'
            }

            const cleanAddress = cleanAddressForOrder(dirtyAddress)

            expect(cleanAddress).toEqual({
                address1: '123 Main St',
                city: 'Test City',
                countryCode: 'US',
                firstName: 'John',
                lastName: 'Doe',
                phone: '123-456-7890',
                postalCode: '12345',
                stateCode: 'CA'
            })
            expect(cleanAddress.extraField).toBeUndefined()
        })

        test('should return null for null/undefined address', () => {
            expect(cleanAddressForOrder(null)).toBeNull()
            expect(cleanAddressForOrder(undefined)).toBeNull()
        })
    })

    describe('findDeliveryShipmentWithSameAddress', () => {
        test('should find shipment with matching address', () => {
            const address = {
                address1: '123 Main St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US'
            }

            const shipment = findDeliveryShipmentWithSameAddress(
                mockBasket,
                address,
                mockIsPickupMethod
            )
            expect(shipment.shipmentId).toBe('me')
        })

        test('should return null if no matching address found', () => {
            const address = {
                address1: '456 Oak St',
                city: 'Other City',
                stateCode: 'NY',
                postalCode: '67890',
                countryCode: 'US'
            }

            const shipment = findDeliveryShipmentWithSameAddress(
                mockBasket,
                address,
                mockIsPickupMethod
            )
            expect(shipment).toBeNull()
        })
    })

    describe('findDeliveryShipmentWithoutAddress', () => {
        test('should find shipment without address', () => {
            const shipment = findDeliveryShipmentWithoutAddress(mockBasket, mockIsPickupMethod)
            expect(shipment.shipmentId).toBe('shipment-3')
        })

        test('should return null if all shipments have addresses', () => {
            const basketWithAddresses = {
                ...mockBasket,
                shipments: mockBasket.shipments.map((s) => ({
                    ...s,
                    shippingAddress: {address1: '123 Main St'}
                }))
            }

            const shipment = findDeliveryShipmentWithoutAddress(
                basketWithAddresses,
                mockIsPickupMethod
            )
            expect(shipment).toBeNull()
        })
    })

    describe('findShipmentToConsolidate', () => {
        test('should find shipment to consolidate', () => {
            const shipment = findShipmentToConsolidate(mockBasket)
            expect(shipment.shipmentId).toBe('shipment-2')
        })

        test('should return null if no shipment to consolidate', () => {
            const basketWithOnlyDefault = {
                ...mockBasket,
                shipments: mockBasket.shipments.filter((s) => s.shipmentId === 'me'),
                productItems: mockBasket.productItems.filter((item) => item.shipmentId === 'me')
            }

            const shipment = findShipmentToConsolidate(basketWithOnlyDefault)
            expect(shipment).toBeNull()
        })
    })

    describe('isDefaultShipmentEmpty', () => {
        test('should return false when default shipment has items', () => {
            expect(isDefaultShipmentEmpty(mockBasket)).toBe(false)
        })

        test('should return true when default shipment is empty', () => {
            const basketWithEmptyDefault = {
                ...mockBasket,
                productItems: mockBasket.productItems.filter((item) => item.shipmentId !== 'me')
            }

            expect(isDefaultShipmentEmpty(basketWithEmptyDefault)).toBe(true)
        })

        test('should return true when no default shipment exists', () => {
            const basketWithoutDefault = {
                ...mockBasket,
                shipments: mockBasket.shipments.filter((s) => s.shipmentId !== 'me')
            }

            expect(isDefaultShipmentEmpty(basketWithoutDefault)).toBe(true)
        })
    })
})
