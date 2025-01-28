/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

// Third-Party
import React from 'react'
import {render} from '@testing-library/react'

// Local
import withApplicationExtensionStore from './withApplicationExtensionStore'
import {useApplicationExtensionsStore} from '../hooks/useApplicationExtensionsStore'

// Mock the global store
jest.mock('../hooks/useApplicationExtensionsStore', () => {
    const addSlice = jest.fn()
    const getState = jest.fn(() => ({
        addSlice
    }))
    return {
        useApplicationExtensionsStore: {
            getState
        }
    }
})

// Mock types for test
type TestComponentProps = {
    message: string
}

// Mock Component
const TestComponent: React.FC<TestComponentProps> = ({message}) => <div>{message}</div>

describe('withApplicationExtensionStore HOC', () => {
    const mockSliceInitializer = jest.fn()
    const mockOptions = {
        id: 'testSlice',
        initializer: mockSliceInitializer
    }

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should add a slice to the store using addSlice', () => {
        const WrappedComponent = withApplicationExtensionStore(TestComponent, mockOptions)

        // Render the wrapped component
        render(<WrappedComponent message="Hello, World!" />)

        // Verify that addSlice was called with the correct arguments
        expect(useApplicationExtensionsStore.getState().addSlice).toHaveBeenCalledWith(
            'testSlice',
            mockSliceInitializer
        )
    })

    it('should render the wrapped component correctly', () => {
        const WrappedComponent = withApplicationExtensionStore(TestComponent, mockOptions)

        // Render the wrapped component
        const {getByText} = render(<WrappedComponent message="Hello, World!" />)

        // Verify that the wrapped component renders correctly
        expect(getByText('Hello, World!')).toBeInTheDocument()
    })

    it('should not modify the original component props', () => {
        const WrappedComponent = withApplicationExtensionStore(TestComponent, mockOptions)

        // Render the wrapped component
        const {getByText} = render(<WrappedComponent message="Test Message" />)

        // Verify that the original props are passed correctly
        expect(getByText('Test Message')).toBeInTheDocument()
    })
})
