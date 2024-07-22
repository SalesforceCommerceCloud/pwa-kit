/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import useCommerceApi from '../useCommerceApi'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

type Client = ApiClients['shopperCustomers']

// TODO: Re-implement (and update description from RAML spec) when the endpoint exits closed beta.
// /**
//  * Gets the new external profile for a customer.This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
//  * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
//  * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
//  * @returns A TanStack Query query hook with data from the Shopper Customers `getExternalProfile` endpoint.
//  * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getExternalProfile| Salesforce Developer Center} for more information about the API endpoint.
//  * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getexternalprofile | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
//  * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
//  */
// export const useExternalProfile = (
//     apiOptions: NullableParameters<Argument<Client['getExternalProfile']>>,
//     queryOptions: ApiQueryOptions<Client['getExternalProfile']> = {}
// ): UseQueryResult<DataType<Client['getExternalProfile']>> => {
//     type Options = Argument<Client['getExternalProfile']>
//     type Data = DataType<Client['getExternalProfile']>
//     const {shopperCustomers: client} = useCommerceApi()
//     const methodName = 'getExternalProfile'
//     const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

//     // Parameters can be set in `apiOptions` or `client.clientConfig`;
//     // we must merge them in order to generate the correct query key.
//     const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
//     const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
//     // We don't use `netOptions` here because we manipulate the options in `useQuery`.
//     const method = async (options: Options) => await client[methodName](options)

//     // For some reason, if we don't explicitly set these generic parameters, the inferred type for
//     // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
//     return useQuery<Client, Options, Data>(netOptions, queryOptions, {
//         method,
//         queryKey,
//         requiredParameters
//     })
// }

/**
 * Gets a customer's information.
 *
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomer` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomer = (
    apiOptions: NullableParameters<Argument<Client['getCustomer']>>,
    queryOptions: ApiQueryOptions<Client['getCustomer']> = {}
): UseQueryResult<DataType<Client['getCustomer']>> => {
    type Options = Argument<Client['getCustomer']>
    type Data = DataType<Client['getCustomer']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomer'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomer',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a customer's address by address name.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerAddress` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerAddress = (
    apiOptions: NullableParameters<Argument<Client['getCustomerAddress']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerAddress']> = {}
): UseQueryResult<DataType<Client['getCustomerAddress']>> => {
    type Options = Argument<Client['getCustomerAddress']>
    type Data = DataType<Client['getCustomerAddress']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerAddress'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerAddress',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Gets the baskets of a customer.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerBaskets` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerBaskets = (
    apiOptions: NullableParameters<Argument<Client['getCustomerBaskets']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerBaskets']> = {}
): UseQueryResult<DataType<Client['getCustomerBaskets']>> => {
    type Options = Argument<Client['getCustomerBaskets']>
    type Data = DataType<Client['getCustomerBaskets']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerBaskets'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerBaskets',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns a pageable list of all customer's orders.
 *
 * The default page size is 10.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerOrders` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerOrders = (
    apiOptions: NullableParameters<Argument<Client['getCustomerOrders']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerOrders']> = {}
): UseQueryResult<DataType<Client['getCustomerOrders']>> => {
    type Options = Argument<Client['getCustomerOrders']>
    type Data = DataType<Client['getCustomerOrders']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerOrders'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the option in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerOrders',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a customer's payment instrument by its ID.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerPaymentInstrument` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerPaymentInstrument = (
    apiOptions: NullableParameters<Argument<Client['getCustomerPaymentInstrument']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerPaymentInstrument']> = {}
): UseQueryResult<DataType<Client['getCustomerPaymentInstrument']>> => {
    type Options = Argument<Client['getCustomerPaymentInstrument']>
    type Data = DataType<Client['getCustomerPaymentInstrument']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerPaymentInstrument'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerPaymentInstrument',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns all customer product lists.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductLists` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductLists = (
    apiOptions: NullableParameters<Argument<Client['getCustomerProductLists']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductLists']> = {}
): UseQueryResult<DataType<Client['getCustomerProductLists']>> => {
    type Options = Argument<Client['getCustomerProductLists']>
    type Data = DataType<Client['getCustomerProductLists']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductLists'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerProductLists',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns a customer product list of the given customer and the items in the list.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductList = (
    apiOptions: NullableParameters<Argument<Client['getCustomerProductList']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductList']> = {}
): UseQueryResult<DataType<Client['getCustomerProductList']>> => {
    type Options = Argument<Client['getCustomerProductList']>
    type Data = DataType<Client['getCustomerProductList']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductList'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerProductList',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getCustomerProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useCustomerProductListItem = (
    apiOptions: NullableParameters<Argument<Client['getCustomerProductListItem']>>,
    queryOptions: ApiQueryOptions<Client['getCustomerProductListItem']> = {}
): UseQueryResult<DataType<Client['getCustomerProductListItem']>> => {
    type Options = Argument<Client['getCustomerProductListItem']>
    type Data = DataType<Client['getCustomerProductListItem']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getCustomerProductListItem'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useCustomerProductListItem',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductListsBySearchTerm` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductListsBySearchTerm = (
    apiOptions: NullableParameters<Argument<Client['getPublicProductListsBySearchTerm']>>,
    queryOptions: ApiQueryOptions<Client['getPublicProductListsBySearchTerm']> = {}
): UseQueryResult<DataType<Client['getPublicProductListsBySearchTerm']>> => {
    type Options = Argument<Client['getPublicProductListsBySearchTerm']>
    type Data = DataType<Client['getPublicProductListsBySearchTerm']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getPublicProductListsBySearchTerm'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'usePublicProductListsBySearchTerm',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves a public product list by ID and the items under that product list.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getPublicProductList` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePublicProductList = (
    apiOptions: NullableParameters<Argument<Client['getPublicProductList']>>,
    queryOptions: ApiQueryOptions<Client['getPublicProductList']> = {}
): UseQueryResult<DataType<Client['getPublicProductList']>> => {
    type Options = Argument<Client['getPublicProductList']>
    type Data = DataType<Client['getPublicProductList']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getPublicProductList'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'usePublicProductList',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
/**
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @group ShopperCustomers
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Customers `getProductListItem` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useProductListItem = (
    apiOptions: NullableParameters<Argument<Client['getProductListItem']>>,
    queryOptions: ApiQueryOptions<Client['getProductListItem']> = {}
): UseQueryResult<DataType<Client['getProductListItem']>> => {
    type Options = Argument<Client['getProductListItem']>
    type Data = DataType<Client['getProductListItem']>
    const {shopperCustomers: client} = useCommerceApi()
    const methodName = 'getProductListItem'
    const requiredParameters = ShopperCustomers.paramKeys[`${methodName}Required`]

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperCustomers.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useProductListItem',
        ...queryOptions.meta
    }

    // For some reason, if we don't explicitly set these generic parameters, the inferred type for
    // `Data` sometimes, but not always, includes `Response`, which is incorrect. I don't know why.
    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
