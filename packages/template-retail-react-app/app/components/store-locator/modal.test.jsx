/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {StoreLocatorModal} from '@salesforce/retail-react-app/app/components/store-locator/modal'

const mockUseBreakpointValue = jest.fn()
jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react')
    return {
        ...originalModule,
        useBreakpointValue: () => mockUseBreakpointValue
    }
})

jest.mock('./main', () => ({
    StoreLocator: () => <div data-testid="store-locator-content">Store Locator Content</div>
}))

describe('StoreLocatorModal', () => {
    const mockProps = {
        isOpen: true,
        onClose: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseBreakpointValue.mockReturnValue(true) // Default to desktop view
    })

    it('renders desktop view correctly', () => {
        mockUseBreakpointValue.mockReturnValue(true) // Desktop view
        renderWithProviders(<StoreLocatorModal {...mockProps} />)

        expect(screen.getByText('Store Locator Content')).toBeTruthy()
        expect(screen.getByTestId('store-locator-content')).toBeTruthy()
    })

    it('renders mobile view correctly', () => {
        mockUseBreakpointValue.mockReturnValue(false) // Mobile view
        renderWithProviders(<StoreLocatorModal {...mockProps} />)

        expect(screen.getByText('Store Locator Content')).toBeTruthy()
        expect(screen.getByTestId('store-locator-content')).toBeTruthy()
    })

    it('does not render when closed', () => {
        renderWithProviders(<StoreLocatorModal isOpen={false} onClose={jest.fn()} />)

        expect(screen.queryByText('Store Locator Content')).toBeNull()
        expect(screen.queryByTestId('store-locator-content')).toBeNull()
    })

    it('calls onClose when close button is clicked', () => {
        const onClose = jest.fn()
        renderWithProviders(<StoreLocatorModal isOpen={true} onClose={onClose} />)

        const closeButton = screen.getByLabelText('Close')
        closeButton.click()
        expect(onClose).toHaveBeenCalled()
    })
})
