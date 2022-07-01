/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable from '@loadable/component'

const Home = loadable(() => import('./pages/home'))
const PDP = loadable(() => import('./pages/pdp'))

const routes = [
    {
        path: '/',
        exact: true,
        component: Home,
    },
    {
        path: '/:productId',
        component: PDP,
    },
]

export default routes
