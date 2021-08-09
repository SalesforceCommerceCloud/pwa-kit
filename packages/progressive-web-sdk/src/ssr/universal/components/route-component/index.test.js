/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
