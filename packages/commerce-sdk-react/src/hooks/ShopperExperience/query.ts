/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ResponseError, ShopperExperience} from 'commerce-sdk-isomorphic'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'
import {usePageDesignerParams} from './usePageDesignerParams'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_EXPERIENCE
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Get Page Designer pages.
 *
 * The results will apply the visibility rules for each page's components, such as personalization or scheduled visibility. Either `categoryId` or `productId` must be given in addition to `aspectTypeId`. Because only a single page-to-product and page-to-category assignment per aspect type can be authored today, the returned results contains one element at most.
 * **Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @group ShopperExperience
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Experience `getPages` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPages| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpages | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePages = (
    apiOptions: NullableParameters<Argument<Client['getPages']>>,
    queryOptions: ApiQueryOptions<Client['getPages']> = {}
): UseQueryResult<DataType<Client['getPages']>> => {
    type Options = Argument<Client['getPages']>
    type Data = DataType<Client['getPages']>
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getPages'
    const requiredParameters = ShopperExperience.paramKeys[`${methodName}Required`]
    const {mode, pdToken, pageId} = usePageDesignerParams()

    // Determine if we're in Page Designer mode (edit mode or preview with token)
    // When true, we use rawResponse to preserve all fields like designMetadata
    const isPageDesignerMode = !!(mode || pdToken)

    // Merge Page Designer params (mode, pdToken) from URL if present
    // Note: pageId is intentionally excluded as it's not an API parameter
    const apiOptionsWithPDParams = {
        ...apiOptions,
        parameters: {
            ...apiOptions.parameters
        }
    }

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptionsWithPDParams))
    const parameters = {
        ...pickValidParams(netOptions.parameters, ShopperExperience.paramKeys[methodName]),
        // Add Page Designer params after filtering - these are not officially part of the oas spec, since they are meant to be internal
        ...(mode && {mode}),
        ...(pdToken && {pdToken}),
        ...(pageId && {pageId})
    }
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    // When in Page Designer mode, use rawResponse: true to preserve all response fields
    const method = async (options: Options) => {
        if (isPageDesignerMode) {
            const response = await client[methodName](options, true)
            // rawResponse bypasses the SDK's throwOnBadResponse check, so we replicate it here
            // to ensure error responses surface as query errors rather than parsed "success" data.
            if (!response.ok && response.status !== 304) {
                throw new ResponseError(response)
            }
            // A 304 Not Modified (conditional request) carries no body, so response.json()
            // would reject with a SyntaxError. Return null instead of parsing an empty body.
            if (response.status === 304) {
                return null
            }
            return await response.json()
        }
        return await client[methodName](options)
    }

    queryOptions.meta = {
        displayName: 'usePages',
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
 * Get a Page Designer page based on a single page ID.
 *
 * The results will apply the visibility rules for the page's components, such as personalization or scheduled visibility.
 * **Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the page and components.
 * @group ShopperExperience
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Experience `getPage` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPage| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpage | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const usePage = (
    apiOptions: NullableParameters<Argument<Client['getPage']>>,
    queryOptions: ApiQueryOptions<Client['getPage']> = {}
): UseQueryResult<DataType<Client['getPage']>> => {
    type Options = Argument<Client['getPage']>
    type Data = DataType<Client['getPage']>
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getPage'
    const requiredParameters = ShopperExperience.paramKeys[`${methodName}Required`]
    const {mode, pdToken, pageId} = usePageDesignerParams()

    // Determine if we're in Page Designer mode (edit mode or preview with token)
    // When true, we use rawResponse to preserve all fields like designMetadata
    const isPageDesignerMode = Boolean(mode || pdToken)

    // Merge Page Designer params (mode, pdToken) from URL if present
    // Note: pageId is intentionally excluded as it's not an API parameter
    const apiOptionsWithPDParams = {
        ...apiOptions,
        parameters: {
            ...apiOptions.parameters
        }
    }

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptionsWithPDParams))
    const parameters = {
        ...pickValidParams(netOptions.parameters, ShopperExperience.paramKeys[methodName]),
        // Add Page Designer params after filtering - these are not officially part of the oas spec, since they are meant to be internal
        ...(mode && {mode}),
        ...(pdToken && {pdToken}),
        ...(pageId && {pageId})
    }
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    // When in Page Designer mode, use rawResponse: true to preserve all response fields that are not exposed at runtime
    // to improve performance and the size of the response
    const method = async (options: Options) => {
        if (isPageDesignerMode) {
            const response = await client[methodName](options, true)
            // rawResponse bypasses the SDK's throwOnBadResponse check, so we replicate it here
            // to ensure error responses surface as query errors rather than parsed "success" data.
            if (!response.ok && response.status !== 304) {
                throw new ResponseError(response)
            }
            // A 304 Not Modified (conditional request) carries no body, so response.json()
            // would reject with a SyntaxError. Return null instead of parsing an empty body.
            if (response.status === 304) {
                return null
            }
            return await response.json()
        }
        return await client[methodName](options)
    }

    queryOptions.meta = {
        displayName: 'usePage',
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
 * Get a Page Designer component based on a single component ID.
 *
 * The results will apply the visibility rules for the component's content, such as personalization or scheduled visibility.
 * **Important**: Because this resource uses the GET method, you must not pass sensitive data (payment card information, for example) and must not perform any transactional processes within the server-side scripts that are run for the component.
 * @group ShopperExperience
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Experience `getComponent` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getComponent| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getcomponent | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useComponent = (
    apiOptions: NullableParameters<Argument<Client['getComponent']>>,
    queryOptions: ApiQueryOptions<Client['getComponent']> = {}
): UseQueryResult<DataType<Client['getComponent']>> => {
    type Options = Argument<Client['getComponent']>
    type Data = DataType<Client['getComponent']>
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getComponent'
    const requiredParameters = ShopperExperience.paramKeys[`${methodName}Required`]
    const {mode, pdToken} = usePageDesignerParams()

    // Determine if we're in Page Designer mode (edit mode or preview with token)
    // When true, we use rawResponse to preserve all fields like designMetadata
    const isPageDesignerMode = Boolean(mode || pdToken)

    const apiOptionsWithPDParams = {
        ...apiOptions,
        parameters: {
            ...apiOptions.parameters
        }
    }

    // Parameters can be set in `apiOptions` or `client.clientConfig`;
    // we must merge them in order to generate the correct query key.
    const netOptions = omitNullableParameters(mergeOptions(client, apiOptionsWithPDParams))
    const parameters = {
        ...pickValidParams(netOptions.parameters, ShopperExperience.paramKeys[methodName]),
        // Add Page Designer params after filtering - these are not officially part of the oas spec, since they are meant to be internal
        ...(mode && {mode}),
        ...(pdToken && {pdToken})
    }
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    // We don't use `netOptions` here because we manipulate the options in `useQuery`.
    // When in Page Designer mode, use rawResponse: true to preserve all response fields that are not exposed at runtime
    const method = async (options: Options) => {
        if (isPageDesignerMode) {
            const response = await client[methodName](options, true)
            // rawResponse bypasses the SDK's throwOnBadResponse check, so we replicate it here
            // to ensure error responses surface as query errors rather than parsed "success" data.
            if (!response.ok && response.status !== 304) {
                throw new ResponseError(response)
            }
            // A 304 Not Modified (conditional request) carries no body, so response.json()
            // would reject with a SyntaxError. Return null instead of parsing an empty body.
            if (response.status === 304) {
                return null
            }
            return await response.json()
        }
        return await client[methodName](options)
    }

    queryOptions.meta = {
        displayName: 'useComponent',
        ...queryOptions.meta
    }

    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
