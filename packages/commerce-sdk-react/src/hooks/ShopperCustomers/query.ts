/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ApiClients, ApiQueryKey, ApiQueryOptions, Argument, DataType} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions} from '../utils'

type Client = ApiClients['shopperCustomers']

/**
 * A hook for `ShopperCustomers#getExternalProfile`.
 * Gets the new external profile for a customer.This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getExternalProfile} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getexternalprofile} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useExternalProfile = (
    apiOptions: Argument<Client['getExternalProfile']>,
    queryOptions: ApiQueryOptions<Client['getExternalProfile']> = {}
): UseQueryResult<DataType<Client['getExternalProfile']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getExternalProfile']>) =>
        await client.getExternalProfile(options)
    const requiredParameters = [
        'organizationId',
        'externalId',
        'authenticationProviderId',
        'siteId'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/external-profile',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getExternalProfile']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomer`.
 * Gets a customer with all existing addresses and payment instruments associated with the requested customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomer = (
    apiOptions: Argument<Client['getCustomer']>,
    queryOptions: ApiQueryOptions<Client['getCustomer']> = {}
): UseQueryResult<DataType<Client['getCustomer']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomer']>) =>
        await client.getCustomer(options)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomer']>>(netOptions, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * A hook for `ShopperCustomers#getCustomerAddress`.
 * Retrieves a customer's address by address name.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerAddress = (
    apiOptions: Argument<Client['getCustomerAddress']>,
    queryOptions: ApiQueryOptions<Client['getCustomerAddress']> = {}
): UseQueryResult<DataType<Client['getCustomerAddress']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerAddress']>) =>
        await client.getCustomerAddress(options)
    const requiredParameters = ['organizationId', 'customerId', 'addressName', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/addresses/',
        parameters.addressName,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerAddress']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerBaskets`.
 * Gets the baskets of a customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerBaskets = (
    apiOptions: Argument<Client['getCustomerBaskets']>,
    queryOptions: ApiQueryOptions<Client['getCustomerBaskets']> = {}
): UseQueryResult<DataType<Client['getCustomerBaskets']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerBaskets']>) =>
        await client.getCustomerBaskets(options)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/baskets',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerBaskets']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerOrders`.
 * Returns a pageable list of all customer's orders. The default page size is 10.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerOrders = (
    apiOptions: Argument<Client['getCustomerOrders']>,
    queryOptions: ApiQueryOptions<Client['getCustomerOrders']> = {}
): UseQueryResult<DataType<Client['getCustomerOrders']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerOrders']>) =>
        await client.getCustomerOrders(options)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/orders',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerOrders']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerPaymentInstrument`.
 * Retrieves a customer's payment instrument by its ID.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerPaymentInstrument = (
    apiOptions: Argument<Client['getCustomerPaymentInstrument']>,
    queryOptions: ApiQueryOptions<Client['getCustomerPaymentInstrument']> = {}
): UseQueryResult<DataType<Client['getCustomerPaymentInstrument']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerPaymentInstrument']>) =>
        await client.getCustomerPaymentInstrument(options)
    const requiredParameters = [
        'organizationId',
        'customerId',
        'paymentInstrumentId',
        'siteId'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/payment-instruments/',
        parameters.paymentInstrumentId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerPaymentInstrument']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerProductLists`.
 * Returns all customer product lists.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductLists = (
    apiOptions: Argument<Client['getCustomerProductLists']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductLists']> = {}
): UseQueryResult<DataType<Client['getCustomerProductLists']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerProductLists']>) =>
        await client.getCustomerProductLists(options)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/product-lists',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerProductLists']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerProductList`.
 * Returns a customer product list of the given customer and the items in the list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductList = (
    apiOptions: Argument<Client['getCustomerProductList']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductList']> = {}
): UseQueryResult<DataType<Client['getCustomerProductList']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerProductList']>) =>
        await client.getCustomerProductList(options)
    const requiredParameters = ['organizationId', 'customerId', 'listId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/product-lists/',
        parameters.listId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerProductList']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getCustomerProductListItem`.
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductListItem = (
    apiOptions: Argument<Client['getCustomerProductListItem']>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductListItem']> = {}
): UseQueryResult<DataType<Client['getCustomerProductListItem']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getCustomerProductListItem']>) =>
        await client.getCustomerProductListItem(options)
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
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/customers/',
        parameters.customerId,
        '/product-lists/',
        parameters.listId,
        '/items/',
        parameters.itemId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getCustomerProductListItem']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getPublicProductListsBySearchTerm`.
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePublicProductListsBySearchTerm = (
    apiOptions: Argument<Client['getPublicProductListsBySearchTerm']>,
    queryOptions: ApiQueryOptions<Client['getPublicProductListsBySearchTerm']> = {}
): UseQueryResult<DataType<Client['getPublicProductListsBySearchTerm']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getPublicProductListsBySearchTerm']>) =>
        await client.getPublicProductListsBySearchTerm(options)
    const requiredParameters = ['organizationId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/product-lists',
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getPublicProductListsBySearchTerm']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getPublicProductList`.
 * Retrieves a public product list by ID and the items under that product list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePublicProductList = (
    apiOptions: Argument<Client['getPublicProductList']>,
    queryOptions: ApiQueryOptions<Client['getPublicProductList']> = {}
): UseQueryResult<DataType<Client['getPublicProductList']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getPublicProductList']>) =>
        await client.getPublicProductList(options)
    const requiredParameters = ['organizationId', 'listId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/product-lists/',
        parameters.listId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getPublicProductList']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
/**
 * A hook for `ShopperCustomers#getProductListItem`.
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProductListItem = (
    apiOptions: Argument<Client['getProductListItem']>,
    queryOptions: ApiQueryOptions<Client['getProductListItem']> = {}
): UseQueryResult<DataType<Client['getProductListItem']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = async (options: Argument<Client['getProductListItem']>) =>
        await client.getProductListItem(options)
    const requiredParameters = ['organizationId', 'listId', 'itemId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`, we must merge them in order
    // to generate the correct query key.
    const netOptions = mergeOptions(client, apiOptions)
    const {parameters} = netOptions
    const queryKey: ApiQueryKey<typeof parameters> = [
        '/organizations/',
        parameters.organizationId,
        '/product-lists/',
        parameters.listId,
        '/items/',
        parameters.itemId,
        parameters
    ]

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<typeof netOptions, DataType<Client['getProductListItem']>>(
        netOptions,
        queryOptions,
        {
            method,
            queryKey,
            requiredParameters
        }
    )
}
