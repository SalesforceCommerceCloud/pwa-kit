/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    MutationFunction,
    useMutation,
    UseMutationResult,
    useQueryClient
} from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import Auth from '../auth'
import {Argument, CacheUpdate} from './types'
import {updateCache} from './utils'

/**
 * @group Helpers
 * @category Shopper Authentication
 * @enum
 */
export const AuthHelpers = {
    LoginGuestUser: 'loginGuestUser',
    LoginRegisteredUserB2C: 'loginRegisteredUserB2C',
    Logout: 'logout',
    Register: 'register'
} as const
/**
 * @group Helpers
 * @category Shopper Authentication
 *
 */
export type AuthHelper = (typeof AuthHelpers)[keyof typeof AuthHelpers]

const noop = () => ({})

/**
 * @internal
 */
type CacheUpdateMatrix = {
    [Method in AuthHelper]?: (
        options: Argument<Auth[Method]> | void,
        response: ReturnType<Auth[Method]> extends Promise<infer D> ? D : never
    ) => CacheUpdate
}

/**
 * A hook for Public Client OAuth helpers.
 *
 * The hook calls the SLAS helpers imported from commerce-sdk-isomorphic.
 * For more, see https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/#public-client-shopper-login-helpers
 *
 * Avaliable helpers:
 * - loginRegisteredUserB2C
 * - loginGuestUser
 * - logout
 * - register
 *
 * @group Helpers
 * @category Shopper Authentication
 */
export function useAuthHelper<Mutation extends AuthHelper>(
    mutation: Mutation
): UseMutationResult<
    // Extract the data from the returned promise (all mutations should be async)
    ReturnType<Auth[Mutation]> extends Promise<infer Data> ? Data : never,
    unknown,
    // Variables = void if no arguments, otherwise the first argument
    [] extends Parameters<Auth[Mutation]> ? void : Parameters<Auth[Mutation]>[0],
    unknown
> {
    const auth = useAuthContext()
    if (!auth[mutation]) throw new Error(`Unknown login helper mutation: ${mutation}`)
    const queryClient = useQueryClient()
    // I'm not sure if there's a way to avoid this type assertion, but, I'm fairly confident that
    // it is safe to do, as it seems to be simply re-asserting what we already know.
    type Method = Auth[Mutation]
    type PromisedData = ReturnType<Method>
    type Data = PromisedData extends Promise<infer D> ? D : never
    type Variables = [] extends Parameters<Method> ? void : Parameters<Method>[0]
    const method = auth[mutation].bind(auth) as MutationFunction<Data, Variables>
    return useMutation(auth.whenReady(method), {
        onSuccess(data, options) {
            const getCacheUpdates = cacheUpdateMatrix[mutation]

            if (getCacheUpdates) {
                const cacheUpdates = getCacheUpdates(options, data)
                updateCache(queryClient, cacheUpdates, data)
            }
        }
    })
}

const cacheUpdateMatrix: CacheUpdateMatrix = {
    loginRegisteredUserB2C: noop,
    loginGuestUser: noop,
    logout() {
        return {
            remove: [{queryKey: ['/commerce-sdk-react']}]
        }
    },
    register: noop
}
