/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomMutation, useCustomQuery} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook for calling the Custom Order API using useCustomMutation
 * @param {string} endpoint - The API endpoint path (e.g., 'trackOrder', 'order')
 * @returns {Object} useCustomMutation hook for the SOM order endpoint
 */
export const useSomOrderMutation = (endpoint = 'trackOrder') => {
    const mutation = useCustomMutation({
        options: {
            method: 'GET',
            customApiPathParameters: {
                endpointPath: endpoint,
                apiName: 'orders'
            }
        },
        rawResponse: false
    })

    // Create a wrapper that accepts parameters
    const mutateWithParams = async (parameters) => {
        return mutation.mutateAsync({
            parameters
        })
    }

    return {
        ...mutation,
        mutateAsync: mutateWithParams
    }
}

/**
 * Custom hook for calling the Custom Order API using useCustomQuery
 * @param {string} endpoint - The API endpoint path
 * @param {Object} parameters - API parameters
 */
export const useSomOrderQuery = (endpoint, parameters, options = {}) => {
    const query = useCustomQuery(
        {
            options: {
                method: 'GET',
                customApiPathParameters: {
                    apiName: 'orders',
                    apiVersion: 'v1',
                    endpointPath: endpoint
                },
                parameters
            },
            rawResponse: false
        },
        {
            enabled: typeof window !== 'undefined' && options.enabled !== false
        }
    )

    return query
}
