/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {mount} from 'enzyme'
import {getRoutes, routeComponent} from './index'

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t))

/**
 * Return a mock that returns true, false, false, false, which is what
 * we want when testing shouldGetProps – always returning true would cause
 * an infinite loop.
 */
const trueOnceThenFalse = () =>
    jest
        .fn()
        .mockReturnValue(false)
        .mockReturnValueOnce(true)

const falseOnceThenTrue = () =>
    jest
        .fn()
        .mockReturnValue(true)
        .mockReturnValueOnce(false)

jest.mock('../_app-config', () => {
    const React = require('react')
    const PropTypes = require('prop-types')

    const MockAppConfig = () => <h1>MockAppConfig</h1>
    MockAppConfig.freeze = jest.fn(() => ({frozen: 'frozen'}))
    MockAppConfig.restore = jest.fn(() => undefined)
    MockAppConfig.extraGetPropsArgs = jest.fn(() => ({anotherArg: 'anotherArg'}))
    MockAppConfig.propTypes = {
        children: PropTypes.node
    }

    return {
        __esModule: true,
        default: MockAppConfig
    }
})

jest.mock('../../routes', () => {
    const React = require('react')
    const PropTypes = require('prop-types')

    const Component = ({children}) => (
        <div>
            <h1>This is the root</h1>
            {children}
        </div>
    )

    Component.propTypes = {
        children: PropTypes.node
    }

    return [
        {
            path: '',
            component: Component,
            exact: true
        }
    ]
})

// NOTE: `react-router-dom` is being mocked because I was not able to get around the
// issue where you can't use a `withRoute` HoC outside of a Router component for this
// specific test. TODO: Revisit this, so that we don't have to mock `react-router-dom`
jest.mock('react-router-dom', () => {
    const React = require('react')
    const hoistNonReactStatic = require('hoist-non-react-statics')

    const withRouter = (Wrapped) => {
        const wrappedComponentName = Wrapped.displayName || Wrapped.name
        const WithRouter = (props) => <Wrapped {...props} />
        hoistNonReactStatic(WithRouter, Wrapped)
        WithRouter.displayName = `withRouter(${wrappedComponentName})`

        return WithRouter
    }

    return {
        __esModule: true,
        default: {},
        withRouter
    }
})

const getMockComponent = () => {
    const MockComponent = () => <p>MockComponent</p>
    MockComponent.displayName = 'MockComponent'
    MockComponent.shouldGetProps = trueOnceThenFalse()
    MockComponent.getProps = jest.fn(() => {
        return Promise.resolve()
    })
    MockComponent.getTemplateName = jest.fn(() => 'MockComponent')
    return MockComponent
}

beforeEach(() => {
    delete global.__HYDRATING__
})

