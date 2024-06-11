/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable, {LoadableComponent} from '@loadable/component'
import _routes from '*/app/routes'

const Home = loadable(() => import('./pages/home'))

const routes = [
    ..._routes,
    {
        path: '/',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: Home as LoadableComponent<unknown>
    }
]

console.log('App Routes: ', routes.map(({path}) => path))

export default routes
