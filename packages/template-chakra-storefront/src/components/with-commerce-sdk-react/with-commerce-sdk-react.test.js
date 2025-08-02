/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen} from '@testing-library/react'

import {withCommerceSdkReact} from '.'

const createMockHook = (data, isLoading = false) => {
    return jest.fn(() => ({
        data,
        isLoading
    }))
}

const TestComponent = ({data, testProp}) => (
    <div data-testid="test-component">
        Test Component: {testProp}
        {data && <div data-testid="test-data">{JSON.stringify(data)}</div>}
    </div>
)

TestComponent.propTypes = {
    data: PropTypes.object,
    testProp: PropTypes.string
}

const PlaceholderComponent = ({testProp}) => (
    <div data-testid="placeholder-component">Loading... {testProp}</div>
)

PlaceholderComponent.propTypes = {
    testProp: PropTypes.string
}

describe('withCommerceSdkReact HOC', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    test('renders main component with data when not loading and has placeholder', () => {
        const mockData = {message: 'Hello World'}
        const mockHook = createMockHook(mockData, false)

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent testProp="test-value" />)

        expect(screen.getByTestId('test-component')).toBeInTheDocument()
        expect(screen.getByText('Test Component: test-value')).toBeInTheDocument()
        expect(screen.getByTestId('test-data')).toHaveTextContent('{"message":"Hello World"}')
        expect(screen.queryByTestId('placeholder-component')).not.toBeInTheDocument()
    })

    test('renders placeholder component when loading and has placeholder', () => {
        const loadingHook = createMockHook(null, true)
        const LoadingComponent = withCommerceSdkReact(TestComponent, {
            hook: loadingHook,
            placeholder: PlaceholderComponent
        })

        render(<LoadingComponent testProp="custom-value" />)

        expect(screen.getByTestId('placeholder-component')).toBeInTheDocument()
        expect(screen.getByText('Loading... custom-value')).toBeInTheDocument()
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument()
    })

    test('renders main component with data when not loading and no placeholder', () => {
        const mockData = {message: 'Hello'}
        const mockHook = createMockHook(mockData, false)

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook
        })

        render(<WrappedComponent testProp="test" />)

        expect(screen.getByTestId('test-component')).toBeInTheDocument()
        expect(screen.getByText('Test Component: test')).toBeInTheDocument()
    })

    test('renders nothing when loading and no placeholder', () => {
        const loadingHook = createMockHook(null, true)
        const LoadingComponent = withCommerceSdkReact(TestComponent, {
            hook: loadingHook
        })

        render(<LoadingComponent testProp="test" />)

        // Should render nothing when loading without placeholder
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument()
        expect(screen.queryByTestId('placeholder-component')).not.toBeInTheDocument()
    })

    test('calls hook with static queryOptions', () => {
        const mockData = {id: 1}
        const mockHook = createMockHook(mockData, false)
        const queryOptions = {limit: 10, offset: 0}

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook,
            queryOptions,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent testProp="test" />)
        expect(mockHook).toHaveBeenCalledWith(queryOptions)
    })

    test('calls hook with function queryOptions', () => {
        const mockData = {id: 1}
        const mockHook = createMockHook(mockData, false)
        const queryOptionsFunction = (props) => ({id: props.itemId})

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook,
            queryOptions: queryOptionsFunction,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent itemId="123" testProp="test" />)
        expect(mockHook).toHaveBeenCalledWith({id: '123'})
    })

    test('calls hook with empty object when no queryOptions provided', () => {
        const mockData = {id: 1}
        const mockHook = createMockHook(mockData, false)

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent testProp="test" />)
        expect(mockHook).toHaveBeenCalledWith({})
    })
})
