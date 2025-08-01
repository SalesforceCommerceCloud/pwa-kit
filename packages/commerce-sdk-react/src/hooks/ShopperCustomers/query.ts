/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'
import pkg from "commerce-sdk-isomorphic";
const { helpers } = pkg;

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CUSTOMERS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

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
//     const client = useCommerceApi('shopperCustomers')
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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

export const useSomOrder = () => {
    const clientConfig = {
        parameters: {
          clientId: "<your-client-id>",
          organizationId: "<your-org-id>",
          shortCode: "kv7kzm78",
          siteId: "<your-site-id>",
        },
        // If not provided, it'll use the default production URI:
        // 'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}'
        // path parameters should be wrapped in curly braces like the default production URI
        baseUri: "https://kv7kzm78.api.commercecloud.salesforce.com/custom/orders/v1",
      };
      
      // Required params: apiName, endpointPath, shortCode, organizaitonId
      // Required path params can be passed into:
      // options.customApiPathParameters or clientConfig.parameters
      const customApiPathParameters = {
        apiName: "orders",
        apiVersion: "v1", // defaults to v1 if not provided
        endpointPath: "getOrder",
      };

      const accessToken = "eyJ2ZXIiOiIxLjAiLCJqa3UiOiJzbGFzL3Byb2QvenpyZl8wMTciLCJraWQiOiJmNmFhN2Q3MS00Nzc0LTRhNjMtYmNmNS05ZTBlN2QxZjQ5N2MiLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1kaXNjb3Zlcnktc2VhcmNoIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBjX29yZGVycyBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLXN0b3JlcyBjX3Jldmlld3Mgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItbXlhY2NvdW50LmFkZHJlc3Nlcy5ydyBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cy5ydyBzZmNjLnNob3BwZXItcHJvZHVjdGxpc3RzIHNmY2Muc2hvcHBlci1wcm9tb3Rpb25zIHNmY2Muc2hvcHBlci1iYXNrZXRzLW9yZGVycy5ydyBzZmNjLnNob3BwZXItZ2lmdC1jZXJ0aWZpY2F0ZXMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3Qtc2VhcmNoIHNmY2Muc2hvcHBlci1jYXRlZ29yaWVzIiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMTc6OnNjaWQ6YmMwM2E3OTYtMjhjNS00MGExLWFjMGMtNWEwY2NkMTBjMTZiOjp1c2lkOjg5ZmU4OGQzLWQxOWUtNDVlNS04ZDFkLTllYmI5ODg4MDEyMSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMTciLCJpc3QiOjEsImRudCI6IjAiLCJhdWQiOiJjb21tZXJjZWNsb3VkL3Byb2QvenpyZl8wMTciLCJuYmYiOjE3NTQwNzY2MzAsInN0eSI6IlVzZXIiLCJpc2IiOiJ1aWRvOnNsYXM6OnVwbjpHdWVzdDo6dWlkbjpHdWVzdCBVc2VyOjpnY2lkOmFibWJKS3hyRTJ4YmtSeGJjM3hxWVlsdXNaOjpjaGlkOlJlZkFyY2giLCJleHAiOjE3NTQwNzg0NjAsImlhdCI6MTc1NDA3NjY2MCwianRpIjoiQzJDNDg1NjIwMjIzMC0xODkwNjc4ODY2MzI3NTExNjE0OTg1NTk1NjQifQ.EG4xg_lqM2S-pCnxCrlq3PyU9X7rQAVjDhM0jn0X7QkzwG4QTSh_kyK77AOZOSHT6vLJmk_LerKUyl7vLncu2g";

    return helpers.callCustomEndpoint({
    options: {
        method: "GET",
        parameters: {
        queryParameter: "queryParameter1",
        },
        headers: {
        // Content-Type is defaulted to application/json if not provided
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
        },
        customApiPathParameters,
    },
    clientConfig,
    });
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
    const client = useCommerceApi(CLIENT_KEY)
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
