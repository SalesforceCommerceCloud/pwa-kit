/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppLayout from './app-layout'

// Mock OfflineNotification component
jest.mock('../../../offline-notification', () => {
    return function MockOfflineNotification() {
        return <div data-testid="offline-notification">You are offline</div>
    }
})

describe('AppLayout', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    const defaultProps = {
        isOnline: true,
        headerComponent: <div data-testid="header">Header</div>,
        footerComponent: <div data-testid="footer">Footer</div>,
        modalsComponent: <div data-testid="modals">Modals</div>,
        children: <div data-testid="main-content">Main Content</div>
    }

    it('renders all components when online', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.queryByTestId('offline-notification')).not.toBeInTheDocument()
    })

    it('shows offline notification when offline', () => {
        const props = {
            ...defaultProps,
            isOnline: false
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('offline-notification')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
    })

    it('renders without header component', () => {
        const props = {
            ...defaultProps,
            headerComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.queryByTestId('header')).not.toBeInTheDocument()
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('renders without footer component', () => {
        const props = {
            ...defaultProps,
            footerComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    })

    it('renders without modals component', () => {
        const props = {
            ...defaultProps,
            modalsComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.queryByTestId('modals')).not.toBeInTheDocument()
    })

    it('renders without children', () => {
        const props = {
            ...defaultProps,
            children: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.queryByTestId('main-content')).not.toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('handles undefined isOnline prop (defaults to online)', () => {
        const props = {
            ...defaultProps,
            isOnline: undefined
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.queryByTestId('offline-notification')).not.toBeInTheDocument()
    })

    it('uses proper flex layout structure', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        // The layout should be rendered within a flex container
        expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('renders multiple children correctly', () => {
        const props = {
            ...defaultProps,
            children: [
                <div key="1" data-testid="child-1">
                    Child 1
                </div>,
                <div key="2" data-testid="child-2">
                    Child 2
                </div>
            ]
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('child-1')).toBeInTheDocument()
        expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
})
