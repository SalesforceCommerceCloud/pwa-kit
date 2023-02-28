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
} as const
/** Options object that can be used for all query endpoints. */
const queryOptions = {parameters: PARAMETERS}
const oldAddress: ShopperCustomersTypes.CustomerAddress = {
    addressId: 'address',
    countryCode: 'CA',
    lastName: 'Doofenschmirtz'
}
const oldProductListItem: ShopperCustomersTypes.CustomerProductListItem = {
    id: 'itemId', // MUST match parameters
    priority: 0,
    public: false,
    quantity: 0
}
const basePaymentInstrument: ShopperCustomersTypes.CustomerPaymentInstrument = {
    paymentBankAccount: {},
    paymentCard: {cardType: 'fake'},
    paymentInstrumentId: 'paymentInstrumentId',
    paymentMethodId: 'paymentMethodId'
}
const baseCustomer: RequireKeys<
    ShopperCustomersTypes.Customer,
    'addresses' | 'paymentInstruments'
> = {
    customerId: 'customerId',
    addresses: [oldAddress],
    paymentInstruments: [basePaymentInstrument]
}
const baseProductList = {
    id: 'listId', // MUST match parameters used
    customerProductListItems: [oldProductListItem]
}
const emptyListResult: ShopperCustomersTypes.CustomerProductListResult = {
    data: [],
    limit: 0,
    total: 0
}
const baseListResult: ShopperCustomersTypes.CustomerProductListResult = {
    data: [baseProductList],
    limit: 1,
    total: 1
}

