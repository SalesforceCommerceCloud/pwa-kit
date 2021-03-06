/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable from '@loadable/component'

const Home = loadable(() => import('./pages/home'))
const UseProducts = loadable(() => import('./pages/useShopperProducts'))

const routes = [
    {
        path: '/',
        exact: true,
        component: Home
    },
    {
        path: '/useShopperProducts',
        component: UseProducts
    }
]

export default routes
