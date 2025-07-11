/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {useErrorHandler} from './use-errors'
import PropTypes from 'prop-types'

// Mock the toast hook
const mockToast = jest.fn()
jest.mock('./use-toast', () => ({
    __esModule: true,
    default: () => mockToast
}))

// Mock the constants
jest.mock('../constants', () => ({
    API_ERROR_MESSAGE: {
        id: 'api.error.message',
        defaultMessage: 'Something went wrong. Please try again.'
    }
}))

// Create a simple wrapper component that provides IntlProvider
const TestWrapper = ({children}) => {
    TestWrapper.propTypes = {
        children: PropTypes.node.isRequired
    }
    return (
        <IntlProvider locale="en-US" messages={{}}>
            {children}
        </IntlProvider>
    )
}

describe('useErrorHandler', () => {
    beforeEach(() => {
        mockToast.mockClear()
    })

    it('returns a showError function', () => {
        const {result} = renderHook(() => useErrorHandler(), {
            wrapper: TestWrapper
        })

        expect(typeof result.current).toBe('function')
    })

    it('calls toast with correct parameters when showError is invoked', () => {
        const {result} = renderHook(() => useErrorHandler(), {
            wrapper: TestWrapper
        })

        const showError = result.current

        // Call the showError function to cover line 20
        showError()

        // Verify that toast was called with the correct parameters
        expect(mockToast).toHaveBeenCalledTimes(1)
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Something went wrong. Please try again.',
            type: 'error'
        })
    })
})
