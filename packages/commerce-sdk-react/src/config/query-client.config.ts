/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DefaultOptions, QueryClientConfig} from '@tanstack/react-query'

const defaultOptions: DefaultOptions = {
    queries: {
        staleTime: 1000 * 20 // default 0
    },
}

const defaultQueryClientConfig: QueryClientConfig = {defaultOptions}

export {defaultQueryClientConfig}
