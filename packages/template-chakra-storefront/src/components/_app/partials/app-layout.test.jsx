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
        modalsComponent: <div data-testid="modals">Modals</div>
    }

    it('renders all components when online', () => {
        renderWithProviders(
            <AppLayout {...defaultProps}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
        expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
    })

    it('shows offline notification when offline', () => {
        const props = {
            ...defaultProps,
            isOnline: false
        }

        renderWithProviders(
            <AppLayout {...props}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.getByTestId('offline-banner')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('renders without header component', () => {
        const props = {
            ...defaultProps,
            headerComponent: null
        }

        renderWithProviders(
            <AppLayout {...props}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.queryByTestId('header')).not.toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('renders without footer component', () => {
        const props = {
            ...defaultProps,
            footerComponent: null
        }

        renderWithProviders(
            <AppLayout {...props}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('renders without modals component', () => {
        const props = {
            ...defaultProps,
            modalsComponent: null
        }

        renderWithProviders(
            <AppLayout {...props}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.queryByTestId('modals')).not.toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('renders without children', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('modals')).toBeInTheDocument()
    })

    it('handles undefined isOnline prop (defaults to online)', () => {
        const props = {
            ...defaultProps,
            isOnline: undefined
        }

        renderWithProviders(
            <AppLayout {...props}>
                <div data-testid="children">Children</div>
            </AppLayout>
        )

        expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
        expect(screen.getByTestId('children')).toBeInTheDocument()
    })

    it('uses proper flex layout structure', () => {
        renderWithProviders(<AppLayout {...defaultProps} />)

        // Check that the layout container is rendered
        const layoutContainer = screen.getByTestId('header').parentElement
        expect(layoutContainer).toBeInTheDocument()
    })

    it('renders multiple children correctly', () => {
        renderWithProviders(
            <AppLayout {...defaultProps}>
                <div data-testid="child1">Child 1</div>
                <div data-testid="child2">Child 2</div>
                <div data-testid="child3">Child 3</div>
            </AppLayout>
        )

        expect(screen.getByTestId('child1')).toBeInTheDocument()
        expect(screen.getByTestId('child2')).toBeInTheDocument()
        expect(screen.getByTestId('child3')).toBeInTheDocument()
    })
})
