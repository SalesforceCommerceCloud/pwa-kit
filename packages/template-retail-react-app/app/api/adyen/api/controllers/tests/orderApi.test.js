/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'node-fetch'
import {OrderApiClient} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/orderApi'

jest.mock('node-fetch')

describe('OrderApiClient', () => {
    let orderApiClient

    beforeEach(() => {
        orderApiClient = new OrderApiClient()
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    describe('getAdminAuthToken', () => {
        it('should fetch the admin auth token', async () => {
            const tokenData = {access_token: 'testToken'}

            fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(tokenData)
            })

            const result = await orderApiClient.getAdminAuthToken()

            expect(result).toEqual(tokenData)
            expect(fetch).toHaveBeenCalledWith(orderApiClient.tokenUrl, expect.any(Object))
        })
    })

    describe('getOrder', () => {
        it('should return order data on successful response', async () => {
            const mockOrderNo = '123'
            const mockResponseBody = {orderId: '123', status: 'completed'}

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponseBody)
            })

            const result = await orderApiClient.getOrder(mockOrderNo)

            expect(result).toEqual(mockResponseBody)
        })

        it('should throw an error on unsuccessful response', async () => {
            const mockOrderNo = '456'
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: jest.fn().mockResolvedValue('Order not found')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await expect(orderApiClient.getOrder(mockOrderNo)).rejects.toThrow('404 Not Found')
        })
    })

    describe('updateOrderStatus', () => {
        it('should update order status successfully', async () => {
            const mockOrderNo = '123'
            const mockStatus = 'shipped'

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true
            })

            const result = await orderApiClient.updateOrderStatus(mockOrderNo, mockStatus)
            expect(result.ok).toBe(true)
        })

        it('should throw an error on unsuccessful response', async () => {
            const mockOrderNo = '456'
            const mockStatus = 'invalidStatus'

            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid status')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await expect(orderApiClient.updateOrderStatus(mockOrderNo, mockStatus)).rejects.toThrow(
                '400 Bad Request'
            )
        })
    })

    describe('updateOrderPaymentStatus', () => {
        it('should update order payment status successfully', async () => {
            const mockOrderNo = '123'
            const mockStatus = 'paid'

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true
            })

            const result = await orderApiClient.updateOrderPaymentStatus(mockOrderNo, mockStatus)
            expect(result.ok).toBe(true)
        })

        it('should throw an error on unsuccessful response', async () => {
            const mockOrderNo = '456'
            const mockStatus = 'invalidStatus'

            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid payment status')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await expect(
                orderApiClient.updateOrderPaymentStatus(mockOrderNo, mockStatus)
            ).rejects.toThrow('400 Bad Request')
        })
    })

    describe('updateOrderExportStatus', () => {
        it('should update order export status successfully', async () => {
            const mockOrderNo = '123'
            const mockStatus = 'exported'

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true
            })

            const result = await orderApiClient.updateOrderExportStatus(mockOrderNo, mockStatus)
            expect(result.ok).toBe(true)
        })

        it('should throw an error on unsuccessful response', async () => {
            const mockOrderNo = '456'
            const mockStatus = 'invalidStatus'

            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid export status')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await expect(
                orderApiClient.updateOrderExportStatus(mockOrderNo, mockStatus)
            ).rejects.toThrow('400 Bad Request')
        })
    })

    describe('updateOrderConfirmationStatus', () => {
        it('should update order confirmation status successfully', async () => {
            const mockOrderNo = '123'
            const mockStatus = 'confirmed'

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true
            })

            const result = await orderApiClient.updateOrderConfirmationStatus(
                mockOrderNo,
                mockStatus
            )

            expect(result.ok).toBe(true)
        })

        it('should throw an error on unsuccessful response', async () => {
            const mockOrderNo = '456'
            const mockStatus = 'invalidStatus'

            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid confirmation status')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await expect(
                orderApiClient.updateOrderConfirmationStatus(mockOrderNo, mockStatus)
            ).rejects.toThrow('400 Bad Request')
        })
    })

    describe('updateOrderPaymentTransaction', () => {
        it('should update payment transaction successfully', async () => {
            const mockOrderNo = '123'
            const mockPaymentInstrumentId = '456'
            const mockPspReference = '789'

            orderApiClient.base = jest.fn().mockResolvedValue({
                ok: true
            })

            const result = await orderApiClient.updateOrderPaymentTransaction(
                mockOrderNo,
                mockPaymentInstrumentId,
                mockPspReference
            )
            expect(result.ok).toBe(true)
        })

        it('should log an error on unsuccessful response', async () => {
            const mockOrderNo = '123'
            const mockPaymentInstrumentId = '456'
            const mockPspReference = '789'

            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Transaction update failed')
            }

            orderApiClient.base = jest.fn().mockResolvedValue(mockResponse)

            await orderApiClient.updateOrderPaymentTransaction(
                mockOrderNo,
                mockPaymentInstrumentId,
                mockPspReference
            )

            expect(orderApiClient.base).toHaveBeenCalledWith(
                'PATCH',
                expect.any(String),
                expect.any(Object)
            )
        })
    })
})
