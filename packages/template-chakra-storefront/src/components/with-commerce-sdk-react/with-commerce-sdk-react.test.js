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

// Mock hook for testing
const createMockHook = (data, isLoading = false) => {
    return jest.fn(() => ({
        data,
        isLoading
    }))
}

// Test component to be wrapped
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

// Placeholder component
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

    test('renders components correctly based on loading state and passes props', () => {
        // Test with data loaded and placeholder
        const mockData = {message: 'Hello World'}
        const mockHook = createMockHook(mockData, false)

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook,
            placeholder: PlaceholderComponent
        })

        const {rerender} = render(<WrappedComponent testProp="test-value" />)

        expect(screen.getByTestId('test-component')).toBeInTheDocument()
        expect(screen.getByText('Test Component: test-value')).toBeInTheDocument()
        expect(screen.getByTestId('test-data')).toHaveTextContent('{"message":"Hello World"}')
        expect(screen.queryByTestId('placeholder-component')).not.toBeInTheDocument()

        // Test with loading state and placeholder
        const loadingHook = createMockHook(null, true)
        const LoadingComponent = withCommerceSdkReact(TestComponent, {
            hook: loadingHook,
            placeholder: PlaceholderComponent
        })

        rerender(<LoadingComponent testProp="custom-value" />)

        expect(screen.getByTestId('placeholder-component')).toBeInTheDocument()
        expect(screen.getByText('Loading... custom-value')).toBeInTheDocument()
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument()
    })

    test('works without placeholder component in both loading and loaded states', () => {
        // Test with data loaded, no placeholder
        const mockData = {message: 'Hello'}
        const mockHook = createMockHook(mockData, false)

        const WrappedComponent = withCommerceSdkReact(TestComponent, {
            hook: mockHook
        })

        const {rerender} = render(<WrappedComponent testProp="test" />)

        expect(screen.getByTestId('test-component')).toBeInTheDocument()
        expect(screen.getByText('Test Component: test')).toBeInTheDocument()

        // Test with loading state, no placeholder
        const loadingHook = createMockHook(null, true)
        const LoadingComponent = withCommerceSdkReact(TestComponent, {
            hook: loadingHook
        })

        rerender(<LoadingComponent testProp="test" />)

        // Should render nothing when loading without placeholder
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument()
        expect(screen.queryByTestId('placeholder-component')).not.toBeInTheDocument()
    })

    test('calls hook with different queryOptions configurations', () => {
        // Test with static queryOptions
        const mockData = {id: 1}
        const mockHook1 = createMockHook(mockData, false)
        const queryOptions = {limit: 10, offset: 0}

        const WrappedComponent1 = withCommerceSdkReact(TestComponent, {
            hook: mockHook1,
            queryOptions,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent1 testProp="test" />)
        expect(mockHook1).toHaveBeenCalledWith(queryOptions)

        // Test with function queryOptions
        const mockHook2 = createMockHook(mockData, false)
        const queryOptionsFunction = (props) => ({id: props.itemId})

        const WrappedComponent2 = withCommerceSdkReact(TestComponent, {
            hook: mockHook2,
            queryOptions: queryOptionsFunction,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent2 itemId="123" testProp="test" />)
        expect(mockHook2).toHaveBeenCalledWith({id: '123'})

        // Test with no queryOptions (should use empty object)
        const mockHook3 = createMockHook(mockData, false)

        const WrappedComponent3 = withCommerceSdkReact(TestComponent, {
            hook: mockHook3,
            placeholder: PlaceholderComponent
        })

        render(<WrappedComponent3 testProp="test" />)
        expect(mockHook3).toHaveBeenCalledWith({})
    })
})
