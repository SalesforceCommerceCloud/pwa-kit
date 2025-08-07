/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    calculateBasketTotals,
    getBasketWithTotals,
    forceOrderCalculation
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Mock the getConfig function
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

describe('Basket Calculation', () => {
    const mockAuthToken = 'test-auth-token'
    const mockBasketId = 'test-basket-id'
    const mockSite = {id: 'test-site-id'}
    const mockOrganizationId = 'test-org-id'

    beforeAll(() => {
        global.fetch = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue({
            app: {
                commerceAPI: {
                    parameters: {
                        organizationId: mockOrganizationId
                    }
                }
            }
        })
    })

    const mockSuccessResponse = (data) => ({
        ok: true,
        json: () => Promise.resolve(data)
    })

    const mockErrorResponse = (status, text) => ({
        ok: false,
        status,
        text: () => Promise.resolve(text)
    })

    describe('calculateBasketTotals', () => {
        it('should calculate basket totals successfully', async () => {
            const mockBasket = {basketId: mockBasketId, orderTotal: 100}
            global.fetch.mockResolvedValue(mockSuccessResponse(mockBasket))

            const result = await calculateBasketTotals(mockBasketId, mockAuthToken, mockSite)

            expect(global.fetch).toHaveBeenCalledWith(
                `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${mockOrganizationId}/baskets/${mockBasketId}?siteId=${mockSite.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${mockAuthToken}`
                    },
                    body: JSON.stringify({})
                }
            )
            expect(result).toEqual(mockBasket)
        })

        it('should throw an error if the request fails', async () => {
            global.fetch.mockResolvedValue(mockErrorResponse(500, 'Internal Server Error'))

            await expect(
                calculateBasketTotals(mockBasketId, mockAuthToken, mockSite)
            ).rejects.toThrow('HTTP error! status: 500, message: Internal Server Error')
        })

        it('should throw an error if basketId is missing', async () => {
            await expect(calculateBasketTotals(null, mockAuthToken, mockSite)).rejects.toThrow(
                'Basket ID is required'
            )
        })

        it('should throw an error if authToken is missing', async () => {
            await expect(calculateBasketTotals(mockBasketId, null, mockSite)).rejects.toThrow(
                'Authentication token is required'
            )
        })

        it('should throw an error if site ID is missing', async () => {
            await expect(calculateBasketTotals(mockBasketId, mockAuthToken, {})).rejects.toThrow(
                'Site ID is required'
            )
        })

        it('should throw an error if organization ID is missing from config', async () => {
            getConfig.mockReturnValue({
                app: {
                    commerceAPI: {
                        parameters: {}
                    }
                }
            })

            await expect(calculateBasketTotals(mockBasketId, mockAuthToken, mockSite)).rejects.toThrow(
                'Organization ID is required and not found in configuration'
            )
        })
    })

    describe('getBasketWithTotals', () => {
        it('should get basket with totals successfully', async () => {
            const mockBasket = {basketId: mockBasketId, orderTotal: 100}
            global.fetch.mockResolvedValue(mockSuccessResponse(mockBasket))

            const result = await getBasketWithTotals(mockBasketId, mockAuthToken, mockSite)

            expect(global.fetch).toHaveBeenCalledWith(
                `/mobify/proxy/api/checkout/shopper-baskets/v2/organizations/${mockOrganizationId}/baskets/${mockBasketId}?siteId=${mockSite.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${mockAuthToken}`
                    }
                }
            )
            expect(result).toEqual(mockBasket)
        })

        it('should throw an error if the request fails', async () => {
            global.fetch.mockResolvedValue(mockErrorResponse(404, 'Not Found'))

            await expect(getBasketWithTotals(mockBasketId, mockAuthToken, mockSite)).rejects.toThrow(
                'HTTP error! status: 404, message: Not Found'
            )
        })
    })

    describe('forceOrderCalculation', () => {
        it('should return basket if orderTotal is already present', async () => {
            const mockBasket = {basketId: mockBasketId, orderTotal: 150.0}
            global.fetch.mockResolvedValue(mockSuccessResponse(mockBasket)) // for getBasketWithTotals

            const result = await forceOrderCalculation(mockBasketId, mockAuthToken, mockSite)
            expect(result).toEqual(mockBasket)
            // calculateBasketTotals should not be called
            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({method: 'GET'})
            )
        })

        it('should throw error if no shipping method is applied and orderTotal is missing', async () => {
            const mockBasket = {
                basketId: mockBasketId,
                orderTotal: null,
                shipments: [{shippingMethod: null}]
            }
            global.fetch.mockResolvedValue(mockSuccessResponse(mockBasket))

            await expect(
                forceOrderCalculation(mockBasketId, mockAuthToken, mockSite)
            ).rejects.toThrow(
                'No shipping method applied - cannot proceed with payment without valid shipping costs'
            )
        })

        it('should call calculateBasketTotals if shipping method exists but orderTotal is missing', async () => {
            const initialBasket = {
                basketId: mockBasketId,
                orderTotal: null,
                shipments: [{shippingMethod: {id: 'ship-001'}}]
            }
            const finalBasket = {basketId: mockBasketId, orderTotal: 175.5}

            // First call for getBasketWithTotals, second for calculateBasketTotals
            global.fetch
                .mockResolvedValueOnce(mockSuccessResponse(initialBasket))
                .mockResolvedValueOnce(mockSuccessResponse(finalBasket))

            const result = await forceOrderCalculation(mockBasketId, mockAuthToken, mockSite)

            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({method: 'GET'})
            )
            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({method: 'PATCH'})
            )
            expect(result).toEqual(finalBasket)
        })

        it('should throw error if calculateBasketTotals fails to calculate order total', async () => {
            const initialBasket = {
                basketId: mockBasketId,
                orderTotal: null,
                shipments: [{shippingMethod: {id: 'ship-001'}}]
            }
            const finalBasketWithoutTotal = {basketId: mockBasketId, orderTotal: null}

            global.fetch
                .mockResolvedValueOnce(mockSuccessResponse(initialBasket))
                .mockResolvedValueOnce(mockSuccessResponse(finalBasketWithoutTotal))

            await expect(
                forceOrderCalculation(mockBasketId, mockAuthToken, mockSite)
            ).rejects.toThrow(
                'Unable to calculate order total - shipping methods may not be available for this location'
            )
        })
    })
})
