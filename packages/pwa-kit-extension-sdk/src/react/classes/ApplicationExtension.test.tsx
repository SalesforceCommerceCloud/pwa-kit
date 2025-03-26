/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApplicationExtension} from './ApplicationExtension'
import {ApplicationExtensionConfig, RouteProps} from '../../types'
import React from 'react'

class TestConfig implements ApplicationExtensionConfig {
    [key: string]: any
    enabled = true
}

class TestExtension extends ApplicationExtension<TestConfig> {
    static readonly id = 'test-extension'
}

describe('ApplicationExtension', () => {
    let extension: ApplicationExtension<TestConfig>
    let mockComponent: React.ComponentType<any>

    beforeEach(() => {
        const config = new TestConfig()
        extension = new TestExtension(config)
        mockComponent = jest.fn(() => <div>Test Component</div>)
    })

    describe('extendApp', () => {
        test('should return the provided component without modification', () => {
            const result = extension.extendApp(mockComponent)
            expect(result).toBe(mockComponent)
        })
    })

    describe('getRoutes', () => {
        test('initially return an empty array', () => {
            const routes = extension.getRoutes({locals: {}})
            expect(routes).toHaveLength(0)
        })

        test('should allow adding a new route', () => {
            const additionalRoute: RouteProps = {path: '/new', component: mockComponent}
            const getRoutesSpy = jest.spyOn(extension, 'getRoutes').mockImplementation(() => {
                return [additionalRoute]
            })

            const routes = extension.getRoutes({locals: {}})
            expect(routes).toContainEqual(additionalRoute)
            expect(routes).toHaveLength(1)

            getRoutesSpy.mockRestore()
        })
    })

    describe('getRoutesAsync', () => {
        test('initially not implemented', () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(extension.getRoutesAsync).toBeUndefined()
        })
    })

    describe('beforeRouteMatch', () => {
        test('initially returns all of the routes unmodified', () => {
            const route: RouteProps = {path: '/new', component: mockComponent}
            const allRoutes = [route]

            const result = extension.beforeRouteMatch({allRoutes, locals: {}})
            expect(result).toStrictEqual(allRoutes)
        })
    })
})
