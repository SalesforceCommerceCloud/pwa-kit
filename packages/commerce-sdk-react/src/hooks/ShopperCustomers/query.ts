/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperCustomers']

/**
 * Gets the new external profile for a customer.This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
 * @returns A TanStack Query query hook with data from the Shopper Customers `getExternalProfile` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getExternalProfile| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getexternalprofile | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useExternalProfile = (
    apiOptions: Argument<Client['getExternalProfile']>,
    queryOptions: ApiQueryOptions<Client['getExternalProfile']> = {}
): UseQueryResult<DataType<Client['getExternalProfile']>> => {
    type Options = Argument<Client['getExternalProfile']>
    type Data = DataType<Client['getExternalProfile']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getExternalProfile'
    const requiredParameters = [
        'organizationId',
        'externalId',
        'authenticationProviderId',
        'siteId'
    ] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Gets a customer with all existing addresses and payment instruments associated with the requested customer.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomer` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomer = (
    apiOptions: Argument<Client['getCustomer']>,
    queryOptions: ApiQueryOptions<Client['getCustomer']> = {}
): UseQueryResult<DataType<Client['getCustomer']>> => {
    type Options = Argument<Client['getCustomer']>
    type Data = DataType<Client['getCustomer']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomer'
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a customer's address by address name.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerAddress` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerAddress = (
    apiOptions: Argument<Client['getCustomerAddress']>,
    queryOptions: ApiQueryOptions<Client['getCustomerAddress']> = {}
): UseQueryResult<DataType<Client['getCustomerAddress']>> => {
    type Options = Argument<Client['getCustomerAddress']>
    type Data = DataType<Client['getCustomerAddress']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerAddress'
    const requiredParameters = ['organizationId', 'customerId', 'addressName', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Gets the baskets of a customer.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerBaskets` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerBaskets = (
    apiOptions: Argument<Client['getCustomerBaskets']>,
    queryOptions: ApiQueryOptions<Client['getCustomerBaskets']> = {}
): UseQueryResult<DataType<Client['getCustomerBaskets']>> => {
    type Options = Argument<Client['getCustomerBaskets']>
    type Data = DataType<Client['getCustomerBaskets']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerBaskets'
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns a pageable list of all customer's orders. The default page size is 10.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerOrders` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerOrders = (
    apiOptions: Argument<Client['getCustomerOrders']>,
    queryOptions: ApiQueryOptions<Client['getCustomerOrders']> = {}
): UseQueryResult<DataType<Client['getCustomerOrders']>> => {
    type Options = Argument<Client['getCustomerOrders']>
    type Data = DataType<Client['getCustomerOrders']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerOrders'
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a customer's payment instrument by its ID.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerPaymentInstrument` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerPaymentInstrument = (
    apiOptions: Argument<Client['getCustomerPaymentInstrument']>,
    queryOptions: ApiQueryOptions<Client['getCustomerPaymentInstrument']> = {}
): UseQueryResult<DataType<Client['getCustomerPaymentInstrument']>> => {
    type Options = Argument<Client['getCustomerPaymentInstrument']>
    type Data = DataType<Client['getCustomerPaymentInstrument']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerPaymentInstrument'
    const requiredParameters = [
        'organizationId',
        'customerId',
        'paymentInstrumentId',
        'siteId'
    ] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns all customer product lists.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductLists` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductLists = (
    apiOptions: Argument<Client['getCustomerProductLists']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductLists']> = {}
): UseQueryResult<DataType<Client['getCustomerProductLists']>> => {
    type Options = Argument<Client['getCustomerProductLists']>
    type Data = DataType<Client['getCustomerProductLists']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductLists'
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns a customer product list of the given customer and the items in the list.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductList = (
    apiOptions: Argument<Client['getCustomerProductList']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductList']> = {}
): UseQueryResult<DataType<Client['getCustomerProductList']>> => {
    type Options = Argument<Client['getCustomerProductList']>
    type Data = DataType<Client['getCustomerProductList']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductList'
    const requiredParameters = ['organizationId', 'customerId', 'listId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductListItem = (
    apiOptions: Argument<Client['getCustomerProductListItem']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductListItem']> = {}
): UseQueryResult<DataType<Client['getCustomerProductListItem']>> => {
    type Options = Argument<Client['getCustomerProductListItem']>
    type Data = DataType<Client['getCustomerProductListItem']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductListItem'
    const requiredParameters = [
        'organizationId',
        'customerId',
        'listId',
        'itemId',
        'siteId'
    ] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductListsBySearchTerm` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductListsBySearchTerm = (
    apiOptions: Argument<Client['getPublicProductListsBySearchTerm']>,
    queryOptions: ApiQueryOptions<Client['getPublicProductListsBySearchTerm']> = {}
): UseQueryResult<DataType<Client['getPublicProductListsBySearchTerm']>> => {
    type Options = Argument<Client['getPublicProductListsBySearchTerm']>
    type Data = DataType<Client['getPublicProductListsBySearchTerm']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getPublicProductListsBySearchTerm'
    const requiredParameters = ['organizationId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a public product list by ID and the items under that product list.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductList = (
    apiOptions: Argument<Client['getPublicProductList']>,
    queryOptions: ApiQueryOptions<Client['getPublicProductList']> = {}
): UseQueryResult<DataType<Client['getPublicProductList']>> => {
    type Options = Argument<Client['getPublicProductList']>
    type Data = DataType<Client['getPublicProductList']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getPublicProductList'
    const requiredParameters = ['organizationId', 'listId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useProductListItem = (
    apiOptions: Argument<Client['getProductListItem']>,
    queryOptions: ApiQueryOptions<Client['getProductListItem']> = {}
): UseQueryResult<DataType<Client['getProductListItem']>> => {
    type Options = Argument<Client['getProductListItem']>
    type Data = DataType<Client['getProductListItem']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getProductListItem'
    const requiredParameters = ['organizationId', 'listId', 'itemId', 'siteId'] as const

    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Options, Data>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
