/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen} from '@testing-library/react'

import {withCommerceSdkReact} from '@salesforce/retail-react-app/app/components/with-commerce-sdk-react'

// Creates a hook (aka function) that returns with the provided state. The state should be a react-query
// QueryResult object.
const createMockHook = (state) => jest.fn(() => state)

// Simple mock component that renders the data provided to it from the HoC as a script.
const MockedComponent = ({data}) => {
    return (
        <script data-testid="enhanced-component" type="application/json">
            {JSON.stringify(data)}
        </script>
    )
}

MockedComponent.propTypes = {
    data: PropTypes.object
}

// Mock placeholder used to ensure the loading state is working.
const MockedPlaceholder = () => <div data-testid="placeholder" />

const MockQueryParams = {
    parameters: {
        id: 1
    }
}

describe('withCommerceSdkReact enhanced component', function () {
    test('renders placeholder when hook is loading', async () => {
        const hookThatNeverLoads = createMockHook({data: undefined, isLoading: true})
        const EnhancedComponent = withCommerceSdkReact(MockedComponent, {
            hook: hookThatNeverLoads,
            placeholder: MockedPlaceholder
        })

        render(<EnhancedComponent />)

        // Placeholder is rendered.
        expect(screen.getByTestId('placeholder')).toBeDefined()
    })

    test('renders with data when hook is loaded', async () => {
        const data = {greeting: 'hello'}
        const hookThatIsLoaded = createMockHook({data, isLoading: false})

        const EnhandedComponent = withCommerceSdkReact(MockedComponent, {
            hook: hookThatIsLoaded,
            placeholder: MockedPlaceholder
        })

        render(<EnhandedComponent />)

        // Component is rendered with data.
        expect(screen.getByTestId('enhanced-component')).toBeDefined()
        expect(screen.getByTestId('enhanced-component').text).toBe(JSON.stringify(data))
    })

    test('hook is called with object `queryOptions` option', async () => {
        const data = {greeting: 'hello'}
        const hookThatIsLoaded = createMockHook({data, isLoading: false})

        const EnhandedComponent = withCommerceSdkReact(MockedComponent, {
            hook: hookThatIsLoaded,
            placeholder: MockedPlaceholder,
            queryOptions: MockQueryParams
        })

        render(<EnhandedComponent />)

        // Component called with provided `queryParams`
        expect(hookThatIsLoaded).toHaveBeenCalledWith(MockQueryParams)
    })

    test('hook is called with function `queryOptions` option', async () => {
        const data = {greeting: 'hello'}
        const hookThatIsLoaded = createMockHook({data, isLoading: false})
        const queryOptionsFn = () => MockQueryParams
        const EnhandedComponent = withCommerceSdkReact(MockedComponent, {
            hook: hookThatIsLoaded,
            placeholder: MockedPlaceholder,
            queryOptions: queryOptionsFn
        })

        render(<EnhandedComponent />)

        // Component called with provided `queryParams`
        expect(hookThatIsLoaded).toHaveBeenCalledWith(MockQueryParams)
    })
})