describe('The routeComponent component', () => {
    test('Is a higher-order component', () => {
        const Mock = getMockComponent()
        const Component = routeComponent(Mock)
        const wrapper = mount(<Component isHydrating={false} />)
        expect(wrapper.contains(<p>MockComponent</p>)).toBe(true)
    })

    test('Should call getProps on components at the right times during updates/rendering', () => {
        const Mock = getMockComponent()
        const Component = routeComponent(Mock)
        Component.displayName = 'routeComponent'
        expect(Mock.shouldGetProps.mock.calls.length).toBe(0)
        expect(Mock.getProps.mock.calls.length).toBe(0)
        let wrapper

        return Promise.resolve()
            .then(() => {
                // Mock Hydrating Start
                global.__HYDRATING__ = true
            })
            .then(() => {
                // Simulate the initial client-side mount (hydrating=true)
                return new Promise((resolve) => {
                    wrapper = mount(
                        <Component
                            history={{location: {pathname: '/home/'}}}
                            onUpdateComplete={resolve}
                        />
                    )
                })
            })
            .then(() => {
                expect(Mock.shouldGetProps.mock.calls.length).toBe(0)
                expect(Mock.getProps.mock.calls.length).toBe(0)
            })
            .then(() => {
                // Mock Hydrating Complete
                global.__HYDRATING__ = false
            })
            .then(() => {
                // Simulate visiting a different URL, which should trigger shouldMount() and getProps()
                return new Promise((resolve) => {
                    wrapper.setProps({
                        history: {location: {pathname: '/plp/'}},
                        onGetPropsComplete: resolve
                    })
                })
            })
            .then(() => {
                expect(Mock.shouldGetProps.mock.calls.length).toBe(1)
                expect(Mock.getProps.mock.calls.length).toBe(1)
            })
    })

    test('Provides defaults for getProps(), shouldGetProps() and getTemplateName()', () => {
        const ComponentWithoutStatics = () => <p>ComponentWithoutStatics</p>
        const Component = routeComponent(ComponentWithoutStatics)

        const l1 = {pathname: '/location-one/'}
        const l2 = {pathname: '/location-two/'}

        const checks = [
            Component.shouldGetProps({previousLocation: l1, location: l1}).then((v) =>
                expect(v).toBe(false)
            ),
            Component.shouldGetProps({previousLocation: l1, location: l2}).then((v) =>
                expect(v).toBe(true)
            ),
            Component.getTemplateName().then((v) => expect(v).toBe('ComponentWithoutStatics')),
            Component.getProps().then((result) => expect(result).toBe(undefined))
        ]
        expect.assertions(checks.length)
        return Promise.all(checks)
    })

    test('Allows the wrapped component to override getProps(), shouldGetProps and getTemplateName()', () => {
        class Mock extends React.Component {
            static shouldGetProps({location}) {
                return location.pathname === '/should-get-props/'
            }

            static getProps() {
                return Promise.resolve('overridden-get-props')
            }

            static getTemplateName() {
                return 'overriden-template-name'
            }

            render() {
                return <div>Mock</div>
            }
        }
        const Component = routeComponent(Mock)

        const l1 = {pathname: '/location-one/'}
        const l2 = {pathname: '/location-two/'}
        const l3 = {pathname: '/should-get-props/'}

        const checks = [
            Component.shouldGetProps({previousLocation: l1, location: l1}).then((v) =>
                expect(v).toBe(false)
            ),
            Component.shouldGetProps({previousLocation: l1, location: l2}).then((v) =>
                expect(v).toBe(false)
            ),
            Component.shouldGetProps({previousLocation: l1, location: l3}).then((v) =>
                expect(v).toBe(true)
            ),
            Component.getTemplateName().then((v) => expect(v).toBe('overriden-template-name')),
            Component.getProps().then((v) => expect(v).toBe('overridden-get-props'))
        ]
        expect.assertions(checks.length)
        return Promise.all(checks)
    })

    test(`Catches and calls onGetPropsError() when getProps throws`, () => {
        const error = 'throwErrorText'
        const Mock = () => <div>Mock</div>
        Mock.shouldGetProps = trueOnceThenFalse()
        Mock.getProps = () => {
            throw error
        }

        const Component = routeComponent(Mock, {}, true)

        return new Promise((resolve) =>
            mount(<Component isHydrating={false} onGetPropsError={resolve} />)
        ).then((caught) => expect(caught).toBe(error))
    })

    test(`Catches and calls onGetPropsError() when getProps rejects`, () => {
        const errorText = 'rejectErrorText'
        const Mock = () => <div>Mock</div>
        Mock.shouldGetProps = trueOnceThenFalse()
        Mock.getProps = () => delay(10).then(() => Promise.reject(errorText))

        const Component = routeComponent(Mock)

        return new Promise((resolve) =>
            mount(<Component isHydrating={false} onGetPropsError={resolve} />)
        ).then((caught) => expect(caught).toBe(errorText))
    })

    test(`Passes props returned from getProps to the wrapped component`, () => {
        const initialProps = {foo: 'bar'}

        const Mock = (props) => <div>Mock {JSON.stringify(props)}</div>
        Mock.displayName = 'MockComponent'

        Mock.getProps = () => delay(150).then(() => initialProps)

        Mock.shouldGetProps = trueOnceThenFalse()

        const Component = routeComponent(Mock, {}, true)

        return new Promise((resolve) => {
            const wrapper = mount(<Component onUpdateComplete={() => resolve(wrapper)} />)
        })
            .then((wrapper) => wrapper.update())
            .then((wrapper) => {
                expect(wrapper.find('MockComponent').props()).toMatchObject(initialProps)
            })
    })
})

