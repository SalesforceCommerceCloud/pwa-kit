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
    assertInvalidateQuery,
    assertRemoveQuery,
    assertUpdateQuery,
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectSuccess
} from '../../test-utils'
import {ShopperCustomersMutation, useShopperCustomersMutation} from '../ShopperCustomers'
import {ApiClients, Argument, DataType, RequireKeys} from '../types'
import {NotImplementedError} from '../utils'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'})
    }))
})

type Client = ApiClients['shopperCustomers']
const customersEndpoint = '/customer/shopper-customers/'
/** All Shopper Customers parameters. Can be used for all endpoints, as unused params are ignored. */
const PARAMETERS = {
    addressName: 'address', // Not 'addressName' because sometimes it's used as `addressId`
    customerId: 'customerId',
    itemId: 'itemId',
    listId: 'listId',
    paymentInstrumentId: 'paymentInstrumentId'
}
/** Options object that can be used for all query endpoints. */
const queryOptions = {parameters: PARAMETERS}
const oldAddress: ShopperCustomersTypes.CustomerAddress = {
    addressId: 'address',
    countryCode: 'CA',
    lastName: 'Doofenschmirtz'
}
const newAddress: ShopperCustomersTypes.CustomerAddress = {
    addressId: 'address',
    countryCode: 'US',
    lastName: 'Doofenschmirtz'
}
const oldProductListItem: ShopperCustomersTypes.CustomerProductListItem = {
    id: 'productListItemId',
    priority: 0,
    public: false,
    quantity: 0
}
const newProductListItem: ShopperCustomersTypes.CustomerProductListItem = {
    id: 'productListItemId',
    priority: 1,
    public: false,
    quantity: 1
}
const oldPaymentInstrument: ShopperCustomersTypes.CustomerPaymentInstrument = {
    paymentBankAccount: {},
    paymentCard: {cardType: 'fake'},
    paymentInstrumentId: 'paymentInstrumentId',
    paymentMethodId: 'paymentMethodId'
}
const newPaymentInstrument: ShopperCustomersTypes.CustomerPaymentInstrument = {
    paymentBankAccount: {},
    paymentCard: {cardType: 'different'},
    paymentInstrumentId: 'paymentInstrumentId',
    paymentMethodId: 'paymentMethodId'
}
const baseCustomer: RequireKeys<
    ShopperCustomersTypes.Customer,
    'addresses' | 'paymentInstruments'
> = {
    customerId: 'customerId',
    addresses: [oldAddress],
    paymentInstruments: [oldPaymentInstrument]
}
const baseProductList: RequireKeys<
    ShopperCustomersTypes.CustomerProductList,
    'customerProductListItems'
> = {
    id: 'productListId',
    customerProductListItems: []
}

const createOptions = <Mut extends ShopperCustomersMutation>(
    body: Argument<Client[Mut]> extends {body: infer B} ? B : undefined
): Argument<Client[Mut]> => ({...queryOptions, body})

