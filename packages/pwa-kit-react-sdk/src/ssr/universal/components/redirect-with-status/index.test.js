/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {Router, StaticRouter, Route} from 'react-router-dom'
import {createMemoryHistory} from 'history'
import RedirectWithStatus from './index'

describe('RedirectWithStatus', () => {
    test('Redirects if no status or context is provided', () => {
        const targetUrl = '/target'
        const history = createMemoryHistory()
        history.push('/redirect')
        render(
            <Router history={history}>
                <Route path="/redirect">
                    <RedirectWithStatus to={targetUrl} />
                </Route>
            </Router>
        )
        expect(history.location.pathname).toBe(targetUrl)
    })
    test('Redirect renders with correct status', async () => {
        const context = {}
        const status = 303
        const targetUrl = '/target'

        render(
            <StaticRouter location="/redirect" context={context}>
                <Route path="/redirect">
                    <RedirectWithStatus status={status} to={targetUrl} />
                </Route>
            </StaticRouter>
        )

        expect(context.status).toBe(status)
        expect(context.url).toBe(targetUrl)
    })
})