describe('getRoutes', () => {
    test('wraps components with the routeComponent HOC', () => {
        const mappedRoutes = getRoutes()
        expect(mappedRoutes.length).toBe(2)
        const [first, second] = mappedRoutes
        const expectedName = 'WithErrorHandling(withRouter(routeComponent(Component)))'
        expect(first.component.displayName).toBe(expectedName)

        const expected404Name = 'WithErrorHandling(withRouter(routeComponent(Throw404)))'
        expect(second.component.displayName).toBe(expected404Name)
    })
})

/**
 * A race condition is created when a user clicks two links for the same
 * component. If the getProps call for the second link resolves before the
 * first, we want to make sure the results of the first are ignored. In this
 * test we setProps twice to trigger getProps calls and make sure only the
 * second one updates the component.
 */
describe('Handles race conditions for getProps', () => {
    test(`unresolved calls to 'getProps' are squashed by new new calls`, async () => {
        const render = jest.fn()

        // We can't inspect the render directly, so include this mock function
        // in the render and inspect that
        // eslint-disable-next-line react/prop-types
        const MockComponent = ({callId}) => <p>{render(callId)}</p>
        // Skip getProps on mount by returning false the first time
        MockComponent.shouldGetProps = falseOnceThenTrue()
        MockComponent.getProps = jest
            .fn()
            .mockImplementationOnce(() => Promise.resolve({callId: 1}))
            .mockImplementationOnce(() => Promise.resolve({callId: 2}))

        const Component = routeComponent(MockComponent, {}, true)

        let resolver = []
        let wrapper
        const onUpdateComplete = () => {
            const r = resolver.pop()
            if (r) {
                r(wrapper)
            }
        }
        await new Promise((resolve) => {
            resolver.push(resolve)
            wrapper = mount(<Component onUpdateComplete={onUpdateComplete} />)
        })

        // Update the wrappers props 2 times in succession, this will cause `getProps` to be called
        // twice, but only the later should call `setStateAsync` causing a re-render.
        const p1 = new Promise((resolve) => {
            resolver.push(resolve)
            wrapper.setProps({tick: 1})
        })
        const p2 = new Promise((resolve) => {
            resolver.push(resolve)
            wrapper.setProps({tick: 2})
        })
        await Promise.all([p1, p2])

        expect(MockComponent.getProps.mock.calls.length).toBe(2)
        expect(render).not.toHaveBeenCalledWith(1)
        expect(render).toHaveBeenCalledWith(2)
    })
})

describe('Uses preloaded props on initial clientside page load', () => {
    test('Uses preloadedProps when hydrating', async () => {
        global.__HYDRATING__ = true
        const preloadedProps = {foo: 'bar'}
        const expectedPreloadedChildProps = {foo: 'bar', isLoading: false}

        const Mock = (props) => <div>Mock {JSON.stringify(props)}</div>
        Mock.displayName = 'MockComponent'

        const Component = routeComponent(Mock, true, {})

        const wrapped = await new Promise((resolve) => {
            const wrapper = mount(
                <Component
                    preloadedProps={preloadedProps}
                    onUpdateComplete={() => resolve(wrapper)}
                />
            )
        })

        expect(wrapped.find('MockComponent').props()).toMatchObject(expectedPreloadedChildProps)
    })

    test('Does not use preloadedProps when not hydrating', async () => {
        global.__HYDRATING__ = false
        const preloadedProps = {foo: 'bar'}
        const expectedNotPreloadedChildProps = {isLoading: false}

        const Mock = (props) => <div>Mock {JSON.stringify(props)}</div>
        Mock.displayName = 'MockComponent'

        const Component = routeComponent(Mock, true, {})

        const wrapped = await new Promise((resolve) => {
            const wrapper = mount(
                <Component
                    preloadedProps={preloadedProps}
                    onUpdateComplete={() => resolve(wrapper)}
                />
            )
        })

        expect(wrapped.find('MockComponent').props()).toMatchObject(expectedNotPreloadedChildProps)
    })
})