// --- TEST CASES --- //
const testMap = {
    // Invalidate product listS, update created item endpoint
    createCustomerProductList: [
        createOptions<'createCustomerProductList'>({id: 'productListId'}),
        {id: 'productListId'}
    ],
    // Invalidate product listS, update PL, update created item endpoint
    createCustomerProductListItem: [
        createOptions<'createCustomerProductListItem'>(oldProductListItem),
        oldProductListItem
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
    // noop
    resetPassword: [
        createOptions<'resetPassword'>({
            resetToken: 'token',
            newPassword: 'hunter3',
            login: 'login'
        }),
        undefined
    ],
    // invalidate PLs? invalidate PL, update PLI
    updateCustomerProductListItem: [
        createOptions<'updateCustomerProductListItem'>({priority: 0, public: false, quantity: 0}),
        oldProductListItem
    ]
}

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
    test.each(notImplTestCases)('`%s` is not yet implemented', async (mutationName) => {
        expect(() => useShopperCustomersMutation(mutationName)).toThrow(NotImplementedError)
    })
    describe('modify a customer', () => {
        test('`createCustomerAddress` updates cache on success', async () => {
            const customer: ShopperCustomersTypes.Customer = {...baseCustomer, addresses: []}
            const options = createOptions<'createCustomerAddress'>(oldAddress)
            const data: DataType<Client['createCustomerAddress']> = oldAddress
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockMutationEndpoints(customersEndpoint, data) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            const {result, rerender, waitForValueToChange} = renderHookWithProviders(
                (props: {enabled: boolean} = {enabled: false}) => ({
                    customer: queries.useCustomer(queryOptions),
                    mutation: useShopperCustomersMutation('createCustomerAddress'),
                    // Initially disabled; not needed until after the creation mutation
                    query: queries.useCustomerAddress(queryOptions, props)
                })
            )

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(customer)
            expect(result.current.query.data).toBeUndefined()

            // 2. Do creation mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(data)
            assertInvalidateQuery(result.current.customer, customer)

            // 3. Re-render to validate the created resource was added to cache
            await rerender({enabled: true})
            await waitForValueToChange(() => result.current.query)
            assertUpdateQuery(result.current.query, data)
        })
        test('`createCustomerPaymentInstrument` updates cache on success', async () => {
            // 0. Setup
            const customer: ShopperCustomersTypes.Customer = {
                ...baseCustomer,
                paymentInstruments: []
            }
            const options = createOptions<'createCustomerPaymentInstrument'>({
                bankRoutingNumber: 'bank',
                giftCertificateCode: 'code',
                // Type assertion so we don't need the full type
                paymentCard: {} as ShopperCustomersTypes.CustomerPaymentCardRequest,
                paymentMethodId: 'paymentMethodId'
            })
            const data: DataType<Client['createCustomerPaymentInstrument']> = oldPaymentInstrument
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockMutationEndpoints(customersEndpoint, data) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            const {result, rerender, waitForValueToChange} = renderHookWithProviders(
                (props: {enabled: boolean} = {enabled: false}) => ({
                    customer: queries.useCustomer(queryOptions),
                    mutation: useShopperCustomersMutation('createCustomerPaymentInstrument'),
                    // Initially disabled; we don't want to trigger it until after the creation mutation
                    query: queries.useCustomerPaymentInstrument(queryOptions, props)
                })
            )

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(customer)
            expect(result.current.query.data).toBeUndefined()

            // 2. Do creation mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(data)
            assertInvalidateQuery(result.current.customer, customer)

            // 3. Re-render to validate the created resource was added to cache
            await rerender({enabled: true})
            await waitForValueToChange(() => result.current.query)
            assertUpdateQuery(result.current.query, data)
        })
        test('`deleteCustomerPaymentInstrument` updates cache on success', async () => {
            // 0. Setup
            const customer = baseCustomer
            const options = queryOptions // can be used for this mutation as it has no body
            const queryData = oldPaymentInstrument
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockQueryEndpoint(customersEndpoint, queryData) // query
            mockMutationEndpoints(customersEndpoint, {}) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                customer: queries.useCustomer(queryOptions),
                mutation: useShopperCustomersMutation('deleteCustomerPaymentInstrument'),
                query: queries.useCustomerPaymentInstrument(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(customer)
            expect(result.current.query.data).toEqual(queryData)

            // 2. Do deletion mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toBeUndefined()
            assertInvalidateQuery(result.current.customer, customer)
            assertRemoveQuery(result.current.query)
        })
        test('`removeCustomerAddress` updates cache on success', async () => {
            // 0. Setup
            const customer = baseCustomer
            const options = queryOptions // can be used for this mutation as it has no body
            const queryData = oldAddress
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockQueryEndpoint(customersEndpoint, queryData) // query
            mockMutationEndpoints(customersEndpoint, {}) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                customer: queries.useCustomer(queryOptions),
                mutation: useShopperCustomersMutation('removeCustomerAddress'),
                query: queries.useCustomerAddress(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(customer)
            expect(result.current.query.data).toEqual(queryData)

            // 2. Do deletion mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toBeUndefined()
            assertInvalidateQuery(result.current.customer, customer)
            assertRemoveQuery(result.current.query)
        })
        test('`updateCustomer` updates cache on success', async () => {
            // 0. Setup
            const oldCustomer = baseCustomer
            const body: ShopperCustomersTypes.Customer = {email: 'new@email'}
            const newCustomer = {...oldCustomer, ...body}
            const options = {body, parameters: PARAMETERS}
            mockQueryEndpoint(customersEndpoint, oldCustomer) // getCustomer
            mockMutationEndpoints(customersEndpoint, newCustomer) // this mutation
            mockQueryEndpoint(customersEndpoint, oldAddress) // query
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // query refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                customer: queries.useCustomer(queryOptions),
                mutation: useShopperCustomersMutation('updateCustomer'),
                query: queries.useCustomerAddress(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(oldCustomer)

            // 2. Do update mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(newCustomer)
            // `updateCustomer` invalidates all customer endpoints, which one we check isn't important
            // assertInvalidateQuery(result.current.query, oldAddress)
            // expect(result.current.customer.data).toEqual(newCustomer)
            assertUpdateQuery(result.current.customer, newCustomer)
        })
        test('`updateCustomerAddress` updates cache on success', async () => {
            const customer = baseCustomer
            const options = createOptions<'updateCustomerAddress'>(newAddress)
            const oldData = oldAddress
            const newData = newAddress
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockQueryEndpoint(customersEndpoint, oldData) // getCustomerAddress
            mockMutationEndpoints(customersEndpoint, newData) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomer refetch
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomerAddress refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                customer: queries.useCustomer(queryOptions),
                mutation: useShopperCustomersMutation('updateCustomerAddress'),
                query: queries.useCustomerAddress(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.customer)
            expect(result.current.customer.data).toEqual(customer)
            expect(result.current.query.data).toEqual(oldData)

            // 2. Do mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(newData)
            assertInvalidateQuery(result.current.customer, customer)
            assertUpdateQuery(result.current.query, newData)
        })
    })
    describe('modify a customer product list', () => {
        // TODO
    })
    describe('noops', () => {
        // TODO
    })
})
