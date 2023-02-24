/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from '@testing-library/react'
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    mockMutationEndpoints,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import {ShopperCustomersMutation, useShopperCustomersMutation} from '../ShopperCustomers'
import {ApiClients, Argument, DataType} from '../types'
import {NotImplementedError} from '../utils'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'})
    }))
})

type Client = ApiClients['shopperCustomers']
const customersEndpoint = '/customer/shopper-customers/'
const ADDRESS: ShopperCustomersTypes.CustomerAddress = {
    addressId: 'address',
    countryCode: 'CA',
    lastName: 'Doofenschmirtz'
}
const PRODUCT_LIST_ITEM: ShopperCustomersTypes.CustomerProductListItem = {
    id: 'productListItemId',
    priority: 0,
    public: false,
    quantity: 0
}
const PAYMENT_INSTRUMENT: ShopperCustomersTypes.CustomerPaymentInstrument = {
    paymentBankAccount: {},
    paymentCard: {cardType: 'fake'},
    paymentInstrumentId: 'paymentInstrumentId',
    paymentMethodId: 'paymentMethodId'
}
/** All Shopper Customers parameters. Can be used for all endpoints, as unused params are ignored. */
const PARAMETERS = {
    addressName: 'addressName',
    customerId: 'customerId',
    itemId: 'itemId',
    listId: 'listId',
    paymentInstrumentId: 'paymentInstrumentId'
}
const createOptions = <Mut extends ShopperCustomersMutation>(
    body: Argument<Client[Mut]> extends {body: infer B} ? B : undefined
): Argument<Client[Mut]> => ({body, parameters: PARAMETERS})

// --- TEST CASES --- //
// This is an object rather than an array to more easily ensure we cover all mutations
// TODO: Remove optional flag when all mutations are implemented
type TestMap = {[Mut in ShopperCustomersMutation]?: [Argument<Client[Mut]>, DataType<Client[Mut]>]}
const testMap: TestMap = {
    // Invalidate customer, update created item endpoint
    createCustomerAddress: [createOptions<'createCustomerAddress'>(ADDRESS), ADDRESS],
    // Invalidate customer, update created item endpoint
    createCustomerPaymentInstrument: [
        createOptions<'createCustomerPaymentInstrument'>({
            bankRoutingNumber: 'bank',
            giftCertificateCode: 'code',
            // Type assertion so we don't need the full type
            paymentCard: {} as ShopperCustomersTypes.CustomerPaymentCardRequest,
            paymentMethodId: 'paymentMethodId'
        }),
        PAYMENT_INSTRUMENT
    ],
    // Invalidate product listS, update created item endpoint
    createCustomerProductList: [
        createOptions<'createCustomerProductList'>({id: 'productListId'}),
        {id: 'productListId'}
    ],
    // Invalidate product listS, update PL, update created item endpoint
    createCustomerProductListItem: [
        createOptions<'createCustomerProductListItem'>(PRODUCT_LIST_ITEM),
        PRODUCT_LIST_ITEM
    ],
    // Invalidate customer, remove
    deleteCustomerPaymentInstrument: [
        createOptions<'deleteCustomerPaymentInstrument'>(undefined),
        undefined
    ],
    // Invalidate product listS? invalidate PL, remove
    deleteCustomerProductListItem: [
        createOptions<'deleteCustomerProductListItem'>(undefined),
        undefined
    ],
    // noop
    getResetPasswordToken: [
        createOptions<'getResetPasswordToken'>({login: 'login'}),
        {email: 'customer@email', expiresInMinutes: 10, login: 'login', resetToken: 'token'}
    ],
    // noop
    registerCustomer: [
        createOptions<'registerCustomer'>({customer: {}, password: 'hunter2'}),
        {customerId: 'customerId'}
    ],
    // Invalidate customer, remove
    removeCustomerAddress: [createOptions<'removeCustomerAddress'>(undefined), undefined],
    // noop
    resetPassword: [
        createOptions<'resetPassword'>({
            resetToken: 'token',
            newPassword: 'hunter3',
            login: 'login'
        }),
        undefined
    ],
    updateCustomer: [createOptions<'updateCustomer'>({}), {customerId: 'customerId'}],
    // Update customer, invalidate *
    updateCustomerAddress: [
        createOptions<'updateCustomerAddress'>({
            addressId: 'addressId',
            countryCode: 'CA',
            lastName: 'Doofenschmirtz'
        }),
        ADDRESS
    ],
    // invalidate PLs? invalidate PL, update PLI
    updateCustomerProductListItem: [
        createOptions<'updateCustomerProductListItem'>({priority: 0, public: false, quantity: 0}),
        PRODUCT_LIST_ITEM
    ]
}
// Type assertion is necessary because `Object.entries` is limited :\
const allTestCases = Object.entries(testMap) as Array<
    [ShopperCustomersMutation, NonNullable<TestMap[ShopperCustomersMutation]>]
>

// Not implemented checks are temporary to make sure we don't forget to add tests when adding
// implentations. When all mutations are added, the "not implemented" tests can be removed,
// and the `TestMap` type can be changed from optional keys to required keys. Doing so will
// leverage TypeScript to enforce having tests for all mutations.
const notImplTestCases: ShopperCustomersMutation[][] = [
    ['authorizeCustomer'],
    ['authorizeTrustedSystem'],
    ['deleteCustomerProductList'],
    ['invalidateCustomerAuth'],
    ['updateCustomerPassword'],
    ['updateCustomerProductList']
]

describe('ShopperCustomers mutations', () => {
    beforeEach(() => nock.cleanAll())
    test.each(allTestCases)(
        '`%s` returns data on success',
        async (mutationName, [options, data]) => {
            mockMutationEndpoints(customersEndpoint, data ?? {}) // Fallback for `void` endpoints
            const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
                return useShopperCustomersMutation(mutationName)
            })
            expect(result.current.data).toBeUndefined()
            act(() => result.current.mutate(options))
            await waitAndExpectSuccess(wait, () => result.current)
            expect(result.current.data).toEqual(data)
        }
    )
    test.each(allTestCases)('`%s` returns error on error', async (mutationName, [options]) => {
        mockMutationEndpoints(customersEndpoint, {error: true}, 400)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return useShopperCustomersMutation(mutationName)
        })
        expect(result.current.error).toBeNull()
        act(() => result.current.mutate(options))
        await waitAndExpectError(wait, () => result.current)
        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
    test.each(notImplTestCases)('`%s` is not yet implemented', async (mutationName) => {
        expect(() => useShopperCustomersMutation(mutationName)).toThrow(NotImplementedError)
    })
})
