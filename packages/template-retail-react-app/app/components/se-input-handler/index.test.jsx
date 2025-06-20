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
const mockSetParams = jest.fn()
const mockProcessSeParameters = jest.fn()
const mockSetShouldOpenModal = jest.fn()

jest.doMock(
    '@salesforce/retail-react-app/app/hooks/use-se-store-selection',
    () => mockUseSeStoreSelection
)

jest.doMock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => () => ({
    site: {id: 'test-site'}
}))

jest.doMock('@salesforce/retail-react-app/app/contexts/store-locator-params', () => ({
    useStoreLocatorParams: () => ({
        setParams: mockSetParams
    })
}))

jest.doMock('@salesforce/retail-react-app/app/hooks/use-external-search', () => () => {})

let SeInputHandler
const mockOnOpenStoreLocator = jest.fn()

jest.useFakeTimers()

beforeEach(async () => {
    jest.clearAllMocks()
    const SeInputHandlerModule = await import(
        '@salesforce/retail-react-app/app/components/se-input-handler'
    )
    SeInputHandler = SeInputHandlerModule.default

    window.localStorage.clear()

    mockUseSeStoreSelection.mockReturnValue({
        shouldOpenModal: true,
        setShouldOpenModal: mockSetShouldOpenModal,
        storeLocatorParams: {city: 'Boston'},
        processSeParameters: mockProcessSeParameters
    })

    window.localStorage.setItem('store_test-site', JSON.stringify({dummy: true}))
})

afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
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

    jest.clearAllMocks()

    mockUseSeStoreSelection.mockReturnValue({
        shouldOpenModal: true,
        setShouldOpenModal: mockSetShouldOpenModal,
        storeLocatorParams: {lat: 42.3601, lng: -71.0589},
        processSeParameters: mockProcessSeParameters
    })
    window.localStorage.setItem('store_test-site', JSON.stringify({dummy: true}))

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)
    jest.advanceTimersByTime(1500)

    await waitFor(() => {
        expect(window.location.search).toBe('?q=Shoes&size=10')
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('does not open modal when only country parameter is provided', async () => {
    mockUseSeStoreSelection.mockReturnValue({
        shouldOpenModal: false,
        setShouldOpenModal: mockSetShouldOpenModal,
        storeLocatorParams: null,
        processSeParameters: mockProcessSeParameters
    })

    window.history.pushState({}, '', '/test?country=US')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(window.location.search).toBe('?country=US')
        expect(mockOnOpenStoreLocator).not.toHaveBeenCalled()
    })
})

test('delays modal opening when external search query is present', async () => {
    window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589&q=ties')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)
    expect(mockOnOpenStoreLocator).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1500)

    await waitFor(() => {
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
})

test('opens modal immediately when no external search query is present', async () => {
    jest.clearAllMocks()
    jest.clearAllTimers()

    window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(mockOnOpenStoreLocator).toHaveBeenCalled()
    })
    const setTimeoutCalls = setTimeout.mock.calls.filter((call) => call[1] === 1500)
    expect(setTimeoutCalls).toHaveLength(0)
})

test('does not open modal when localStorage is empty', async () => {
    window.localStorage.clear()
    window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589')

    renderWithProviders(<SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />)

    await waitFor(() => {
        expect(mockOnOpenStoreLocator).not.toHaveBeenCalled()
    })
})
