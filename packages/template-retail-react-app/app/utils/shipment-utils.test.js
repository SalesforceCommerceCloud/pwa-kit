/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isPickupMethod,
    isPickupShipment,
    getItemsForShipment,
    findEmptyShipments,
    groupItemsByAddress,
    findExistingDeliveryShipment,
    findExistingPickupShipment,
    findUnusedDeliveryShipment,
    findDeliveryShipmentWithSameAddress,
    findShipmentToConsolidate,
    isDefaultShipmentEmpty,
    groupShipmentsByDeliveryOption
} from '@salesforce/retail-react-app/app/utils/shipment-utils'

// Mock the constants module
jest.mock('@salesforce/retail-react-app/app/constants', () => ({
    DEFAULT_SHIPMENT_ID: 'me'
}))

describe('shipment-utils', () => {
    let mockBasket

    beforeEach(() => {
        mockBasket = {
            basketId: 'test-basket',
            shipments: [
                {
                    shipmentId: 'me',
                    shippingMethod: {id: 'delivery-method', c_storePickupEnabled: false},
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
                    shippingMethod: {id: 'pickup-method', c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    shipmentId: 'shipment-3',
                    shippingMethod: {id: 'delivery-method-2', c_storePickupEnabled: false},
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

        test('should return empty array for basket without productItems', () => {
            const basketWithoutItems = {...mockBasket, productItems: null}
            expect(getItemsForShipment(basketWithoutItems, 'me')).toEqual([])
        })
    })

    describe('findEmptyShipments', () => {
        test('should return empty shipments', () => {
            // Create a basket with an empty shipment
            const basketWithEmptyShipment = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment',
                        shippingMethod: {id: 'delivery-method', c_storePickupEnabled: false}
                    }
                ]
            }

            const emptyShipments = findEmptyShipments(basketWithEmptyShipment)
            expect(emptyShipments).toHaveLength(1)
            expect(emptyShipments[0].shipmentId).toBe('empty-shipment')
        })

        test('should return empty array when all shipments have items', () => {
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

        test('should return empty array for basket without shipments property', () => {
            const basketWithoutShipmentsProperty = {basketId: 'test'}
            expect(findEmptyShipments(basketWithoutShipmentsProperty)).toEqual([])
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
            expect(groupItemsByAddress(undefined, () => ({}))).toEqual({})
            expect(groupItemsByAddress([], undefined)).toEqual({})
        })

        test('should handle items with no address', () => {
            const items = [
                {id: '1', address: {city: 'City1'}},
                {id: '2', address: null},
                {id: '3', address: {city: 'City1'}}
            ]

            const getAddressForItem = (item) => item.address

            const groups = groupItemsByAddress(items, getAddressForItem)

            expect(Object.keys(groups)).toHaveLength(1)
            expect(groups[JSON.stringify({city: 'City1'})]).toHaveLength(2)
        })

        test('should handle empty items array', () => {
            const groups = groupItemsByAddress([], (item) => item.address)
            expect(groups).toEqual({})
        })

        test('should handle function that returns undefined', () => {
            const items = [{id: '1'}, {id: '2'}]
            const getAddressForItem = () => undefined

            const groups = groupItemsByAddress(items, getAddressForItem)
            expect(groups).toEqual({})
        })
    })

    describe('findExistingDeliveryShipment', () => {
        test('should find delivery shipment', () => {
            const shipment = findExistingDeliveryShipment(mockBasket)
            expect(shipment.shipmentId).toBe('me')
        })

        test('should return null if no delivery shipment found', () => {
            const pickupOnlyBasket = {
                ...mockBasket,
                shipments: mockBasket.shipments.filter((s) => s.shipmentId === 'shipment-2')
            }
            const shipment = findExistingDeliveryShipment(pickupOnlyBasket)
            expect(shipment).toBeNull()
        })

        test('should return null for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            expect(findExistingDeliveryShipment(basketWithoutShipments)).toBeNull()
        })

        test('should return null for null/undefined basket', () => {
            expect(findExistingDeliveryShipment(null)).toBeNull()
            expect(findExistingDeliveryShipment(undefined)).toBeNull()
        })
    })

    describe('findExistingPickupShipment', () => {
        test('should find pickup shipment for specific store', () => {
            const shipment = findExistingPickupShipment(mockBasket, 'store-1')
            expect(shipment.shipmentId).toBe('shipment-2')
        })

        test('should return null if no pickup shipment found for store', () => {
            const shipment = findExistingPickupShipment(mockBasket, 'non-existent-store')
            expect(shipment).toBeNull()
        })

        test('should return null for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            expect(findExistingPickupShipment(basketWithoutShipments, 'store-1')).toBeNull()
        })

        test('should return null for null/undefined basket', () => {
            expect(findExistingPickupShipment(null, 'store-1')).toBeNull()
            expect(findExistingPickupShipment(undefined, 'store-1')).toBeNull()
        })

        test('should return null for null/undefined storeId', () => {
            expect(findExistingPickupShipment(mockBasket, null)).toBeNull()
            expect(findExistingPickupShipment(mockBasket, undefined)).toBeNull()
        })
    })

    describe('findUnusedDeliveryShipment', () => {
        test('should find unused delivery shipment', () => {
            const shipment = findUnusedDeliveryShipment(mockBasket, ['me'])
            expect(shipment.shipmentId).toBe('shipment-3')
        })

        test('should return null if all delivery shipments are used', () => {
            const shipment = findUnusedDeliveryShipment(mockBasket, ['me', 'shipment-3'])
            expect(shipment).toBeNull()
        })

        test('should return null for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            expect(findUnusedDeliveryShipment(basketWithoutShipments, [])).toBeNull()
        })

        test('should return null for null/undefined basket', () => {
            expect(findUnusedDeliveryShipment(null, [])).toBeNull()
            expect(findUnusedDeliveryShipment(undefined, [])).toBeNull()
        })

        test('should work with default empty array for usedShipmentIds', () => {
            const shipment = findUnusedDeliveryShipment(mockBasket)
            expect(shipment.shipmentId).toBe('me')
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

            const shipment = findDeliveryShipmentWithSameAddress(mockBasket, address)
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

            const shipment = findDeliveryShipmentWithSameAddress(mockBasket, address)
            expect(shipment).toBeNull()
        })

        test('should return null for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            const address = {address1: '123 Main St'}
            expect(findDeliveryShipmentWithSameAddress(basketWithoutShipments, address)).toBeNull()
        })

        test('should return null for null/undefined basket', () => {
            const address = {address1: '123 Main St'}
            expect(findDeliveryShipmentWithSameAddress(null, address)).toBeNull()
            expect(findDeliveryShipmentWithSameAddress(undefined, address)).toBeNull()
        })

        test('should return null for null/undefined address', () => {
            expect(findDeliveryShipmentWithSameAddress(mockBasket, null)).toBeNull()
            expect(findDeliveryShipmentWithSameAddress(mockBasket, undefined)).toBeNull()
        })

        test('should skip pickup shipments', () => {
            const address = {address1: '123 Main St'}
            const pickupOnlyBasket = {
                ...mockBasket,
                shipments: mockBasket.shipments.filter((s) => s.shipmentId === 'shipment-2')
            }

            const shipment = findDeliveryShipmentWithSameAddress(pickupOnlyBasket, address)
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

        test('should return null for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            expect(findShipmentToConsolidate(basketWithoutShipments)).toBeNull()
        })

        test('should return null for null/undefined basket', () => {
            expect(findShipmentToConsolidate(null)).toBeNull()
            expect(findShipmentToConsolidate(undefined)).toBeNull()
        })

        test('should return null for empty shipments array', () => {
            const basketWithEmptyShipments = {...mockBasket, shipments: []}
            expect(findShipmentToConsolidate(basketWithEmptyShipments)).toBeNull()
        })

        test('should skip empty shipments', () => {
            const basketWithEmptyShipment = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment',
                        shippingMethod: {id: 'delivery-method', c_storePickupEnabled: false}
                    }
                ]
            }

            const shipment = findShipmentToConsolidate(basketWithEmptyShipment)
            expect(shipment.shipmentId).toBe('shipment-2') // Should still find the first non-empty, non-default shipment
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

        test('should return true for basket without shipments', () => {
            const basketWithoutShipments = {...mockBasket, shipments: null}
            expect(isDefaultShipmentEmpty(basketWithoutShipments)).toBe(true)
        })

        test('should return true for null/undefined basket', () => {
            expect(isDefaultShipmentEmpty(null)).toBe(true)
            expect(isDefaultShipmentEmpty(undefined)).toBe(true)
        })

        test('should return true when basket has no productItems', () => {
            const basketWithoutItems = {
                ...mockBasket,
                productItems: null
            }
            expect(isDefaultShipmentEmpty(basketWithoutItems)).toBe(true)
        })
    })

    describe('isPickupMethod', () => {
        test('should return true for pickup shipping method', () => {
            const pickupMethod = {c_storePickupEnabled: true}
            expect(isPickupMethod(pickupMethod)).toBe(true)
        })

        test('should return false for delivery shipping method', () => {
            const deliveryMethod = {c_storePickupEnabled: false}
            expect(isPickupMethod(deliveryMethod)).toBe(false)
        })

        test('should return false for shipping method without pickup property', () => {
            const normalMethod = {id: 'standard-shipping'}
            expect(isPickupMethod(normalMethod)).toBe(false)
        })

        test('should return false for null/undefined shipping method', () => {
            expect(isPickupMethod(null)).toBe(false)
            expect(isPickupMethod(undefined)).toBe(false)
        })
    })

    describe('isPickupShipment', () => {
        test('should return true for pickup shipment', () => {
            const pickupShipment = {
                shippingMethod: {c_storePickupEnabled: true}
            }
            expect(isPickupShipment(pickupShipment)).toBe(true)
        })

        test('should return false for delivery shipment', () => {
            const deliveryShipment = {
                shippingMethod: {c_storePickupEnabled: false}
            }
            expect(isPickupShipment(deliveryShipment)).toBe(false)
        })

        test('should return false for shipment without shipping method', () => {
            const shipmentWithoutMethod = {}
            expect(isPickupShipment(shipmentWithoutMethod)).toBe(false)
        })

        test('should return false for null/undefined shipment', () => {
            expect(isPickupShipment(null)).toBe(false)
            expect(isPickupShipment(undefined)).toBe(false)
        })
    })

    describe('groupShipmentsByDeliveryOption', () => {
        test('should return empty pickupShipments array when all shipments are delivery', () => {
            const deliveryOnlyOrder = {
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'delivery-method', c_storePickupEnabled: false}
                    },
                    {
                        shipmentId: 'shipment-3',
                        shippingMethod: {id: 'delivery-method-2', c_storePickupEnabled: false}
                    }
                ]
            }

            const result = groupShipmentsByDeliveryOption(deliveryOnlyOrder)

            expect(result.pickupShipments).toHaveLength(0)
            expect(result.deliveryShipments).toHaveLength(2)
        })

        test('should return empty deliveryShipments array when all shipments are pickup', () => {
            const pickupOnlyOrder = {
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingMethod: {id: 'pickup-method', c_storePickupEnabled: true}
                    },
                    {
                        shipmentId: 'shipment-2',
                        shippingMethod: {id: 'pickup-method-2', c_storePickupEnabled: true}
                    }
                ]
            }

            const result = groupShipmentsByDeliveryOption(pickupOnlyOrder)

            expect(result.pickupShipments).toHaveLength(2)
            expect(result.deliveryShipments).toHaveLength(0)
        })

        test('should return empty arrays for null/undefined order', () => {
            expect(groupShipmentsByDeliveryOption(null)).toEqual({
                pickupShipments: [],
                deliveryShipments: []
            })
            expect(groupShipmentsByDeliveryOption(undefined)).toEqual({
                pickupShipments: [],
                deliveryShipments: []
            })
        })

        test('should correctly classify shipments with missing shipping method', () => {
            const orderWithMissingMethod = {
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingMethod: {id: 'pickup-method', c_storePickupEnabled: true}
                    },
                    {
                        shipmentId: 'shipment-2'
                        // No shippingMethod property
                    }
                ]
            }

            const result = groupShipmentsByDeliveryOption(orderWithMissingMethod)

            expect(result.pickupShipments).toHaveLength(1)
            expect(result.deliveryShipments).toHaveLength(1)
            expect(result.pickupShipments[0].shipmentId).toBe('shipment-1')
            expect(result.deliveryShipments[0].shipmentId).toBe('shipment-2')
        })

        test('should handle mixed pickupShipments and deliveryShipments shipments', () => {
            const mixedOrder = {
                shipments: [
                    {
                        shipmentId: 'delivery-1',
                        shippingMethod: {id: 'standard', c_storePickupEnabled: false}
                    },
                    {
                        shipmentId: 'pickup-1',
                        shippingMethod: {id: 'pickupShipments', c_storePickupEnabled: true}
                    },
                    {
                        shipmentId: 'delivery-2',
                        shippingMethod: {id: 'express', c_storePickupEnabled: false}
                    },
                    {
                        shipmentId: 'pickup-2',
                        shippingMethod: {id: 'pickup', c_storePickupEnabled: true}
                    }
                ]
            }

            const result = groupShipmentsByDeliveryOption(mixedOrder)

            expect(result.pickupShipments).toHaveLength(2)
            expect(result.deliveryShipments).toHaveLength(2)
            expect(result.pickupShipments[0].shipmentId).toBe('pickup-1')
            expect(result.pickupShipments[1].shipmentId).toBe('pickup-2')
            expect(result.deliveryShipments[0].shipmentId).toBe('delivery-1')
            expect(result.deliveryShipments[1].shipmentId).toBe('delivery-2')
        })
    })
})
