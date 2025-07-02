/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DefaultError, UseQueryResult} from '@tanstack/react-query'
import {
    ApiClients,
    ApiMethod,
    ApiQueryOptions,
    Argument,
    DataType,
    MergedOptions,
    NullableParameters,
    OmitNullableParameters
} from './types'
import useCommerceApi from './useCommerceApi'
import {useQuery} from './useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from './utils'

/**
 * Type to identify client methods that are functions
 */
export type MethodsOf<C> = {
    [K in keyof C]: C[K] extends ApiMethod<any, any> ? K : never
}[keyof C]

/**
 * Type definition for a query key helper
 */
export type QueryKeyHelper = {
    /**
     * Generate a query key from parameters
     * @param params - The parameters to generate a query key for
     * @returns A query key for the parameters
     */
    queryKey: (params: any) => any
}

/**
 * Interface for SDK class constructor that includes the paramKeys property
 */
interface SDKClassConstructor {
    paramKeys: {
        [key: string]: string[]
    }
}

/**
 * Options for creating a typed query hook for a specific API client
 */
export interface CreateUseQueryOptions<
    ClientKey extends keyof ApiClients,
    M extends MethodsOf<ApiClients[ClientKey]>
> {
    /** The client key in ApiClients (e.g., 'shopperSearch', 'shopperProducts') */
    clientKey: ClientKey
    /** The name of the method in the API client */
    methodName: M
    /** The name to use for the hook in debugging tools */
    displayName: string
    /** The query key helper for the specified method */
    queryKeyHelper: QueryKeyHelper
}

/**
 * Type definition for a query hook function
 */
export type QueryHook<M extends ApiMethod<any, any>, TError = DefaultError> = (
    apiOptions: NullableParameters<Argument<M>>,
    queryOptions?: ApiQueryOptions<M, TError>
) => UseQueryResult<DataType<M>, TError>

/**
 * Helper to ensure a method is an ApiMethod
 */
type EnsureApiMethod<T> = T extends ApiMethod<any, any> ? T : never

/**
 * Creates a typed query hook for a specific API client method.
 *
 * @template ClientKey - The key of the client in ApiClients
 * @template M - The method name from the specified client
 * @param options - Configuration options for creating the query hook
 * @returns A custom hook that provides access to the specified API method
 */
export const createUseQuery = <
    ClientKey extends keyof ApiClients,
    M extends MethodsOf<ApiClients[ClientKey]>,
    TError = DefaultError
>(
    options: CreateUseQueryOptions<ClientKey, M>
): QueryHook<EnsureApiMethod<ApiClients[ClientKey][M]>, TError> => {
    const {clientKey, methodName, displayName, queryKeyHelper} = options
    type Client = ApiClients[ClientKey]
    // Ensure method type is a function
    type Method = ApiClients[ClientKey][M] & ApiMethod<any, any>

    /**
     * Custom hook for accessing an API method
     */
    const useQueryHook = (
        apiOptions: NullableParameters<Argument<Method>>,
        queryOptions: ApiQueryOptions<Method, TError> = {}
    ): UseQueryResult<DataType<Method>, TError> => {
        type Options = Argument<Method>
        type Data = DataType<Method>

        // Get the client from useCommerceApi based on clientKey
        const commerceApi = useCommerceApi()
        const client: Client = commerceApi[clientKey]

        // Get the SDK class for parameter keys
        const SDKClass = client.constructor as unknown as SDKClassConstructor

        // Get required parameters for this method
        const requiredKey = `${String(methodName)}Required`
        const requiredParameters = SDKClass.paramKeys[requiredKey]

        const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))

        // Get valid parameter keys for this method
        const methodParamKeys = SDKClass.paramKeys[String(methodName)]

        // These parameters are valid at runtime
        const parameters = pickValidParams(netOptions.parameters || {}, methodParamKeys)

        // Get query key for this method
        const queryKey = queryKeyHelper.queryKey(netOptions.parameters)

        // We don't use `netOptions` here because we manipulate the options in `useQuery`.
        const method = async (options: Options) => {
            // client[methodName] is guaranteed to be a function at runtime
            return await (client[methodName] as Method)(options)
        }

        queryOptions.meta = {
            displayName,
            ...queryOptions.meta
        }

        return useQuery<
            Client,
            Options,
            Data,
            TError,
            Data // We're not transforming the data, so TData = TQueryFnData
        >(
            {...netOptions, parameters} as OmitNullableParameters<
                NullableParameters<MergedOptions<Client, Options>>
            >,
            queryOptions,
            {
                method,
                queryKey,
                requiredParameters
            }
        )
    }

    return useQueryHook
}
