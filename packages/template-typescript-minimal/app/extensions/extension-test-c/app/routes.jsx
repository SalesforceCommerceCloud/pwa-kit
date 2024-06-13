/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _routes from '*/app/routes'
import Test from './pages/test'

export const routes = [
    ..._routes,
    {
        path: '/test-c',
        component: Test,
        exact: true
    }
]

export default routes
