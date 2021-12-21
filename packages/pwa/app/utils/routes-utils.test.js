/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {configureRoutes} from './routes-utils'
import {getConfig} from './utils'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn()
    }
})

describe('configureRoutes', function() {
    test('should only configured the routes with :locale as part of the path', () => {
        getConfig.mockImplementation(() => ({
            locale: 'path'
        }))
        const CompA = () => <div>This is component A</div>
        const CompB = () => <div>This is component B</div>

        const routes = [
            {
                path: '/',
                component: CompA,
                exact: true
            },
            {
                path: '/category/:categoryId',
                component: CompB,
                exact: true
            }
        ]
        const configuredRoutes = configureRoutes(routes, {ignoredRoutes: '/'})
        expect(configuredRoutes[0].path).toEqual('/')
        expect(configuredRoutes[1].path).toEqual('/:locale/category/:categoryId')
    })
})
