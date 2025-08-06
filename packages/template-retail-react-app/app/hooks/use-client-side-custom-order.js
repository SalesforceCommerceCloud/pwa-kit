/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomMutation, useCustomQuery} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook for calling the Custom Order API using useCustomMutation
 * @returns {Object} useCustomMutation hook for the SOM order endpoint
 */
export const useSomOrderMutation = () => {
    const mutation = useCustomMutation({
        options: {
            method: 'GET',
            customApiPathParameters: {
                endpointPath: 'order',
                apiName: 'orders'
            }
        },
        rawResponse: false
    })

    // Log mutation state
    console.log("🔄 useSomOrderMutation state:", {
        data: mutation.data,
        isLoading: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess
    })

    return mutation
}

/**
 * Custom hook for calling the Custom Order API using useCustomQuery
 * @returns {Object} useCustomQuery hook for the SOM order endpoint
 */
export const useSomOrderQuery = () => {
    const query = useCustomQuery({
        options: {
            method: 'GET',
            customApiPathParameters: {
                apiName: 'orders',
                apiVersion: 'v1',
                endpointPath: 'order'
            },
            parameters: {
                siteId: 'RefArch',
                c_orderNumber: '00000101',
                c_emailId: 'unandyala@salesforce.com'
            }
        },
        rawResponse: false
    }, {
        enabled: typeof window !== 'undefined'
    })

    // Log query state
    console.log("🔄 useSomOrderQuery state:", {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error,
        isSuccess: query.isSuccess
    })

    return query
} 