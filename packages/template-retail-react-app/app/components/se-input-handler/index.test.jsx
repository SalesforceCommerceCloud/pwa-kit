/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor} from '@testing-library/react'

const mockUseSeStoreSelection = jest.fn()

jest.doMock(
    '@salesforce/retail-react-app/app/hooks/use-se-store-selection',
    () => mockUseSeStoreSelection
)

jest.doMock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => () => ({
    site: {id: 'test-site'}
}))

let SeInputHandler
const mockOnOpenStoreLocator = jest.fn()

beforeEach(async () => {
    jest.clearAllMocks()
    const SeInputHandlerModule = await import(
        '@salesforce/retail-react-app/app/components/se-input-handler'
    )
    SeInputHandler = SeInputHandlerModule.default

    window.localStorage.clear()

    mockUseSeStoreSelection.mockReturnValue({
        shouldOpenModal: true,
        setShouldOpenModal: jest.fn(),
        storeLocatorParams: {city: 'Boston'},
        processSeParameters: jest.fn()
    })

    window.localStorage.setItem('store_test-site', JSON.stringify({dummy: true}))
})

test('clears lat and lng parameters from URL when modal opens', async () => {
    window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('')
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('clears city and country parameters from URL when modal opens', async () => {
    window.history.pushState({}, '', '/test?city=Palo%20Alto&country=US')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('')
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('clears store, zip and country parameters from URL when modal opens', async () => {
    window.history.pushState({}, '', '/test?store=ABC%20Store&zip=02215&country=US')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('')
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('preserves other parameters when SE parameters are cleared', async () => {
    window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589&q=Shoes&size=10')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('?q=Shoes&size=10')
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('does not open modal when only country parameter is provided', async () => {
    mockUseSeStoreSelection.mockReturnValue({
        shouldOpenModal: false,
        setShouldOpenModal: jest.fn(),
        storeLocatorParams: null,
        processSeParameters: jest.fn()
    })

    window.history.pushState({}, '', '/test?country=US')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('?country=US')
        expect(mockOnOpenStoreLocator).not.toHaveBeenCalled()
    })
})
