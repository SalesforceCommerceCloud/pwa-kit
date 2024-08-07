/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import loadable from '@loadable/component'

const StoreFinderPage = loadable(() => import('./pages/store-finder-page'))

export default (App) => {
    App.initialRoutes = [
        {
            exact: true,
            path: '/store-finder-page',
            component: StoreFinderPage
        },
        ...(App.initialRoutes || [])
    ]
}
