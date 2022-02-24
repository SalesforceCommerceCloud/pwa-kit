/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {configureRoutes} from './routes-utils'

describe('configureRoutes', function() {
    const env = process.env
    beforeEach(() => {
        jest.resetModules()
        process.env = {...env}
    })

    afterEach(() => {
        process.env = env
    })
    const CompA = () => <div>This is component A</div>
    const CompC = () => <div>This is component C</div>

    const routes = [
        {
            path: '/',
            component: CompA,
            exact: true
        },
        {
            path: '/category/:categoryId',
            component: CompC,
            exact: true
        }
    ]
    test('should return all permutation of path including site and locales ', () => {
        const configuredRoutes = configureRoutes(routes, {ignoredRoutes: ['/']})
        expect(configuredRoutes[configuredRoutes.length - 1].path).toEqual('/category/:categoryId')
        expect(configuredRoutes.length).toEqual(31)
        const paths = configuredRoutes.map((route) => route.path)
        console.log('paths', paths)
        expect(paths).toEqual(expectedPathsResult)
    })

    test('should return the origin routes', () => {
        const configuredRoutes = configureRoutes(routes, {
            ignoredRoutes: ['/', '/category/:categoryId']
        })
        expect(configuredRoutes.length).toEqual(2)
    })
})

const expectedPathsResult = [
    '/',
    '/uk/en-uk/category/:categoryId',
    '/uk/en-GB/category/:categoryId',
    '/uk/fr/category/:categoryId',
    '/uk/fr-FR/category/:categoryId',
    '/uk/en-US/category/:categoryId',
    '/site-1/en-uk/category/:categoryId',
    '/site-1/en-GB/category/:categoryId',
    '/site-1/fr/category/:categoryId',
    '/site-1/fr-FR/category/:categoryId',
    '/site-1/en-US/category/:categoryId',
    '/us/en-uk/category/:categoryId',
    '/us/en-GB/category/:categoryId',
    '/us/fr/category/:categoryId',
    '/us/fr-FR/category/:categoryId',
    '/us/en-US/category/:categoryId',
    '/site-2/en-uk/category/:categoryId',
    '/site-2/en-GB/category/:categoryId',
    '/site-2/fr/category/:categoryId',
    '/site-2/fr-FR/category/:categoryId',
    '/site-2/en-US/category/:categoryId',
    '/uk/category/:categoryId',
    '/site-1/category/:categoryId',
    '/us/category/:categoryId',
    '/site-2/category/:categoryId',
    '/en-uk/category/:categoryId',
    '/en-GB/category/:categoryId',
    '/fr/category/:categoryId',
    '/fr-FR/category/:categoryId',
    '/en-US/category/:categoryId',
    '/category/:categoryId'
]
