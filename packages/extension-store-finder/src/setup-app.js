/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import loadable from '@loadable/component'
import withStyle from './components/with-style'

const StoreFinderPage = loadable(() => import('./pages/store-finder'))

/**
 * 
 */
export default (App) => {
    App.addRoutes([
        {
            exact: true,
            path: '/store-finder-page',
            component: StoreFinderPage
        }
    ])

    return withStyle(App)
}
