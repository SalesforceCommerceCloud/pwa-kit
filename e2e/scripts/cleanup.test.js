/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('./utils', () => {
    throw new Error('cleanup helper must not load browser-test utilities')
})

const {ensureOkResponse, verifyEmpty} = require('./cleanup')

describe('cleanup response validation', () => {
    test('returns successful responses', async () => {
        const response = {ok: () => true}

        await expect(ensureOkResponse('GET baskets', response)).resolves.toBe(response)
    })

    test('reports operation, status, and response body', async () => {
        const response = {
            ok: () => false,
            status: () => 503,
            text: jest.fn().mockResolvedValue('service unavailable')
        }

        await expect(ensureOkResponse('GET baskets', response)).rejects.toThrow(
            'GET baskets failed with status 503: service unavailable'
        )
    })
})

describe('cleanup empty-state verification', () => {
    test('retries until no resource ids remain', async () => {
        const readIds = jest.fn().mockResolvedValueOnce(['basket-1']).mockResolvedValueOnce([])
        const sleepFn = jest.fn().mockResolvedValue()

        await expect(
            verifyEmpty({label: 'baskets', readIds, attempts: 3, retryDelay: 25, sleepFn})
        ).resolves.toBeUndefined()
        expect(readIds).toHaveBeenCalledTimes(2)
        expect(sleepFn).toHaveBeenCalledWith(25)
    })

    test('reports remaining resource ids after the retry bound', async () => {
        const readIds = jest.fn().mockResolvedValue(['item-1', 'item-2'])
        const sleepFn = jest.fn().mockResolvedValue()

        await expect(
            verifyEmpty({label: 'wishlist items', readIds, attempts: 3, sleepFn})
        ).rejects.toThrow('wishlist items still contains: item-1, item-2')
        expect(readIds).toHaveBeenCalledTimes(3)
        expect(sleepFn).toHaveBeenCalledTimes(2)
    })
})
