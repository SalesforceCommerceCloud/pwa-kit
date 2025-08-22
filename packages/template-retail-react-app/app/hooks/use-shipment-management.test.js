/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useShipmentManagement} from './use-shipment-management'

// Mock dependencies
jest.mock('./use-multiship')
jest.mock('./use-item-shipment-management')

import {useMultiship} from './use-multiship'
import {useItemShipmentManagement} from './use-item-shipment-management'

const mockUseMultiship = useMultiship
const mockUseItemShipmentManagement = useItemShipmentManagement

describe('useShipmentManagement', () => {
    const mockBasket = {
        basketId: 'test-basket-id',
        shipments: [
            {
                shipmentId: 'shipment-1',
                shippingAddress: {
                    addressId: 'address-1',
                    city: 'Test City'
                }
            }
        ]
    }

    const mockDeliveryItems = [
        {
            itemId: 'item-1',
            productId: 'product-1',
            shipmentId: 'shipment-1'
        },
        {
            itemId: 'item-2',
            productId: 'product-2',
            shipmentId: 'shipment-2'
        }
    ]

    const mockSelectedAddresses = {
        'item-1': 'address-1',
        'item-2': 'address-2'
    }

    const mockFinalAddresses = [
        {
            addressId: 'address-1',
            city: 'Test City 1'
        },
        {
            addressId: 'address-2',
            city: 'Test City 2'
        }
    ]

    const mockProductsMap = {
        'product-1': {
            inventory: {id: 'inventory-1'}
        },
        'product-2': {
            inventory: {id: 'inventory-2'}
        }
    }

    const mockMultishipFunctions = {
        findDeliveryShipmentWithSameAddress: jest.fn(),
        findUnusedDeliveryShipment: jest.fn(),
        createNewDeliveryShipmentWithAddress: jest.fn(),
        updateDeliveryAddressForShipment: jest.fn(),
        removeEmptyShipments: jest.fn()
    }

    const mockItemShipmentManagement = {
        updateItemsToDeliveryShipment: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseMultiship.mockReturnValue(mockMultishipFunctions)
        mockUseItemShipmentManagement.mockReturnValue(mockItemShipmentManagement)
    })

    describe('orchestration with mixed scenarios (existing + new shipments)', () => {
        it('should handle mixed existing and new shipments successfully', async () => {
            // Setup: One item uses existing shipment, one creates new
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress
                .mockReturnValueOnce({shipmentId: 'shipment-1'}) // Existing
                .mockReturnValueOnce(null) // New shipment needed

            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                const operationResult = await result.current.orchestrateShipmentOperations(
                    mockDeliveryItems,
                    mockSelectedAddresses,
                    mockFinalAddresses,
                    mockProductsMap
                )
                expect(operationResult).toEqual({success: true})
            })

            // Verify existing shipment was found
            expect(mockMultishipFunctions.findDeliveryShipmentWithSameAddress).toHaveBeenCalledWith(
                mockBasket,
                mockFinalAddresses[0]
            )

            // Verify new shipment was created
            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).toHaveBeenCalledWith(mockBasket, mockFinalAddresses[1])
        })
    })

    describe('error handling when inventory data is missing', () => {
        it('should throw error when inventory data is missing', async () => {
            const productsMapWithoutInventory = {
                'product-1': {} // No inventory
            }

            // Item needs to be moved to trigger inventory check
            const itemNeedingMove = {
                itemId: 'item-1',
                productId: 'product-1',
                shipmentId: 'different-shipment' // Different from target shipment
            }

            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await expect(
                    result.current.orchestrateShipmentOperations(
                        [itemNeedingMove],
                        {'item-1': 'address-1'},
                        [mockFinalAddresses[0]],
                        productsMapWithoutInventory
                    )
                ).rejects.toThrow('No inventory ID found for product product-1')
            })
        })
    })

    describe('maps addresses to items', () => {
        it('should create correct address-to-items mapping', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await result.current.orchestrateShipmentOperations(
                    mockDeliveryItems,
                    mockSelectedAddresses,
                    mockFinalAddresses,
                    mockProductsMap
                )
            })

            // Verify address mapping was created correctly
            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).toHaveBeenCalledTimes(2)
            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).toHaveBeenCalledWith(mockBasket, mockFinalAddresses[0])
            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).toHaveBeenCalledWith(mockBasket, mockFinalAddresses[1])
        })
    })

    describe('finds/reuses existing shipments', () => {
        it('should find and reuse existing shipment with same address', async () => {
            const existingShipment = {shipmentId: 'existing-shipment-1'}
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(
                existingShipment
            )
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await result.current.orchestrateShipmentOperations(
                    [mockDeliveryItems[0]],
                    {'item-1': 'address-1'},
                    [mockFinalAddresses[0]],
                    mockProductsMap
                )
            })

            expect(mockMultishipFunctions.findDeliveryShipmentWithSameAddress).toHaveBeenCalledWith(
                mockBasket,
                mockFinalAddresses[0]
            )
            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).not.toHaveBeenCalled()
        })
    })

    describe('creates new shipments when needed', () => {
        it('should create new shipment when no existing shipment found', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await result.current.orchestrateShipmentOperations(
                    [mockDeliveryItems[0]],
                    {'item-1': 'address-1'},
                    [mockFinalAddresses[0]],
                    mockProductsMap
                )
            })

            expect(
                mockMultishipFunctions.createNewDeliveryShipmentWithAddress
            ).toHaveBeenCalledWith(mockBasket, mockFinalAddresses[0])
        })
    })

    describe('moves items between shipments', () => {
        it('should move items to correct shipment', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await result.current.orchestrateShipmentOperations(
                    [mockDeliveryItems[0]],
                    {'item-1': 'address-1'},
                    [mockFinalAddresses[0]],
                    mockProductsMap
                )
            })

            expect(mockItemShipmentManagement.updateItemsToDeliveryShipment).toHaveBeenCalledWith(
                [mockDeliveryItems[0]],
                'new-shipment-1',
                'inventory-1'
            )
        })
    })

    describe('cleans up empty shipments', () => {
        it('should remove empty shipments after operations', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockResolvedValue(mockBasket)
            mockMultishipFunctions.removeEmptyShipments.mockResolvedValue()

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await result.current.orchestrateShipmentOperations(
                    [mockDeliveryItems[0]],
                    {'item-1': 'address-1'},
                    [mockFinalAddresses[0]],
                    mockProductsMap
                )
            })

            expect(mockMultishipFunctions.removeEmptyShipments).toHaveBeenCalledWith(mockBasket)
        })
    })

    describe('API failures during shipment creation/updates', () => {
        it('should handle API failure during shipment creation', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockRejectedValue(
                new Error('API Error')
            )

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await expect(
                    result.current.orchestrateShipmentOperations(
                        [mockDeliveryItems[0]],
                        {'item-1': 'address-1'},
                        [mockFinalAddresses[0]],
                        mockProductsMap
                    )
                ).rejects.toThrow('Failed to process shipments: API Error')
            })
        })

        it('should handle API failure during item movement', async () => {
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockResolvedValue({
                shipmentId: 'new-shipment-1'
            })
            mockItemShipmentManagement.updateItemsToDeliveryShipment.mockRejectedValue(
                new Error('Item Movement Error')
            )

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await expect(
                    result.current.orchestrateShipmentOperations(
                        [mockDeliveryItems[0]],
                        {'item-1': 'address-1'},
                        [mockFinalAddresses[0]],
                        mockProductsMap
                    )
                ).rejects.toThrow('Failed to process shipments: Item Movement Error')
            })
        })
    })

    describe('error propagation and message', () => {
        it('should format error messages correctly', async () => {
            const originalError = new Error('Original error message')
            mockMultishipFunctions.findDeliveryShipmentWithSameAddress.mockReturnValue(null)
            mockMultishipFunctions.findUnusedDeliveryShipment.mockReturnValue(null)
            mockMultishipFunctions.createNewDeliveryShipmentWithAddress.mockRejectedValue(
                originalError
            )

            const {result} = renderHook(() => useShipmentManagement(mockBasket))

            await act(async () => {
                await expect(
                    result.current.orchestrateShipmentOperations(
                        [mockDeliveryItems[0]],
                        {'item-1': 'address-1'},
                        [mockFinalAddresses[0]],
                        mockProductsMap
                    )
                ).rejects.toThrow('Failed to process shipments: Original error message')
            })
        })
    })
})
