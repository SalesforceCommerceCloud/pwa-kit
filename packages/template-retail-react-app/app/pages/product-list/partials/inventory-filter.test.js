/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import StoreInventoryFilter from './inventory-filter'

jest.mock('@salesforce/retail-react-app/app/utils/store-locator-utils', () => ({
    getSelectedStoreData: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/store-locator-modal', () => {
    return function MockStoreLocatorModal({isOpen, onClose}) {
        return isOpen ? (
            <div data-testid="store-locator-modal">
                <button onClick={onClose}>Close Modal</button>
            </div>
        ) : null
    }
})

const mockToggleFilter = jest.fn()
const mockGetSelectedStoreData = require('@salesforce/retail-react-app/app/utils/store-locator-utils').getSelectedStoreData

const defaultProps = {
    toggleFilter: mockToggleFilter,
    selectedFilters: {}
}

const mockStoreData = {
    id: 'store-123',
    name: 'Test Store Location',
    inventoryId: 'inv-456'
}

describe('StoreInventoryFilter', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
        mockGetSelectedStoreData.mockReturnValue(null)
    })

    test('renders component with default state', async () => {
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        expect(screen.getByTestId('sf-store-inventory-filter')).toBeInTheDocument()
        expect(screen.getByText('Shop by Availability')).toBeInTheDocument()
        expect(screen.getByText('Select Store')).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    test('displays selected store name when store data exists', async () => {
        mockGetSelectedStoreData.mockReturnValue(mockStoreData)
        
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })
    })

    test('shows checkbox as checked when ilids filter is selected', () => {
        const propsWithFilter = {
            ...defaultProps,
            selectedFilters: { ilids: 'inv-456' }
        }
        
        renderWithProviders(<StoreInventoryFilter {...propsWithFilter} />)
        
        expect(screen.getByRole('checkbox')).toBeChecked()
    })

    test('opens store locator modal when checkbox clicked without selected store', async () => {
        const user = userEvent.setup()
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        expect(screen.getByTestId('store-locator-modal')).toBeInTheDocument()
    })

    test('opens store locator modal when store name is clicked', async () => {
        const user = userEvent.setup()
        mockGetSelectedStoreData.mockReturnValue(mockStoreData)
        
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })
        
        await user.click(screen.getByText('Test Store Location'))
        
        expect(screen.getByTestId('store-locator-modal')).toBeInTheDocument()
    })

    test('calls toggleFilter when checkbox is changed with selected store', async () => {
        const user = userEvent.setup()
        mockGetSelectedStoreData.mockReturnValue(mockStoreData)
        
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })
        
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)
        
        expect(mockToggleFilter).toHaveBeenCalledWith(
            { value: 'inv-456' },
            'ilids',
            false,
            false
        )
    })

    test('calls toggleFilter to remove filter when checkbox is unchecked', async () => {
        const user = userEvent.setup()
        mockGetSelectedStoreData.mockReturnValue(mockStoreData)
        
        const propsWithFilter = {
            ...defaultProps,
            selectedFilters: { ilids: 'inv-456' }
        }
        
        renderWithProviders(<StoreInventoryFilter {...propsWithFilter} />)
        
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })
        
        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeChecked()
        
        await user.click(checkbox)
        
        expect(mockToggleFilter).toHaveBeenCalledWith(
            { value: 'inv-456' },
            'ilids',
            true,
            false
        )
    })

    test('applies filter when store is selected from locator modal', async () => {
        const user = userEvent.setup()
        // Initially no store
        mockGetSelectedStoreData.mockReturnValue(null)
        
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)
        
        // Click checkbox to open modal
        await user.click(screen.getByRole('checkbox'))
        expect(screen.getByTestId('store-locator-modal')).toBeInTheDocument()
        
        // Simulate store selection by changing the mock return value
        mockGetSelectedStoreData.mockReturnValue(mockStoreData)
        
        // Close modal
        await user.click(screen.getByText('Close Modal'))
        
        // Should have called toggleFilter to apply the filter
        expect(mockToggleFilter).toHaveBeenCalledWith(
            { value: 'inv-456' },
            'ilids',
            false,
            false
        )
    })
})
