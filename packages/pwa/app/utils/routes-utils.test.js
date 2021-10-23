/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getUrlsConfig} from './utils'
import {routesModifier} from './routes-utils'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getUrlsConfig: jest.fn()
    }
})

describe('routeModifier', function() {
    test('should return modified routes', () => {
        getUrlsConfig.mockImplementation(() => ({
            alias: 'path',
            locale: 'path'
        }))
        const fakeComp = () => <div>fake component</div>
        const routes = [
            {
                path: '/reset-password',
                component: fakeComp,
                exact: true
            }
        ]
        const newRoutes = routesModifier(routes)
        expect(newRoutes[0].path).toEqual('/:alias/:locale/reset-password')
    })

    test('should return modified routes with only :alias in the path', () => {
        getUrlsConfig.mockImplementation(() => ({
            alias: 'path',
            locale: 'query_param'
        }))
        const fakeComp = () => <div>fake component</div>
        const routes = [
            {
                path: '/reset-password',
                component: fakeComp,
                exact: true
            }
        ]
        const newRoutes = routesModifier(routes)
        expect(newRoutes[0].path).toEqual('/:alias/reset-password')
    })

    test('should return non-modified url as the config type is invalid', () => {
        getUrlsConfig.mockImplementation(() => ({
            alias: 'something',
            locale: 'query_param'
        }))
        const fakeComp = () => <div>fake component</div>
        const routes = [
            {
                path: '/reset-password',
                component: fakeComp,
                exact: true
            }
        ]
        expect(() => routesModifier(routes)).toThrow()
    })
})
