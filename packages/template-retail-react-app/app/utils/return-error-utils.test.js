/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    classifyReturnError,
    ReturnErrorKind
} from '@salesforce/retail-react-app/app/utils/return-error-utils'

/**
 * Build a fake mutation error carrying a Response-like object. `bodyUsed`
 * defaults to false (unread) and `json` resolves `body`; pass `jsonThrows` to
 * model an already-consumed / non-JSON stream.
 */
const makeError = ({status, body, bodyUsed = false, jsonThrows = false} = {}) => ({
    response: {
        status,
        bodyUsed,
        json: jest.fn(() =>
            jsonThrows ? Promise.reject(new Error('body already used')) : Promise.resolve(body)
        )
    }
})

describe('classifyReturnError', () => {
    test('400 InvalidReasonCode -> invalidReason', async () => {
        const result = await classifyReturnError(
            makeError({status: 400, body: {errorCode: 'InvalidReasonCode'}})
        )
        expect(result).toEqual({
            kind: ReturnErrorKind.INVALID_REASON,
            status: 400,
            errorCode: 'InvalidReasonCode'
        })
    })

    test('400 UnknownProductItemIds -> unknownItems', async () => {
        const result = await classifyReturnError(
            makeError({status: 400, body: {errorCode: 'UnknownProductItemIds'}})
        )
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN_ITEMS)
        expect(result.status).toBe(400)
    })

    test('400 ReturnQuantityExceeded -> quantityExceeded', async () => {
        const result = await classifyReturnError(
            makeError({status: 400, body: {errorCode: 'ReturnQuantityExceeded'}})
        )
        expect(result.kind).toBe(ReturnErrorKind.QUANTITY_EXCEEDED)
        expect(result.status).toBe(400)
    })

    test('400 OrderReturnFailed -> unknown (no dedicated recovery)', async () => {
        const result = await classifyReturnError(
            makeError({status: 400, body: {errorCode: 'OrderReturnFailed'}})
        )
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
        expect(result.status).toBe(400)
    })

    test('400 with unrecognized errorCode -> unknown', async () => {
        const result = await classifyReturnError(
            makeError({status: 400, body: {errorCode: 'SomethingNew'}})
        )
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
    })

    test('400 with unreadable body falls back to unknown (status-only)', async () => {
        const result = await classifyReturnError(makeError({status: 400, jsonThrows: true}))
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
        expect(result.status).toBe(400)
    })

    test('400 with already-consumed body (bodyUsed) does not double-read -> unknown', async () => {
        const err = makeError({status: 400, body: {errorCode: 'InvalidReasonCode'}, bodyUsed: true})
        const result = await classifyReturnError(err)
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
        expect(err.response.json).not.toHaveBeenCalled()
    })

    test('404 -> notFound (no body read)', async () => {
        const err = makeError({status: 404})
        const result = await classifyReturnError(err)
        expect(result.kind).toBe(ReturnErrorKind.NOT_FOUND)
        expect(err.response.json).not.toHaveBeenCalled()
    })

    test('409 -> conflict (no body read)', async () => {
        const err = makeError({status: 409})
        const result = await classifyReturnError(err)
        expect(result.kind).toBe(ReturnErrorKind.CONFLICT)
        expect(err.response.json).not.toHaveBeenCalled()
    })

    test('no response (network/timeout) -> network', async () => {
        const result = await classifyReturnError(new Error('Failed to fetch'))
        expect(result.kind).toBe(ReturnErrorKind.NETWORK)
        expect(result.status).toBeUndefined()
    })

    test('null/undefined error -> network', async () => {
        expect((await classifyReturnError(undefined)).kind).toBe(ReturnErrorKind.NETWORK)
        expect((await classifyReturnError(null)).kind).toBe(ReturnErrorKind.NETWORK)
    })

    test('unexpected status (e.g. 500) -> unknown', async () => {
        const result = await classifyReturnError(makeError({status: 500}))
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
        expect(result.status).toBe(500)
    })

    test('leaked 401 -> unknown (auth handled out-of-band, not here)', async () => {
        const result = await classifyReturnError(makeError({status: 401}))
        expect(result.kind).toBe(ReturnErrorKind.UNKNOWN)
    })
})