const createOptions = <Mut extends ShopperCustomersMutation>(
    body: Argument<Client[Mut]> extends {body: infer B} ? B : undefined
): Argument<Client[Mut]> => ({...queryOptions, body})

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
            const data: DataType<Client['createCustomerPaymentInstrument']> = basePaymentInstrument
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
            const options = queryOptions // Can be used for this mutation as it has no body
            const data = basePaymentInstrument
            mockQueryEndpoint(customersEndpoint, customer) // getCustomer
            mockQueryEndpoint(customersEndpoint, data) // query
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
            expect(result.current.query.data).toEqual(data)

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
            const oldData = oldAddress
            const newData: ShopperCustomersTypes.CustomerAddress = {
                addressId: 'address',
                countryCode: 'US',
                lastName: 'Doofenschmirtz'
            }
            const options = createOptions<'updateCustomerAddress'>(newData)
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
        test('`createCustomerProductList` updates cache on success', async () => {
            const listResult = emptyListResult
            const data: ShopperCustomersTypes.CustomerProductList = {
                id: 'listId', // MUST match parameters used
                customerProductListItems: []
            }
            const options = createOptions<'createCustomerProductList'>(data)
            mockQueryEndpoint(customersEndpoint, listResult) // getCustomerProductLists
            mockMutationEndpoints(customersEndpoint, data) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomerProductList refetch
            const {result, rerender, waitForValueToChange} = renderHookWithProviders(
                (props: {enabled: boolean} = {enabled: false}) => ({
                    lists: queries.useCustomerProductLists(queryOptions),
                    mutation: useShopperCustomersMutation('createCustomerProductList'),
                    // Initially disabled; not needed until after the creation mutation
                    query: queries.useCustomerProductList(queryOptions, props)
                })
            )

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.lists)
            expect(result.current.lists.data).toEqual(listResult)
            expect(result.current.query.data).toBeUndefined()

            // 2. Do creation mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(data)
            assertInvalidateQuery(result.current.lists, listResult)

            // 3. Re-render to validate the created resource was added to cache
            await rerender({enabled: true})
            await waitForValueToChange(() => result.current.query)
            assertUpdateQuery(result.current.query, data)
        })
        test('`createCustomerProductListItem` updates cache on success', async () => {
            const data = oldProductListItem
            const list = emptyListResult
            const listResult = emptyListResult
            const options = createOptions<'createCustomerProductListItem'>(data)
            mockQueryEndpoint(customersEndpoint, list) // getCustomerProductList
            mockQueryEndpoint(customersEndpoint, listResult) // getCustomerProductLists
            mockMutationEndpoints(customersEndpoint, data) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomerProductList refetch
            mockQueryEndpoint(customersEndpoint, {test: 'use this? should not be!'}) // getCustomerProductLists refetch
            const {result, rerender, waitForValueToChange} = renderHookWithProviders(
                (props: {enabled: boolean} = {enabled: false}) => ({
                    list: queries.useCustomerProductList(queryOptions),
                    lists: queries.useCustomerProductLists(queryOptions),
                    mutation: useShopperCustomersMutation('createCustomerProductListItem'),
                    // Initially disabled; not needed until after the creation mutation
                    query: queries.useCustomerProductListItem(queryOptions, props)
                })
            )

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.lists)
            expect(result.current.list.data).toEqual(list)
            expect(result.current.lists.data).toEqual(listResult)
            expect(result.current.query.data).toBeUndefined()

            // 2. Do creation mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(data)
            assertInvalidateQuery(result.current.list, list)
            assertInvalidateQuery(result.current.lists, listResult)

            // 3. Re-render to validate the created resource was added to cache
            await rerender({enabled: true})
            await waitForValueToChange(() => result.current.query)
            assertUpdateQuery(result.current.query, data)
        })
        test.only('`deleteCustomerProductListItem` updates cache on success', async () => {
            const data = oldProductListItem
            const list = baseProductList
            const listResult = baseListResult
            const options = queryOptions // Can be used for this mutation as it has no body
            mockQueryEndpoint(customersEndpoint, list) // getCustomerProductList
            mockQueryEndpoint(customersEndpoint, listResult) // getCustomerProductLists
            mockQueryEndpoint(customersEndpoint, data) // getCustomerProductListItem
            mockMutationEndpoints(customersEndpoint, {}) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomerProductList refetch
            mockQueryEndpoint(customersEndpoint, {test: 'use this? should not be!'}) // getCustomerProductLists refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                list: queries.useCustomerProductList(queryOptions),
                lists: queries.useCustomerProductLists(queryOptions),
                mutation: useShopperCustomersMutation('deleteCustomerProductListItem'),
                query: queries.useCustomerProductListItem(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.lists)
            expect(result.current.list.data).toEqual(list)
            expect(result.current.lists.data).toEqual(listResult)
            expect(result.current.query.data).toEqual(data)

            // 2. Do deletion mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toBeUndefined()
            assertInvalidateQuery(result.current.list, list)
            assertInvalidateQuery(result.current.lists, listResult)
            assertRemoveQuery(result.current.query)
        })
        test('`updateCustomerProductListItem` updates cache on success', async () => {
            const oldData = oldProductListItem
            const newData: ShopperCustomersTypes.CustomerProductListItem = {
                id: 'itemId', // MUST match parameters
                priority: 1,
                public: false,
                quantity: 1
            }
            const list = baseProductList
            const listResult = baseListResult
            const options = createOptions<'updateCustomerProductListItem'>(newData)
            mockQueryEndpoint(customersEndpoint, list) // getCustomerProductList
            mockQueryEndpoint(customersEndpoint, listResult) // getCustomerProductLists
            mockQueryEndpoint(customersEndpoint, oldData) // getCustomerProductListItem
            mockMutationEndpoints(customersEndpoint, newData) // this mutation
            mockQueryEndpoint(customersEndpoint, {test: 'this should not get used'}) // getCustomerProductList refetch
            mockQueryEndpoint(customersEndpoint, {test: 'use this? should not be!'}) // getCustomerProductLists refetch
            const {result, waitForValueToChange} = renderHookWithProviders(() => ({
                list: queries.useCustomerProductList(queryOptions),
                lists: queries.useCustomerProductLists(queryOptions),
                mutation: useShopperCustomersMutation('updateCustomerProductListItem'),
                query: queries.useCustomerProductListItem(queryOptions)
            }))

            // 1. Populate cache with initial data
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.lists)
            expect(result.current.list.data).toEqual(list)
            expect(result.current.lists.data).toEqual(listResult)
            expect(result.current.query.data).toEqual(oldData)

            // 2. Do update mutation
            act(() => result.current.mutation.mutate(options))
            await waitAndExpectSuccess(waitForValueToChange, () => result.current.mutation)
            expect(result.current.mutation.data).toEqual(newData)
            assertInvalidateQuery(result.current.list, list)
            assertInvalidateQuery(result.current.lists, listResult)
            assertUpdateQuery(result.current.query, newData)
        })
    })
    describe('simple mutations (no cache updates)', () => {
        /** `void` doesn't play nice as a value, so just replace it with `undefined`. */
        type FixVoid<T> = void extends T ? undefined : T
        type TestMap = {
            [Mut in ShopperCustomersMutation]?: [
                Argument<Client[Mut]>,
                FixVoid<DataType<Client[Mut]>>
            ]
        }
        // Using an object, rather than array, to more easily manage data values
        const testMap: TestMap = {
            getResetPasswordToken: [
                createOptions<'getResetPasswordToken'>({login: 'login'}),
                {email: 'customer@email', expiresInMinutes: 10, login: 'login', resetToken: 'token'}
            ],
            registerCustomer: [
                createOptions<'registerCustomer'>({customer: {}, password: 'hunter2'}),
                {customerId: 'customerId'}
            ],
            resetPassword: [
                createOptions<'resetPassword'>({
                    resetToken: 'token',
                    newPassword: 'hunter3',
                    login: 'login'
                }),
                undefined
            ]
        }
        // Type assertion because `Object.entries` is limited :\
        const testCases = Object.entries(testMap) as [
            ShopperCustomersMutation,
            NonNullable<TestMap[ShopperCustomersMutation]>
        ][]
        test.each(testCases)(
            '`%s` returns data on success',
            async (mutationName, [options, data]) => {
                mockMutationEndpoints(customersEndpoint, data ?? {}) // Fallback for `void` endpoints
                const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
                    return useShopperCustomersMutation(mutationName)
                })
                act(() => result.current.mutate(options))
                await waitAndExpectSuccess(wait, () => result.current)
                expect(result.current.data).toEqual(data)
            }
        )
    })
})
