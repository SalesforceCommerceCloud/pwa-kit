/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Auth from '../auth'
import {CommerceApiProviderProps} from '../provider'
import {Logger} from '../types'
import {OptionalCustomEndpointClientConfig, TMutationVariables} from './types'

/**
 * A helper function for handling bad responses from SCAPI when an invalid access token is used.
 *
 * Re-throws the error if it is not caused by an invalid access token
 * @param error - the error
 * @returns a new guest access token
 */
export const handleInvalidToken = async (error: any, auth: Auth, logger: Logger) => {
    if (error?.response?.status !== 401) {
        throw error
    }

    const response = await error?.response?.json()
    if (response?.detail !== 'Customer credentials changed after token was issued.') {
        throw error
    }
    logger.info('Login was invalidated. Clearing login state.')
    return await auth.logout()
}

/**
 * A helper function for preparing a call to the SCAPI custom API endpoint
 */
export const generateCustomEndpointOptions = (
    options: OptionalCustomEndpointClientConfig,
    config: Omit<CommerceApiProviderProps, 'children'>,
    access_token: string,
    args?: TMutationVariables
) => {
    const globalHeaders = config.headers || {}
    const globalClientConfig = {
        parameters: {
            clientId: config.clientId,
            siteId: config.siteId,
            organizationId: config.organizationId,
            shortCode: config.shortCode
        },
        proxy: config.proxy,
        throwOnBadResponse: true
    }

    return {
        ...options,
        options: {
            method: options.options?.method || 'GET',
            headers: {
                Authorization: `Bearer ${access_token}`,
                // Note the order of the following destructred objects is important.
                // Priority assending order: global config < query/mutation config < mutate func args
                ...globalHeaders,
                ...options.options?.headers,
                ...(args?.headers ? args.headers : {})
            },
            ...options.options
        },
        clientConfig: {
            ...globalClientConfig,
            ...(options.clientConfig || {})
        }
    }
}
