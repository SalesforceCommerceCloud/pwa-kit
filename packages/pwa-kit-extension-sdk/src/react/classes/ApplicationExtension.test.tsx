/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {RouteProps} from 'react-router-dom'

import {ApplicationExtension} from './ApplicationExtension'
import {ApplicationExtensionConfig, ComponentMap, SerializedRouteProps} from '../../types'
import {NOT_CACHED} from '../utils/helpers'

const MockComponent: React.ComponentType<any> = () => {
    return <div>{MockComponent.displayName}</div>
}
MockComponent.displayName = 'MockComponent'

const mockRoutes: RouteProps[] = [
    {
        path: '/test',
        component: MockComponent
    },
    {
        path: '/test-route-with-exact',
        component: MockComponent,
        exact: true
    }
]

const mockSerializedRoutes: SerializedRouteProps[] = [
    {
        path: '/test',
        componentName: 'MockComponent',
        component: MockComponent
    },
    {
        path: '/test-route-with-exact',
        componentName: 'MockComponent',
        exact: true,
        component: MockComponent
    }
]

class TestConfig implements ApplicationExtensionConfig {
    [key: string]: any
    enabled = true
}

class TestExtension extends ApplicationExtension<TestConfig> {
    static readonly id = 'test-extension'
}

class TestExtensionAsyncRoutes extends ApplicationExtension<TestConfig> {
    static readonly id = 'test-extension'

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async getRoutesAsync(params: any): Promise<RouteProps[]> {
        return Promise.resolve(mockRoutes)
    }

    public getComponentMap(): ComponentMap {
        return {MockComponent: MockComponent}
    }
}

class TestExtensionAsyncRoutesNoComponentMap extends ApplicationExtension<TestConfig> {
    static readonly id = 'test-extension'

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async getRoutesAsync(params: any): Promise<RouteProps[]> {
        return Promise.resolve(mockRoutes)
    }
}

