/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {OuterApp} from './main'
import {render, screen} from '@testing-library/react'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import * as errors from '../universal/errors'
import {uuidv4} from '../../utils/uuidv4.client'

jest.mock('../../utils/uuidv4.client')
describe('main', function () {
    test('OuterApp renders without error', () => {
        uuidv4.mockReturnValueOnce('7f21aea5-6962-4162-8204-9da85c802022')
        const oldPreloadedState = window.__PRELOADED_STATE__
        window.__PRELOADED_STATE__ = {
            appProps: {}
        }
        const App = () => <div>App</div>
        const locals = {}
        const props = {
            error: undefined,
            locals,
            routes: getRoutes(locals),
            WrappedApp: routeComponent(App, false, locals)
        }
        render(<OuterApp {...props} />)
        expect(screen.getByText('App')).toBeInTheDocument()
        window.__PRELOADED_STATE__ = oldPreloadedState
    })

    test('OuterApp triggers the error page when there is an error', () => {
        const oldWindowError = window.__ERROR__
        window.__ERROR__ = new errors.HTTPNotFound('Not found')
        const App = () => <div>App</div>
        const locals = {}
        const props = {
            error: window.__ERROR__,
            locals,
            routes: getRoutes(locals),
            WrappedApp: routeComponent(App, false, locals)
        }
        render(<OuterApp {...props} />)
        expect(screen.getByText('Error Status: 404')).toBeInTheDocument()
        window.__ERROR__ = oldWindowError
    })
})
