/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {ApiClients, Argument, DataType, MergedOptions} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'

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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getExternalProfile']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getExternalProfile']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getExternalProfile']>) => client.getExternalProfile(arg)
    const requiredParameters = [
        'organizationId',
        'externalId',
        'authenticationProviderId',
        'siteId'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getExternalProfile']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/external-profile',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomer']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomer']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomer']>) => client.getCustomer(arg)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({parameters}: MergedOptions<Client, Argument<Client['getCustomer']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomerAddress']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomerAddress']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerAddress']>) => client.getCustomerAddress(arg)
    const requiredParameters = ['organizationId', 'customerId', 'addressName', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerAddress']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/addresses/',
            parameters.addressName,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomerBaskets']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomerBaskets']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerBaskets']>) => client.getCustomerBaskets(arg)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerBaskets']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/baskets',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomerOrders']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomerOrders']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerOrders']>) => client.getCustomerOrders(arg)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerOrders']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/orders',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getCustomerPaymentInstrument']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getCustomerPaymentInstrument']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerPaymentInstrument']>) =>
        client.getCustomerPaymentInstrument(arg)
    const requiredParameters = [
        'organizationId',
        'customerId',
        'paymentInstrumentId',
        'siteId'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerPaymentInstrument']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/payment-instruments/',
            parameters.paymentInstrumentId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomerProductLists']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomerProductLists']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerProductLists']>) =>
        client.getCustomerProductLists(arg)
    const requiredParameters = ['organizationId', 'customerId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerProductLists']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/product-lists',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getCustomerProductList']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getCustomerProductList']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerProductList']>) =>
        client.getCustomerProductList(arg)
    const requiredParameters = ['organizationId', 'customerId', 'listId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerProductList']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/product-lists/',
            parameters.listId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getCustomerProductListItem']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getCustomerProductListItem']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getCustomerProductListItem']>) =>
        client.getCustomerProductListItem(arg)
    const requiredParameters = [
        'organizationId',
        'customerId',
        'listId',
        'itemId',
        'siteId'
    ] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getCustomerProductListItem']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/customers/',
            parameters.customerId,
            '/product-lists/',
            parameters.listId,
            '/items/',
            parameters.itemId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<
        UseQueryOptions<DataType<Client['getPublicProductListsBySearchTerm']>>,
        'queryFn'
    > = {}
): UseQueryResult<DataType<Client['getPublicProductListsBySearchTerm']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPublicProductListsBySearchTerm']>) =>
        client.getPublicProductListsBySearchTerm(arg)
    const requiredParameters = ['organizationId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getPublicProductListsBySearchTerm']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/product-lists',
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getPublicProductList']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getPublicProductList']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getPublicProductList']>) =>
        client.getPublicProductList(arg)
    const requiredParameters = ['organizationId', 'listId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getPublicProductList']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/product-lists/',
            parameters.listId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
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
    queryOptions: Omit<UseQueryOptions<DataType<Client['getProductListItem']>>, 'queryFn'> = {}
): UseQueryResult<DataType<Client['getProductListItem']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    const method = (arg: Argument<Client['getProductListItem']>) => client.getProductListItem(arg)
    const requiredParameters = ['organizationId', 'listId', 'itemId', 'siteId'] as const
    // Parameters can be set in `apiOptions` or `client.clientConfig`; they are merged in the helper
    // hook, so we use a callback here that receives that merged object.
    const getQueryKey = ({
        parameters
    }: MergedOptions<Client, Argument<Client['getProductListItem']>>) =>
        [
            '/organizations/',
            parameters.organizationId,
            '/product-lists/',
            parameters.listId,
            '/items/',
            parameters.itemId,
            // Full parameters last for easy lookup
            parameters
        ] as const

    return useQuery(apiOptions, queryOptions, {
        client,
        method,
        requiredParameters,
        getQueryKey
    })
}
