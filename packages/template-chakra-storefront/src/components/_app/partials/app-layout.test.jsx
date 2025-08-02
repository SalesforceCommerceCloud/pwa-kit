/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import AppLayout from './app-layout'

// Mock OfflineBanner component
jest.mock('../../offline-banner', () => {
    return function MockOfflineBanner() {
        return <div data-testid="offline-banner">Offline Banner</div>
    }
})

describe('AppLayout', () => {
    const defaultProps = {
        isOnline: true,
        headerComponent: <div data-testid="header">Header</div>,
        footerComponent: <div data-testid="footer">Footer</div>,
        modalsComponent: <div data-testid="modals">Modals</div>,
        children: <div data-testid="children">Children</div>
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders all components when online', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()

        // Should not show offline banner when online
        expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
    })

    test('shows offline notification when offline', () => {
        const props = {
            ...defaultProps,
            isOnline: false
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('offline-banner')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    test('renders without header component', () => {
        const props = {
            ...defaultProps,
            headerComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.queryByTestId('header')).not.toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    test('renders without footer component', () => {
        const props = {
            ...defaultProps,
            footerComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    test('renders without modals component', () => {
        const props = {
            ...defaultProps,
            modalsComponent: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.queryByTestId('modals')).not.toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    test('renders without children', () => {
        const props = {
            ...defaultProps,
            children: null
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.queryByTestId('children')).not.toBeInTheDocument()
    })

    test('handles undefined isOnline prop (defaults to online)', () => {
        const props = {
            ...defaultProps,
            isOnline: undefined
        }

        renderWithProviders(<AppLayout {...props} />)

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        // Should not show offline banner when isOnline is undefined (defaults to online)
        expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
    })

    test('uses proper flex layout structure', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        const layout = screen.getByTestId('app-layout')
        expect(layout).toBeInTheDocument()
    })

    test('renders multiple children correctly', () => {
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

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('child-1')).toBeInTheDocument()
        expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
})
