/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import Auth from '../auth'

type PasskeyUserParams = Parameters<Auth['getPasskeyUserByLoginId']>[0]
type PasskeyUserData = Awaited<ReturnType<Auth['getPasskeyUserByLoginId']>> | null

/**
 * A query hook that fetches passkey user data for a given loginId.
 * Returns `null` data (not an error) when the user has no passkeys registered (404).
 *
 * @group Helpers
 * @category Shopper Authentication
 * @param parameters - Parameters for the `getPasskeyUserByLoginId` auth method.
 * @param queryOptions - TanStack Query query options.
 * @returns A TanStack Query query hook with passkey user data.
 */
export const usePasskeyUser = (
    parameters: PasskeyUserParams,
    queryOptions: {enabled?: boolean; [key: string]: unknown} = {}
): UseQueryResult<PasskeyUserData> => {
    const auth = useAuthContext()
    const {loginId, channelId} = parameters

    return useQuery({
        queryKey: ['/commerce-sdk-react', 'passkey-user', loginId, channelId],
        queryFn: async () => {
            try {
                return await auth.whenReady(auth.getPasskeyUserByLoginId.bind(auth))(parameters)
            } catch (e: unknown) {
                if ((e as {response?: {status?: number}})?.response?.status === 404) {
                    return null
                }
                throw e
            }
        },
        enabled: !!loginId,
        ...queryOptions
    })
}
