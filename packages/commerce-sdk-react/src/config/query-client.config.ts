/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DefaultOptions, QueryClientConfig} from '@tanstack/react-query'

const defaultOptions: DefaultOptions = {
    queries: {
        retry: 2,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
        cacheTime: Infinity, //30 seconds
        refetchInterval: 1000 * 30, //30 seconds
        refetchIntervalInBackground: false,
        suspense: false,
        staleTime: 1000 * 30
    },
    mutations: {
        retry: 2
    }
}

const defaultQueryClientConfig: QueryClientConfig = {defaultOptions}

export {defaultQueryClientConfig}
