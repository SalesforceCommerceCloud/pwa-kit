/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable, {LoadableComponent} from '@loadable/component'

const Home = loadable(() => import('./pages/home'))
const ProductDetail = loadable(() => import('./pages/product-detail/index'))

const routes = [
    {
        path: '/',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: Home as LoadableComponent<unknown>
    },
    {
        path: '/product-detail',
        component: ProductDetail as LoadableComponent<unknown>
    }
]

export default routes
