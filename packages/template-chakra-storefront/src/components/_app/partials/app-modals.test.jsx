/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import AppModals from './app-modals'

// Mock AuthModal component
jest.mock('../../../hooks/use-auth-modal', () => ({
    AuthModal: function MockAuthModal(props) {
        // Only render if props are provided and not empty
        if (!props || Object.keys(props).length === 0) {
            return null
        }
        return <div data-testid="auth-modal">Auth Modal: {JSON.stringify(props)}</div>
    }
}))

// Mock DNTNotification component
jest.mock('../../../hooks/use-dnt-notification', () => ({
    DntNotification: function MockDNTNotification(props) {
        // Only render if props are provided and not empty
        if (!props || Object.keys(props).length === 0) {
            return null
        }
        return <div data-testid="dnt-notification">DNT Notification: {JSON.stringify(props)}</div>
    }
}))

describe('AppModals', () => {
    const mockAuthModal = {
        isOpen: true,
        onClose: jest.fn(),
        type: 'login'
    }

    const mockDNTNotification = {
        isOpen: true,
        onClose: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders auth modal when authModal prop is provided', () => {
        renderWithProviders(<AppModals authModal={mockAuthModal} />)

        expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
        expect(screen.queryByTestId('dnt-notification')).not.toBeInTheDocument()
    })

    it('renders DNT notification when dntNotification prop is provided', () => {
        renderWithProviders(<AppModals dntNotification={mockDNTNotification} />)

        expect(screen.getByTestId('dnt-notification')).toBeInTheDocument()
        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    })

    it('renders both modals when both props are provided', () => {
        renderWithProviders(
            <AppModals authModal={mockAuthModal} dntNotification={mockDNTNotification} />
        )

        expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
        expect(screen.getByTestId('dnt-notification')).toBeInTheDocument()
    })

    it('does not render modals when props are not provided', () => {
        renderWithProviders(<AppModals />)

        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
        expect(screen.queryByTestId('dnt-notification')).not.toBeInTheDocument()
    })

    it('handles undefined authModal prop', () => {
        renderWithProviders(<AppModals authModal={undefined} />)

        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    })

    it('handles undefined dntNotification prop', () => {
        renderWithProviders(<AppModals dntNotification={undefined} />)

        expect(screen.queryByTestId('dnt-notification')).not.toBeInTheDocument()
    })

    it('passes correct props to AuthModal', () => {
        renderWithProviders(<AppModals authModal={mockAuthModal} />)

        const authModalElement = screen.getByTestId('auth-modal')
        expect(authModalElement).toBeInTheDocument()
        expect(authModalElement.textContent).toContain('"isOpen":true')
        expect(authModalElement.textContent).toContain('"type":"login"')
    })

    it('passes correct props to DNTNotification', () => {
        renderWithProviders(<AppModals dntNotification={mockDNTNotification} />)

        const dntElement = screen.getByTestId('dnt-notification')
        expect(dntElement).toBeInTheDocument()
        expect(dntElement.textContent).toContain('"isOpen":true')
    })
})
