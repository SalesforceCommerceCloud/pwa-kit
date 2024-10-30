/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {RouteProps} from 'react-router-dom'
import {ApplicationExtension} from './ApplicationExtension'
import {ApplicationExtensionConfig} from '../../types'
import React from 'react'

class TestConfig implements ApplicationExtensionConfig {
    [key: string]: any
    enabled = true
}

describe('ApplicationExtension', () => {
    let extension: ApplicationExtension<TestConfig>
    let mockComponent: React.ComponentType<any>

    beforeEach(() => {
        const config = new TestConfig()
        extension = new ApplicationExtension(config)
        mockComponent = jest.fn(() => <div>Test Component</div>)
    })

    describe('extendApp', () => {
        test('should return the provided component without modification', () => {
            const result = extension.extendApp(mockComponent)
            expect(result).toBe(mockComponent)
        })
    })

    describe('extendRoutes', () => {
        test('should return the routes array without modification', () => {
            const routes: RouteProps[] = [
                {path: '/home', component: mockComponent},
                {path: '/about', component: mockComponent}
            ]

            const result = extension.extendRoutes(routes)
            expect(result).toEqual(routes)
        })

        test('should allow for modification of routes', () => {
            const routes: RouteProps[] = [{path: '/home', component: mockComponent}]
            const additionalRoute: RouteProps = {path: '/new', component: mockComponent}

            const extendRoutesSpy = jest
                .spyOn(extension, 'extendRoutes')
                .mockImplementation((baseRoutes) => {
                    return [...baseRoutes, additionalRoute]
                })

            const modifiedRoutes = extension.extendRoutes(routes)
            expect(modifiedRoutes).toContainEqual(additionalRoute)
            expect(modifiedRoutes).toHaveLength(routes.length + 1)

            extendRoutesSpy.mockRestore()
        })
    })
})
