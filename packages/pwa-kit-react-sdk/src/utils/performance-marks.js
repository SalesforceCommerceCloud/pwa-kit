/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Performance marks used for server-side rendering tracing.
 * This file contains only constants and can be safely imported by universal components.
 */
export const PERFORMANCE_MARKS = {
    total: 'ssr.total',
    renderToString: 'ssr.render-to-string',
    routeMatching: 'ssr.route-matching',
    loadComponent: 'ssr.load-component',
    fetchStrategies: 'ssr.fetch-strategies',
    reactQueryPrerender: 'ssr.fetch-strategies.react-query.pre-render',
    reactQueryUseQuery: 'ssr.fetch-strategies.react-query.use-query',
    getProps: 'ssr.fetch-strategies.get-prop'
}
