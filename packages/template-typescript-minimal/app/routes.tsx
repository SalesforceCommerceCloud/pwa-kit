/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable from '@loadable/component'

const GettingStarted = loadable(() => import('./pages/getting-started'))

const routes = [
    {
        // The path that the local dev server would open initially.
        // You can configure the server in /app/ssr.js file.
        path: '/__pwa-kit/getting-started',
        exact: true,
        component: GettingStarted
    }
]

export default routes
