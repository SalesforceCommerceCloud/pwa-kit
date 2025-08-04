/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn(),
    useShippingMethodsForShipment: jest.fn()
}))

jest.mock('./use-pickup-shipment', () => ({
    usePickupShipment: jest.fn()
}))

import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'
import {usePickupShipment} from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'

describe('useMultiship', () => {
    // Mock functions for mutations
    const mockUpdateItemInBasket = jest.fn()
    const mockCreateShipmentForBasket = jest.fn()
    const mockRemoveShipmentFromBasket = jest.fn()
    const mockUpdateShippingMethodForShipment = jest.fn()
    const mockRefetchShippingMethods = jest.fn()
    const mockUpdateItemsInBasket = jest.fn()
    const mockUpdateShipmentForBasket = jest.fn()

    // Mock functions for pickup shipment
    const mockIsCurrentShippingMethodPickup = jest.fn()
    const mockGetDefaultShippingMethodId = jest.fn()
    const mockGetPickupShippingMethodId = jest.fn()
    const mockConfigureDefaultShipmentIfNeeded = jest.fn()

    // Mock data
    const mockBasket = {
        basketId: 'test-basket-id',
        shipments: [
            {
                shipmentId: 'me',
                shippingMethod: {
                    id: 'default-shipping-method',
                    name: 'Default Shipping'
                }
            }
        ],
        productItems: [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1,
                shipmentId: 'me'
            }
        ]
    }

    const mockShippingMethods = {
        applicableShippingMethods: [
            {
                id: 'default-shipping-method',
                name: 'Default Shipping',
                c_storePickupEnabled: false
            },
            {
                id: 'pickup-shipping-method',
                name: 'Pickup in Store',
                c_storePickupEnabled: true
            }
        ]
    }

    const mockStoreInfo = {
        id: 'store-1',
        inventoryId: 'inventory-1',
        name: 'Test Store'
    }

    const mockDefaultInventoryId = 'default-inventory-id'

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup mutation mocks
        useShopperBasketsMutation.mockImplementation((operation) => {
            switch (operation) {
                case 'updateItemInBasket':
                    return {mutateAsync: mockUpdateItemInBasket}
                case 'createShipmentForBasket':
                    return {mutateAsync: mockCreateShipmentForBasket}
                case 'removeShipmentFromBasket':
                    return {mutateAsync: mockRemoveShipmentFromBasket}
                case 'updateShippingMethodForShipment':
                    return {mutateAsync: mockUpdateShippingMethodForShipment}
                case 'updateItemsInBasket':
                    return {mutateAsync: mockUpdateItemsInBasket}
                case 'updateShipmentForBasket':
                    return {mutateAsync: mockUpdateShipmentForBasket}
                default:
                    return {mutateAsync: jest.fn()}
            }
        })

        // Setup shipping methods hook mock
        useShippingMethodsForShipment.mockReturnValue({
            refetch: mockRefetchShippingMethods
        })

        // Setup pickup shipment hook mock
        usePickupShipment.mockReturnValue({
            isCurrentShippingMethodPickup: mockIsCurrentShippingMethodPickup,
            getDefaultShippingMethodId: mockGetDefaultShippingMethodId,
            getPickupShippingMethodId: mockGetPickupShippingMethodId,
            configureDefaultShipmentIfNeeded: mockConfigureDefaultShipmentIfNeeded
        })

        // Default mock return values
        mockRefetchShippingMethods.mockResolvedValue({data: mockShippingMethods})
        mockGetDefaultShippingMethodId.mockReturnValue('default-shipping-method')
        mockGetPickupShippingMethodId.mockReturnValue('pickup-shipping-method')
        mockIsCurrentShippingMethodPickup.mockReturnValue(false)
        mockConfigureDefaultShipmentIfNeeded.mockResolvedValue()
        mockUpdateItemsInBasket.mockResolvedValue({basketId: 'test-basket-id'})
        mockUpdateItemInBasket.mockResolvedValue({basketId: 'test-basket-id'})
        mockCreateShipmentForBasket.mockResolvedValue({basketId: 'test-basket-id', shipments: []})
        mockRemoveShipmentFromBasket.mockResolvedValue({basketId: 'test-basket-id'})
        mockUpdateShippingMethodForShipment.mockResolvedValue({basketId: 'test-basket-id'})
        mockUpdateShipmentForBasket.mockResolvedValue({basketId: 'test-basket-id'})
    })

    describe('initialization', () => {
        test('should initialize with correct functions', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            expect(result.current).toHaveProperty('assignDefaultShippingMethodsToShipments')
            expect(result.current).toHaveProperty('handleDeliveryOptionChange')
            expect(result.current).toHaveProperty('removeEmptyShipments')
            expect(result.current).toHaveProperty('findExistingDeliveryShipment')
            expect(result.current).toHaveProperty('findExistingPickupShipment')
            expect(result.current).toHaveProperty('createNewDeliveryShipment')
            expect(result.current).toHaveProperty('createNewPickupShipment')
            expect(result.current).toHaveProperty('moveItemToDeliveryShipment')
            expect(result.current).toHaveProperty('moveItemsToDeliveryShipment')
            expect(result.current).toHaveProperty('moveItemToPickupShipment')
            expect(result.current).toHaveProperty('moveItemsToPickupShipment')
            expect(result.current).toHaveProperty('findOrCreateDeliveryShipment')
            expect(result.current).toHaveProperty('findOrCreatePickupShipment')
            expect(result.current).toHaveProperty('getShipmentForItems')
            expect(result.current).toHaveProperty('findEmptyShipments')
            expect(result.current).toHaveProperty('findShipmentToConsolidate')
            expect(result.current).toHaveProperty('getItemsForShipment')
            expect(result.current).toHaveProperty('changeStoreForPickupShipment')
            expect(result.current).toHaveProperty('findDeliveryShipmentWithSameAddress')
            expect(result.current).toHaveProperty('createNewDeliveryShipmentWithAddress')
            expect(result.current).toHaveProperty('findUnusedDeliveryShipment')
            expect(result.current).toHaveProperty('updateDeliveryAddressForShipment')
        })

        test('should handle null basket', () => {
            const {result} = renderHook(() => useMultiship(null))
            expect(result.current).toBeTruthy()
        })
    })

    describe('Pure Helper Functions', () => {
        describe('findEmptyShipments', () => {
            test('should identify shipments with no product items', () => {
                const basketWithEmptyShipments = {
                    ...mockBasket,
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'empty-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))
                const emptyShipments = result.current.findEmptyShipments(basketWithEmptyShipments)

                expect(emptyShipments).toHaveLength(1)
                expect(emptyShipments[0].shipmentId).toBe('empty-shipment')
            })

            test('should return empty array when no shipments exist', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const emptyShipments = result.current.findEmptyShipments({
                    basketId: 'test',
                    shipments: []
                })

                expect(emptyShipments).toEqual([])
            })

            test('should return empty array when basket is null', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const emptyShipments = result.current.findEmptyShipments(null)

                expect(emptyShipments).toEqual([])
            })
        })

        describe('findShipmentToConsolidate', () => {
            test('should find first non-default shipment with items', () => {
                const basketWithMultipleShipments = {
                    ...mockBasket,
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'other-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        ...mockBasket.productItems,
                        {
                            itemId: 'item-2',
                            productId: 'product-2',
                            quantity: 1,
                            shipmentId: 'other-shipment'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithMultipleShipments))
                const shipment = result.current.findShipmentToConsolidate(
                    basketWithMultipleShipments
                )

                expect(shipment).toBeDefined()
                expect(shipment.shipmentId).toBe('other-shipment')
            })

            test('should return null when only default shipment has items', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const shipment = result.current.findShipmentToConsolidate(mockBasket)

                expect(shipment).toBeNull()
            })

            test('should return null when basket is null', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const shipment = result.current.findShipmentToConsolidate(null)

                expect(shipment).toBeNull()
            })
        })

        describe('getItemsForShipment', () => {
            test('should return items belonging to specified shipment', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(mockBasket, 'me')

                expect(items).toHaveLength(1)
                expect(items[0].itemId).toBe('item-1')
                expect(items[0].shipmentId).toBe('me')
            })

            test('should return empty array for shipment with no items', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(mockBasket, 'non-existent')

                expect(items).toEqual([])
            })

            test('should handle null basket gracefully', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(null, 'me')

                expect(items).toEqual([])
            })
        })
    })

    describe('Address Helper Functions', () => {
        describe('areAddressesEqual', () => {
            test('should return true for identical addresses', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address1 = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const address2 = {...address1}

                // Access the function through the hook's internal methods
                const hookInstance = result.current
                // Since areAddressesEqual is not exposed, we'll test it indirectly through findDeliveryShipmentWithSameAddress
                const basketWithAddress = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'test-shipment',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: address1
                        }
                    ]
                }

                const foundShipmentId = hookInstance.findDeliveryShipmentWithSameAddress(
                    basketWithAddress,
                    address2
                )
                expect(foundShipmentId).toBe('test-shipment')
            })

            test('should return false for different addresses', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address1 = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const address2 = {
                    ...address1,
                    city: 'Los Angeles'
                }

                const basketWithAddress = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'test-shipment',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: address1
                        }
                    ]
                }

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    basketWithAddress,
                    address2
                )
                expect(foundShipmentId).toBeUndefined()
            })

            test('should handle null/undefined values as empty strings', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address1 = {
                    address1: '123 Main St',
                    city: null,
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const address2 = {
                    address1: '123 Main St',
                    city: '',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }

                const basketWithAddress = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'test-shipment',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: address1
                        }
                    ]
                }

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    basketWithAddress,
                    address2
                )
                expect(foundShipmentId).toBe('test-shipment')
            })
        })

        describe('findDeliveryShipmentWithSameAddress', () => {
            test('should find delivery shipment with matching address', () => {
                const address = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const basketWithAddress = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'delivery-1',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: address
                        },
                        {
                            shipmentId: 'pickup-1',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            shippingAddress: address,
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                const {result} = renderHook(() => useMultiship(basketWithAddress))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    basketWithAddress,
                    address
                )
                expect(foundShipmentId).toBe('delivery-1')
            })

            test('should return null if no matching address found', () => {
                const address = {
                    address1: '456 Oak St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const {result} = renderHook(() => useMultiship(mockBasket))

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    mockBasket,
                    address
                )
                expect(foundShipmentId).toBeUndefined()
            })

            test('should return null if basket is null', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address = {address1: '123 Main St'}

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    null,
                    address
                )
                expect(foundShipmentId).toBeNull()
            })

            test('should skip pickup shipments', () => {
                const address = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US'
                }
                const basketWithPickupOnly = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'pickup-1',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            shippingAddress: address,
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                const {result} = renderHook(() => useMultiship(basketWithPickupOnly))

                mockIsCurrentShippingMethodPickup.mockReturnValue(true)

                const foundShipmentId = result.current.findDeliveryShipmentWithSameAddress(
                    basketWithPickupOnly,
                    address
                )
                expect(foundShipmentId).toBeUndefined()
            })
        })
    })

    describe('Shipment Address Management', () => {
        describe('createNewDeliveryShipmentWithAddress', () => {
            test('should create new delivery shipment with address', async () => {
                const address = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '415-555-1234'
                }

                const mockResponse = {
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'new-delivery-shipment',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: address
                        }
                    ]
                }

                mockCreateShipmentForBasket.mockResolvedValue(mockResponse)
                const {result} = renderHook(() => useMultiship(mockBasket))

                await act(async () => {
                    const shipmentId = await result.current.createNewDeliveryShipmentWithAddress(
                        mockBasket,
                        address
                    )
                    expect(shipmentId).toBe('new-delivery-shipment')
                })

                expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: {
                        shippingAddress: {
                            address1: address.address1,
                            city: address.city,
                            countryCode: address.countryCode,
                            firstName: address.firstName,
                            lastName: address.lastName,
                            phone: address.phone,
                            postalCode: address.postalCode,
                            stateCode: address.stateCode
                        }
                    }
                })
            })

            test('should return null if basket is invalid', async () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address = {address1: '123 Main St'}

                await act(async () => {
                    const shipmentId = await result.current.createNewDeliveryShipmentWithAddress(
                        null,
                        address
                    )
                    expect(shipmentId).toBeNull()
                })

                expect(mockCreateShipmentForBasket).not.toHaveBeenCalled()
            })

            test('should handle addresses with extra fields', async () => {
                const addressWithExtraFields = {
                    address1: '123 Main St',
                    city: 'San Francisco',
                    stateCode: 'CA',
                    postalCode: '94105',
                    countryCode: 'US',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '415-555-1234',
                    // Extra fields that should be filtered out
                    addressId: 'addr-123',
                    creationDate: '2024-01-01'
                }

                const mockResponse = {
                    shipments: [
                        {
                            shipmentId: 'new-shipment',
                            shippingMethod: {id: 'default-shipping-method'},
                            shippingAddress: {
                                address1: addressWithExtraFields.address1,
                                city: addressWithExtraFields.city,
                                stateCode: addressWithExtraFields.stateCode,
                                postalCode: addressWithExtraFields.postalCode,
                                countryCode: addressWithExtraFields.countryCode,
                                firstName: addressWithExtraFields.firstName,
                                lastName: addressWithExtraFields.lastName,
                                phone: addressWithExtraFields.phone
                            }
                        }
                    ]
                }

                mockCreateShipmentForBasket.mockResolvedValue(mockResponse)
                const {result} = renderHook(() => useMultiship(mockBasket))

                await act(async () => {
                    await result.current.createNewDeliveryShipmentWithAddress(
                        mockBasket,
                        addressWithExtraFields
                    )
                })

                const calledBody = mockCreateShipmentForBasket.mock.calls[0][0].body
                expect(calledBody.shippingAddress).not.toHaveProperty('addressId')
                expect(calledBody.shippingAddress).not.toHaveProperty('creationDate')
            })
        })

        describe('updateDeliveryAddressForShipment', () => {
            test('should update delivery address for shipment', async () => {
                const address = {
                    address1: '456 Oak St',
                    city: 'Los Angeles',
                    stateCode: 'CA',
                    postalCode: '90001',
                    countryCode: 'US',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phone: '213-555-5678'
                }

                const mockResponse = {basketId: 'test-basket-id'}
                mockUpdateShipmentForBasket.mockResolvedValue(mockResponse)
                const {result} = renderHook(() => useMultiship(mockBasket))

                await act(async () => {
                    const response = await result.current.updateDeliveryAddressForShipment(
                        'shipment-1',
                        address
                    )
                    expect(response).toEqual(mockResponse)
                })

                expect(mockUpdateShipmentForBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'shipment-1'
                    },
                    body: {
                        shippingAddress: {
                            address1: address.address1,
                            city: address.city,
                            countryCode: address.countryCode,
                            firstName: address.firstName,
                            lastName: address.lastName,
                            phone: address.phone,
                            postalCode: address.postalCode,
                            stateCode: address.stateCode
                        }
                    }
                })
            })

            test('should return null if parameters are invalid', async () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const address = {address1: '123 Main St'}

                await act(async () => {
                    // Test with null shipmentId
                    const response1 = await result.current.updateDeliveryAddressForShipment(
                        null,
                        address
                    )
                    expect(response1).toBeNull()

                    // Test with null address
                    const response2 = await result.current.updateDeliveryAddressForShipment(
                        'shipment-1',
                        null
                    )
                    expect(response2).toBeNull()
                })

                expect(mockUpdateShipmentForBasket).not.toHaveBeenCalled()
            })
        })

        describe('findUnusedDeliveryShipment', () => {
            test('should find delivery shipment not in used IDs list', () => {
                // Set up mock to identify pickup vs delivery shipments
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const basketWithMultipleDeliveryShipments = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'delivery-1',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'delivery-2',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'pickup-1',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithMultipleDeliveryShipments))

                const unusedShipment = result.current.findUnusedDeliveryShipment(
                    basketWithMultipleDeliveryShipments,
                    ['delivery-1']
                )
                expect(unusedShipment).toBeDefined()
                console.log('unusedShipment', unusedShipment)
                expect(unusedShipment.shipmentId).toBe('delivery-2')
            })

            test('should return undefined if all delivery shipments are used', () => {
                // Reset mock to default behavior - all shipments are delivery
                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                const {result} = renderHook(() => useMultiship(mockBasket))

                const unusedShipment = result.current.findUnusedDeliveryShipment(mockBasket, ['me'])
                expect(unusedShipment).toBeUndefined()
            })

            test('should return null if basket has no shipments', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))

                const unusedShipment = result.current.findUnusedDeliveryShipment(null, [])
                expect(unusedShipment).toBeNull()
            })

            test('should skip pickup shipments', () => {
                // Set up mock to identify pickup shipments
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const basketWithOnlyPickup = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'pickup-1',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithOnlyPickup))

                const unusedShipment = result.current.findUnusedDeliveryShipment(
                    basketWithOnlyPickup,
                    []
                )
                expect(unusedShipment).toBeUndefined()
            })
        })
    })

    describe('assignDefaultShippingMethodsToShipments', () => {
        test('should return early if no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('should assign default shipping methods to shipments without one', async () => {
            const basketWithShipmentWithoutMethod = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'shipment-2',
                        shippingMethod: null
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithShipmentWithoutMethod))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).toHaveBeenCalled()
            expect(mockUpdateShippingMethodForShipment).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'shipment-2'
                },
                body: {
                    id: 'default-shipping-method'
                }
            })
        })

        test('should handle error when fetching shipping methods', async () => {
            const basketWithShipmentWithoutMethod = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-2',
                        shippingMethod: null
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithShipmentWithoutMethod))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockRefetchShippingMethods.mockRejectedValue(new Error('Network error'))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to fetch shipping methods:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('findExistingDeliveryShipment', () => {
        test('should return null if no basket', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const deliveryShipment = result.current.findExistingDeliveryShipment(null)
            expect(deliveryShipment).toBeNull()
        })

        test('should find existing delivery shipment', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

            const deliveryShipment = result.current.findExistingDeliveryShipment(mockBasket)
            expect(deliveryShipment).toEqual(mockBasket.shipments[0])
        })

        test('should not find pickup shipment as delivery', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)

            const deliveryShipment = result.current.findExistingDeliveryShipment(mockBasket)
            expect(deliveryShipment).toBeUndefined()
        })
    })

    describe('findExistingPickupShipment', () => {
        test('should find existing pickup shipment for store', () => {
            const basketWithPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)

            const pickupShipment = result.current.findExistingPickupShipment(
                basketWithPickupShipment,
                'store-1'
            )
            expect(pickupShipment).toEqual(basketWithPickupShipment.shipments[0])
        })

        test('should return null if no storeId', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const pickupShipment = result.current.findExistingPickupShipment(mockBasket, null)
            expect(pickupShipment).toBeNull()
        })
    })

    describe('createNewDeliveryShipment', () => {
        test('should create new delivery shipment when default shipment is not empty', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {
                shipments: [
                    {
                        shipmentId: 'new-delivery-shipment',
                        shippingMethod: null
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.createNewDeliveryShipment(mockBasket)
                expect(response).toEqual(mockResponse)
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: {}
            })
        })

        test('should configure default shipment when it is empty', async () => {
            const basketWithEmptyDefault = {
                ...mockBasket,
                productItems: []
            }
            const {result} = renderHook(() => useMultiship(basketWithEmptyDefault))

            const mockConfigureResponse = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ]
            }
            mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

            await act(async () => {
                const response = await result.current.createNewDeliveryShipment(
                    basketWithEmptyDefault
                )
                expect(response).toEqual(mockConfigureResponse)
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyDefault,
                'me',
                false
            )
            expect(mockCreateShipmentForBasket).not.toHaveBeenCalled()
        })
    })

    describe('createNewPickupShipment', () => {
        test('should create new pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {
                shipments: [
                    {
                        shipmentId: 'new-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.createNewPickupShipment(
                    mockBasket,
                    mockStoreInfo
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockRefetchShippingMethods).toHaveBeenCalled()
            expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: {
                    shippingMethod: {
                        id: 'pickup-shipping-method'
                    },
                    c_fromStoreId: 'store-1'
                }
            })
        })

        test('should throw error if no pickup shipping method found', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockGetPickupShippingMethodId.mockReturnValue(null)

            await act(async () => {
                await expect(
                    result.current.createNewPickupShipment(mockBasket, mockStoreInfo)
                ).rejects.toThrow('No pickup shipping method found')
            })
        })
    })

    describe('moveItemToPickupShipment', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1
        }

        test('should move item to pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToPickupShipment(
                    mockProductItem,
                    'pickup-shipment',
                    'inventory-1'
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'pickup-shipment',
                    inventoryId: 'inventory-1'
                }
            })
        })

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.moveItemToPickupShipment(
                        mockProductItem,
                        'pickup-shipment',
                        'inventory-1'
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })
    })

    describe('moveItemToDeliveryShipment', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1,
            inventoryId: 'inventory-1'
        }

        test('should move item to delivery shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToDeliveryShipment(
                    mockProductItem,
                    'me',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'me',
                    inventoryId: mockDefaultInventoryId
                }
            })
        })

        test('should move item without inventory ID', async () => {
            const productItemWithoutInventory = {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1
            }
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToDeliveryShipment(
                    productItemWithoutInventory,
                    'me',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'me'
                }
            })
        })
    })

    describe('moveItemsToDeliveryShipment', () => {
        const mockProductItems = [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 2,
                inventoryId: 'inventory-1'
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 1,
                inventoryId: 'inventory-2'
            }
        ]

        test('should move multiple items to delivery shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemsInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemsToDeliveryShipment(
                    mockProductItems,
                    'delivery-shipment',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'delivery-shipment',
                        inventoryId: mockDefaultInventoryId
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'delivery-shipment',
                        inventoryId: mockDefaultInventoryId
                    }
                ]
            })
        })

        test('should handle API error gracefully', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockUpdateItemsInBasket.mockRejectedValue(new Error('API Error'))

            await act(async () => {
                await expect(
                    result.current.moveItemsToDeliveryShipment(
                        mockProductItems,
                        'me',
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('API Error')
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to move items to delivery shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('moveItemsToPickupShipment', () => {
        const mockProductItems = [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 2
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 1
            }
        ]

        test('should move multiple items to pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemsInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemsToPickupShipment(
                    mockProductItems,
                    'pickup-shipment',
                    'inventory-1'
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            })
        })

        test('should handle API error gracefully', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockUpdateItemsInBasket.mockRejectedValue(new Error('API Error'))

            await act(async () => {
                await expect(
                    result.current.moveItemsToPickupShipment(
                        mockProductItems,
                        'pickup-shipment',
                        'inventory-1'
                    )
                ).rejects.toThrow('API Error')
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to move items to pickup shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('handleDeliveryOptionChange', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1,
            shipmentId: 'me'
        }

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        false,
                        null,
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        test('should handle change from delivery to pickup', async () => {
            // Create a basket where the current item is in a delivery shipment
            const basketWithDeliveryItem = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'} // This is delivery
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithDeliveryItem))

            // Mock that current shipment is delivery (not pickup) for the item's current shipment
            // But return true for pickup shipments when checking the new shipment
            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                if (!method) return false
                return method.id === 'pickup-shipping-method'
            })

            const mockNewShipmentResponse = {
                shipments: [
                    {
                        shipmentId: 'new-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

            // Mock successful item update
            mockUpdateItemInBasket.mockResolvedValue({basketId: 'test-basket-id'})

            const productItemInDelivery = {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1,
                shipmentId: 'me'
            }

            await act(async () => {
                await result.current.handleDeliveryOptionChange(
                    productItemInDelivery,
                    true, // selectedPickup = true
                    mockStoreInfo,
                    mockDefaultInventoryId
                )
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalled()
            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'new-pickup-shipment',
                    inventoryId: 'inventory-1'
                }
            })
        })

        test('should throw error if store has no inventory ID', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

            const storeWithoutInventory = {
                ...mockStoreInfo,
                inventoryId: null
            }

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        storeWithoutInventory,
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Selected store does not have an inventory ID')
            })
        })
    })

    describe('removeEmptyShipments', () => {
        test('should return early if no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await result.current.removeEmptyShipments(null)
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should remove empty non-me shipments', async () => {
            const basketWithEmptyShipments = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment-1',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'empty-shipment-2',
                        shippingMethod: {id: 'pickup-shipping-method'}
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithEmptyShipments)
            })

            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledTimes(2)
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'empty-shipment-1'
                }
            })
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'empty-shipment-2'
                }
            })
        })

        test('should consolidate pickup shipment into empty "me"', async () => {
            const basketWithEmptyMe = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ],
                productItems: [
                    {
                        itemId: 'pickup-item-1',
                        productId: 'pickup-product-1',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithEmptyMe)
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyMe,
                'me',
                true,
                {id: 'store-1', inventoryId: 'inventory-1'}
            )
            expect(mockUpdateItemsInBasket).toHaveBeenCalled()
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'pickup-shipment'
                }
            })
        })

        test('should consolidate delivery shipment into empty "me"', async () => {
            const shippingAddress = {
                address1: '123 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US'
            }

            const basketWithEmptyMe = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'delivery-shipment',
                        shippingMethod: {id: 'default-shipping-method'},
                        shippingAddress: shippingAddress
                    }
                ],
                productItems: [
                    {
                        itemId: 'delivery-item-1',
                        productId: 'delivery-product-1',
                        quantity: 1,
                        shipmentId: 'delivery-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithEmptyMe)
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyMe,
                'me',
                false,
                null
            )
            expect(mockUpdateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'me'
                },
                body: {
                    shippingAddress: {
                        address1: shippingAddress.address1,
                        city: shippingAddress.city,
                        countryCode: shippingAddress.countryCode,
                        firstName: shippingAddress.firstName,
                        lastName: shippingAddress.lastName,
                        phone: shippingAddress.phone,
                        postalCode: shippingAddress.postalCode,
                        stateCode: shippingAddress.stateCode
                    }
                }
            })
            expect(mockUpdateItemsInBasket).toHaveBeenCalled()
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'delivery-shipment'
                }
            })
        })

        test('should handle consolidation errors gracefully', async () => {
            const basketWithEmptyMe = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ],
                productItems: [
                    {
                        itemId: 'pickup-item-1',
                        productId: 'pickup-product-1',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            // Make consolidation fail
            mockUpdateItemsInBasket.mockRejectedValue(new Error('Consolidation failed'))
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithEmptyMe)
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to consolidate shipment pickup-shipment:',
                expect.any(Error)
            )
            // Should not remove the shipment if consolidation failed
            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()

            consoleErrorSpy.mockRestore()
        })

        test('should not consolidate if default shipment has items', async () => {
            const basketWithItemsInMe = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'empty-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'}
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithItemsInMe))

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithItemsInMe)
            })

            // Should only remove the empty shipment
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledTimes(1)
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'empty-shipment'
                }
            })
            // Should not attempt consolidation
            expect(mockConfigureDefaultShipmentIfNeeded).not.toHaveBeenCalled()
            expect(mockUpdateItemsInBasket).not.toHaveBeenCalled()
        })

        test('should handle removal errors gracefully', async () => {
            const basketWithEmptyShipments = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ],
                productItems: mockBasket.productItems
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))

            mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Removal failed'))
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            await act(async () => {
                await result.current.removeEmptyShipments(basketWithEmptyShipments)
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to remove shipment empty-shipment:',
                expect.any(Error)
            )

            consoleErrorSpy.mockRestore()
        })
    })

    describe('changeStoreForPickupShipment', () => {
        const mockNewStore = {
            id: 'new-store-id',
            inventoryId: 'new-inventory-id'
        }

        test('should throw error if invalid parameters', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.changeStoreForPickupShipment(null, mockNewStore)
                ).rejects.toThrow('Invalid parameters for changing store')
            })

            await act(async () => {
                await expect(
                    result.current.changeStoreForPickupShipment('shipment-id', null)
                ).rejects.toThrow('Invalid parameters for changing store')
            })

            await act(async () => {
                await expect(
                    result.current.changeStoreForPickupShipment('shipment-id', {id: 'store-1'})
                ).rejects.toThrow('Invalid parameters for changing store')
            })
        })

        test('should return early if no items in source shipment', async () => {
            const basketWithNoItems = {
                ...mockBasket,
                productItems: []
            }
            const {result} = renderHook(() => useMultiship(basketWithNoItems))

            await act(async () => {
                await result.current.changeStoreForPickupShipment('me', mockNewStore)
            })

            expect(mockUpdateItemsInBasket).not.toHaveBeenCalled()
            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should move items to existing pickup shipment for new store', async () => {
            const basketWithExistingPickupShipment = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'existing-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'new-store-id'
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'source-shipment'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithExistingPickupShipment))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.changeStoreForPickupShipment('source-shipment', mockNewStore)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'existing-pickup-shipment',
                        inventoryId: 'new-inventory-id'
                    }
                ]
            })

            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'source-shipment'
                }
            })
        })

        test('should not remove default shipment even if empty after move', async () => {
            const basketWithDefaultShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'old-store-id'
                    },
                    {
                        shipmentId: 'existing-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'new-store-id'
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithDefaultShipment))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.changeStoreForPickupShipment('me', mockNewStore)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalled()
            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should create new pickup shipment when none exists for new store', async () => {
            const basketWithOldPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'old-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'old-store-id'
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'old-pickup-shipment'
                    }
                ]
            }

            const mockNewShipmentResponse = {
                shipments: [
                    {
                        shipmentId: 'new-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'new-store-id'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithOldPickupShipment))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

            await act(async () => {
                await result.current.changeStoreForPickupShipment(
                    'old-pickup-shipment',
                    mockNewStore
                )
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalled()
            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'new-pickup-shipment',
                        inventoryId: 'new-inventory-id'
                    }
                ]
            })

            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'old-pickup-shipment'
                }
            })
        })

        test('should handle multiple items in source shipment', async () => {
            const basketWithMultipleItems = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'source-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'old-store-id'
                    },
                    {
                        shipmentId: 'existing-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'new-store-id'
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'source-shipment'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'source-shipment'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithMultipleItems))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.changeStoreForPickupShipment('source-shipment', mockNewStore)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'existing-pickup-shipment',
                        inventoryId: 'new-inventory-id'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'existing-pickup-shipment',
                        inventoryId: 'new-inventory-id'
                    }
                ]
            })
        })
    })

    describe('getShipmentForItems', () => {
        test('should return default shipment ID when no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                const response = await result.current.getShipmentForItems(false, mockStoreInfo)
                expect(response).toBe('me')
            })
        })

        test('should handle pickup selection', async () => {
            const basketWithPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)
            const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

            await act(async () => {
                const response = await result.current.getShipmentForItems(true, mockStoreInfo)
                expect(response).toBe('pickup-shipment')
            })
        })
    })
})
