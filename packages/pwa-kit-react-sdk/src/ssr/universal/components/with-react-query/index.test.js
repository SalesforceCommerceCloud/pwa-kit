/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {mount} from 'enzyme'
// import {withRouter} from './index'
import {getRoutes} from '../../utils'
import {withReactQuery} from './index'
import {useQuery} from '@tanstack/react-query'

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
    const MockComponent = () => {
        useQuery(['mock-query'], async () => ({}))
        return <p>MockComponent</p>
    }
    MockComponent.displayName = 'MockComponent'
    MockComponent.getTemplateName = jest.fn(() => 'MockComponent')
    return MockComponent
}

beforeEach(() => {
    delete global.__HYDRATING__
})

describe('The withReactQuery component', () => {
    test('Is a higher-order component', () => {
        const Mock = getMockComponent()
        const Component = withReactQuery(Mock)
        const wrapper = mount(<Component />)
        expect(wrapper.contains(<p>MockComponent</p>)).toBe(true)
    })

    test('Wraps with QueryClientProvider', () => {
        const Mock = getMockComponent()
        const Component = withReactQuery(Mock)

        expect(() => {
            mount(<Component />)
        }).not.toThrow()
        expect(() => {
            mount(<Mock />)
        }).toThrow()
    })
})

describe('withReactQuery enhanceRoutes', () => {
    test('does not wrap routes', () => {
        const Mock = getMockComponent()
        const Component = withReactQuery(Mock)
        const routes = getRoutes()

        let mappedRoutes = Component.enhanceRoutes(routes)
        expect(mappedRoutes.length).toBe(2)
        const [first, second] = mappedRoutes
        const expectedName = 'withLoadableResolver(Component)'
        expect(first.component.displayName).toBe(expectedName)

        const expected404Name = 'withLoadableResolver(Throw404)'
        expect(second.component.displayName).toBe(expected404Name)
    })
})
