/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: Could this be done in the SDK? Probably. It would be better to get it out of sight from the end user.
import _routes from '*/app/routes'
import loadable, {LoadableComponent} from '@loadable/component'

const Welcome = loadable(() => import('./pages/welcome'))

const routes = [
    ..._routes,
    {
        path: '/',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: Welcome as LoadableComponent<unknown>
    }
]

export default routes
