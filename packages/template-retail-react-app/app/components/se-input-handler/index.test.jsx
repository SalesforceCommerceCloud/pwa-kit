/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor} from '@testing-library/react'
import SeInputHandler from '@salesforce/retail-react-app/app/components/se-input-handler'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {useStoreLocatorParams} from '@salesforce/retail-react-app/app/contexts/store-locator-params'
import useSeStoreSelection from '@salesforce/retail-react-app/app/hooks/use-se-store-selection'
import useExternalSearch from '@salesforce/retail-react-app/app/hooks/use-external-search'
import PropTypes from 'prop-types'

jest.mock('@salesforce/retail-react-app/app/hooks/use-se-store-selection')
jest.mock('@salesforce/retail-react-app/app/contexts/store-locator-params')
jest.mock('@salesforce/retail-react-app/app/hooks/use-external-search')

describe('SeInputHandler', () => {
    const mockOnOpenStoreLocator = jest.fn()
    const mockSetShouldOpenModal = jest.fn()
    const mockProcessSeParameters = jest.fn()

    const mockStoreLocatorContext = {
        state: {
            mode: 'input',
            formValues: {},
            deviceCoordinates: {
                latitude: null,
                longitude: null
            }
        },
        setState: jest.fn()
    }

    const TestWrapper = ({children}) => (
        <StoreLocatorContext.Provider value={mockStoreLocatorContext}>
            {children}
        </StoreLocatorContext.Provider>
    )

    TestWrapper.propTypes = {
        children: PropTypes.node
    }

    const renderComponent = () => {
        return renderWithProviders(
            <TestWrapper>
                <SeInputHandler onOpenStoreLocator={mockOnOpenStoreLocator} />
            </TestWrapper>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        window.history.pushState({}, '', '/test')

        useStoreLocatorParams.mockReturnValue({
            params: {},
            setParams: jest.fn(),
            processSeParameters: mockProcessSeParameters
        })

        useSeStoreSelection.mockReturnValue({
            shouldOpenModal: false,
            setShouldOpenModal: mockSetShouldOpenModal,
            storeLocatorParams: {},
            processSeParameters: mockProcessSeParameters
        })

        useExternalSearch.mockReturnValue()
    })

    describe('Store Locator State Management', () => {
        test('updates store locator state for postal code search', async () => {
            window.history.pushState({}, '', '/test?zip=02215&country=US')

            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: true,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {postalCode: '02215', countryCode: 'US'},
                processSeParameters: mockProcessSeParameters
            })

            renderComponent()

            await waitFor(() => {
                expect(mockStoreLocatorContext.setState).toHaveBeenCalledWith(expect.any(Function))
                const updateFn = mockStoreLocatorContext.setState.mock.calls[0][0]
                const newState = updateFn({})
                expect(newState).toEqual(
                    expect.objectContaining({
                        mode: 'input',
                        formValues: {
                            postalCode: '02215',
                            countryCode: 'US'
                        }
                    })
                )
            })
        })

        test('updates store locator state for coordinate search', async () => {
            window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589')

            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: true,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {latitude: '42.3601', longitude: '-71.0589'},
                processSeParameters: mockProcessSeParameters
            })

            renderComponent()

            await waitFor(() => {
                expect(mockStoreLocatorContext.setState).toHaveBeenCalledWith(expect.any(Function))
                const updateFn = mockStoreLocatorContext.setState.mock.calls[0][0]
                const newState = updateFn({})
                expect(newState).toEqual(
                    expect.objectContaining({
                        mode: 'device',
                        deviceCoordinates: {
                            latitude: '42.3601',
                            longitude: '-71.0589'
                        }
                    })
                )
            })
        })
    })

    describe('Modal Control', () => {
        test('opens modal when shouldOpenModal becomes true', async () => {
            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: true,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {},
                processSeParameters: mockProcessSeParameters
            })

            renderComponent()

            await waitFor(() => {
                expect(mockOnOpenStoreLocator).toHaveBeenCalled()
            })
        })

        test('does not open modal when shouldOpenModal is false', () => {
            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: false,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {},
                processSeParameters: mockProcessSeParameters
            })

            renderComponent()

            expect(mockOnOpenStoreLocator).not.toHaveBeenCalled()
        })
    })

    describe('External Search Integration', () => {
        test('no delays modal opening when external search query is present', async () => {
            window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589&q=shoes')

            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: true,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {latitude: '42.3601', longitude: '-71.0589'},
                processSeParameters: mockProcessSeParameters
            })

            useExternalSearch.mockReturnValue()

            renderComponent()

            expect(mockOnOpenStoreLocator).toHaveBeenCalled()
        })

        test('opens modal immediately when no external search query is present', async () => {
            window.history.pushState({}, '', '/test?lat=42.3601&lng=-71.0589')

            useSeStoreSelection.mockReturnValue({
                shouldOpenModal: true,
                setShouldOpenModal: mockSetShouldOpenModal,
                storeLocatorParams: {latitude: '42.3601', longitude: '-71.0589'},
                processSeParameters: mockProcessSeParameters
            })

            renderComponent()

            expect(mockOnOpenStoreLocator).toHaveBeenCalled()
        })
    })
})
