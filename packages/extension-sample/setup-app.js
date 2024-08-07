/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import loadable from '@loadable/component'

const SamplePage = loadable(() => import('./pages/sample-page'))

export default (App) => {
    App.initialRoutes = [
        {
            exact: true,
            path: '/sample-page',
            component: SamplePage
        },
        ...(App.initialRoutes || [])
    ]
}