describe('ApplicationExtension', () => {
    let extension: ApplicationExtension<TestConfig>
    let extensionAsyncRoutes: ApplicationExtension<TestConfig>

    beforeEach(() => {
        const config = new TestConfig()
        extension = new TestExtension(config)
        extensionAsyncRoutes = new TestExtensionAsyncRoutes(config)
    })

    afterEach(() => {
        delete (global as any).window
    })

    describe('extendApp', () => {
        test('should return the provided component without modification', () => {
            const result = extension.extendApp(MockComponent)
            expect(result).toBe(MockComponent)
        })
    })

    describe('getRoutes', () => {
        test('initially return an empty array', () => {
            const routes = extension.getRoutes({locals: {}})
            expect(routes).toHaveLength(0)
        })

        test('should allow adding a new route', () => {
            const additionalRoute: RouteProps = {path: '/new', component: MockComponent}
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
        test('initially undefined', () => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(extension.getRoutesAsync).toBeUndefined()
        })
    })

    describe('beforeRouteMatch', () => {
        test('initially returns all of the routes unmodified', () => {
            const route: RouteProps = {path: '/new', component: MockComponent}
            const allRoutes = [route]

            const result = extension.beforeRouteMatch({allRoutes, locals: {}})
            expect(result).toStrictEqual(allRoutes)
        })
    })

    describe('serializeAsyncRoutes', () => {
        it('should return empty array if getRoutesAsync is not defined', () => {
            const result = extension.serializeAsyncRoutes()
            expect(result).toEqual([])
        })

        it('should serialize routes correctly', async () => {
            if (extensionAsyncRoutes.getRoutesAsync) {
                await extensionAsyncRoutes.getRoutesAsync({locals: {}})
            }
            const serializedRoutes = extensionAsyncRoutes.serializeAsyncRoutes()
            expect(serializedRoutes).toEqual(mockSerializedRoutes)
        })

        it.each([
            {path: '/test-route'},
            {path: '/test-route', componentName: undefined},
            {path: '/test-route', componentName: null},
            {path: '/test-route', component: undefined},
            {path: '/test-route', component: null}
        ])(
            'should throw error if route does not have either a componentName or component',
            (route) => {
                // Mock `_cachedRoutes` to contain a route with an undefined componentName
                extensionAsyncRoutes['_cachedRoutes'] = [route as RouteProps]
                expect(() => extensionAsyncRoutes.serializeAsyncRoutes()).toThrow(
                    'Route with path "/test-route" must contain a component to be serializable in the TestExtensionAsyncRoutes extension'
                )
            }
        )

        it('should throw an error if getRoutesAsync() is not called before serializing', () => {
            expect(() => extensionAsyncRoutes.serializeAsyncRoutes()).toThrow(
                'Routes have not been loaded. Call getRoutesAsync() before serializing'
            )
        })

        it('should throw an error if a route component is missing displayName', () => {
            // Mock `_cachedRoutes` to contain a route with a component missing `displayName`
            extensionAsyncRoutes['_cachedRoutes'] = [
                {
                    path: '/test-route',
                    component: {} as React.ComponentType<any> // Missing displayName
                }
            ]

            expect(() => extensionAsyncRoutes.serializeAsyncRoutes()).toThrow(
                'Component for route with path "/test-route" is missing a displayName in the TestExtensionAsyncRoutes extension'
            )
        })
    })

    describe('constructor', () => {
        it('should cache getRoutesAsync result', async () => {
            let routes
            if (extensionAsyncRoutes.getRoutesAsync) {
                routes = await extensionAsyncRoutes.getRoutesAsync({locals: {}})
            }
            expect(routes).toEqual(mockRoutes)
            expect(extensionAsyncRoutes['_cachedRoutes']).toEqual(routes)
        })

        it('should return the cached result on subsequent getRoutesAsync calls', async () => {
            const cachedRoutes = [
                {
                    path: '/cached-route',
                    component: {displayName: 'CachedComponent'} as React.ComponentType<any>
                }
            ]
            extensionAsyncRoutes['_cachedRoutes'] = cachedRoutes

            let routes
            if (extensionAsyncRoutes.getRoutesAsync) {
                routes = await extensionAsyncRoutes.getRoutesAsync({locals: {}})
            }

            expect(routes).toEqual(cachedRoutes)
        })

        it('should not deserialize routes when server-side', () => {
            // Simulate server-side
            ;(global as any).window = undefined
            extension = new TestExtensionAsyncRoutes(new TestConfig())
            expect(extension['_cachedRoutes']).toEqual(NOT_CACHED)
        })

        it('should deserialize routes when client-side', () => {
            // Simulate client-side with serialized routes in the window global variable
            ;(global as any).window = {
                __EXTENSIONS__: {TestExtensionAsyncRoutes: {routes: mockSerializedRoutes}}
            }
            extension = new TestExtensionAsyncRoutes(new TestConfig())
            expect(extension['_cachedRoutes']).toEqual(mockRoutes)
        })

        it('should throw an error when getComponentMap is not implemented', () => {
            // Simulate client-side with serialized routes in the window global variable
            ;(global as any).window = {
                __EXTENSIONS__: {TestExtensionAsyncRoutes: {routes: mockSerializedRoutes}}
            }
            expect(() => new TestExtensionAsyncRoutesNoComponentMap(new TestConfig())).toThrow(
                `getComponentMap() must be defined when getRoutesAsync() is defined in the TestExtensionAsyncRoutesNoComponentMap extension`
            )
        })

        it('should throw an error when serialized route is missing componentName', () => {
            // Simulate client-side with serialized routes in the window global variable
            ;(global as any).window = {
                __EXTENSIONS__: {
                    TestExtensionAsyncRoutes: {
                        routes: [
                            // Route with no component name
                            {
                                path: '/test'
                            }
                        ]
                    }
                }
            }
            expect(() => new TestExtensionAsyncRoutes(new TestConfig())).toThrow(
                'Missing componentName for the route with path: "/test". Ensure that serializeAsyncRoutes() correctly assigns a componentName to the serialized route in the TestExtensionAsyncRoutes extension'
            )
        })

        it('should throw an error when componentName is not in getComponentMap()', () => {
            // Simulate client-side with serialized routes in the window global variable
            ;(global as any).window = {
                __EXTENSIONS__: {
                    TestExtensionAsyncRoutes: {
                        routes: [
                            // Route with componentName not in componentMap
                            {
                                path: '/test',
                                componentName: 'Foo'
                            }
                        ]
                    }
                }
            }
            expect(() => new TestExtensionAsyncRoutes(new TestConfig())).toThrow(
                '"Foo" was not found in the component map. Ensure that getComponentMap() includes a mapping for it in the TestExtensionAsyncRoutes extension'
            )
        })
    })
})
