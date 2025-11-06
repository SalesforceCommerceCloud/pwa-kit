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
import StoreInventoryFilter from '@salesforce/retail-react-app/app/pages/product-list/partials/inventory-filter'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
import {useStoreLocatorModal} from '@salesforce/retail-react-app/app/hooks/use-store-locator'

jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-store-locator', () => ({
    useStoreLocatorModal: jest.fn()
}))

const mockToggleFilter = jest.fn()

const defaultProps = {
    toggleFilter: mockToggleFilter,
    selectedFilters: {}
}

const propsWithFilterEnabled = {
    toggleFilter: mockToggleFilter,
    selectedFilters: {ilids: 'inv-456'}
}

const mockStoreData = {
    id: 'store-123',
    name: 'Test Store Location',
    inventoryId: 'inv-456'
}

describe('StoreInventoryFilter', () => {
    const mockOnOpen = jest.fn()
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
        useSelectedStore.mockReturnValue({
            selectedStore: null,
            isLoading: false,
            error: null,
            hasSelectedStore: false
        })
        useStoreLocatorModal.mockReturnValue({
            isOpen: false,
            onOpen: mockOnOpen,
            onClose: mockOnClose
        })
    })

    test('renders component with default state', async () => {
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        expect(screen.getByTestId('sf-store-inventory-filter')).toBeInTheDocument()
        expect(screen.getByText('Shop by Availability')).toBeInTheDocument()
        expect(screen.getByText('Select Store')).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    test('displays selected store name when store data exists', async () => {
        useSelectedStore.mockReturnValue({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        })

        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })
    })

    test('shows checkbox as checked when ilids filter is selected', () => {
        const propsWithFilter = {
            ...defaultProps,
            selectedFilters: {ilids: 'inv-456'}
        }

        renderWithProviders(<StoreInventoryFilter {...propsWithFilter} />)

        expect(screen.getByRole('checkbox')).toBeChecked()
    })

    test('opens store locator modal when checkbox clicked without selected store', async () => {
        const user = userEvent.setup()
        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)

        expect(mockOnOpen).toHaveBeenCalled()
    })

    test('opens store locator modal when store name is clicked', async () => {
        const user = userEvent.setup()
        useSelectedStore.mockReturnValue({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        })

        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Test Store Location'))

        expect(mockOnOpen).toHaveBeenCalled()
    })

    test('calls toggleFilter when checkbox is changed with selected store', async () => {
        const user = userEvent.setup()
        useSelectedStore.mockReturnValue({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        })

        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })

        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)

        expect(mockToggleFilter).toHaveBeenCalledWith({value: 'inv-456'}, 'ilids', false, false)
    })

    test('calls toggleFilter to remove filter when checkbox is unchecked', async () => {
        const user = userEvent.setup()
        useSelectedStore.mockReturnValue({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        })

        const propsWithFilter = {
            ...defaultProps,
            selectedFilters: {ilids: 'inv-456'}
        }

        renderWithProviders(<StoreInventoryFilter {...propsWithFilter} />)

        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })

        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeChecked()

        await user.click(checkbox)

        expect(mockToggleFilter).toHaveBeenCalledWith({value: 'inv-456'}, 'ilids', true, false)
    })

    test('applies filter when store is selected from locator modal', async () => {
        const user = userEvent.setup()

        // Set up with a store already selected
        useSelectedStore.mockReturnValue({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        })

        renderWithProviders(<StoreInventoryFilter {...defaultProps} />)

        // Verify the store name is displayed
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })

        // Click checkbox to apply the filter (no modal should open since store is selected)
        const checkbox = screen.getByRole('checkbox')
        await user.click(checkbox)

        // The filter should have been applied immediately
        expect(mockToggleFilter).toHaveBeenCalledWith({value: 'inv-456'}, 'ilids', false, false)

        // Ensure no modal was opened
        expect(mockOnOpen).not.toHaveBeenCalled()
    })

    test('applies filter when selected store changes and checkbox is checked', async () => {
        const mockStoreData2 = {
            id: 'store-456',
            name: 'Test Store Location 2',
            inventoryId: 'inv-222'
        }

        useSelectedStore.mockImplementation(() => ({
            selectedStore: mockStoreData,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))

        renderWithProviders(<StoreInventoryFilter {...propsWithFilterEnabled} />)

        // Verify the first store name is displayed
        await waitFor(() => {
            expect(screen.getByText('Test Store Location')).toBeInTheDocument()
        })

        mockToggleFilter.mockClear()

        // Change to the second store
        useSelectedStore.mockImplementation(() => ({
            selectedStore: mockStoreData2,
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))
        renderWithProviders(<StoreInventoryFilter {...propsWithFilterEnabled} />)

        // The filter should have been applied with the new store's inventoryId
        await waitFor(() => {
            expect(mockToggleFilter).toHaveBeenCalledWith({value: 'inv-222'}, 'ilids', false, false)
        })
    })
})
