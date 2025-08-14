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
jest.mock('../../../hooks', () => ({
    DntNotification: function MockDNTNotification(props) {
        // Only render if props are provided and not empty
        if (!props || Object.keys(props).length === 0) {
            return null
        }
        return <div data-testid="dnt-notification">DNT Notification: {JSON.stringify(props)}</div>
    }
}))

describe('AppModals', () => {
    const defaultProps = {
        authModal: null,
        dntNotification: null
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders auth modal when authModal prop is provided', () => {
        const props = {
            ...defaultProps,
            authModal: {isOpen: true, onClose: jest.fn()}
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    })

    test('renders DNT notification when dntNotification prop is provided', () => {
        const props = {
            ...defaultProps,
            dntNotification: {isOpen: true, onClose: jest.fn()}
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.getByTestId('dnt-notification')).toBeInTheDocument()
    })

    test('renders both modals when both props are provided', () => {
        const props = {
            authModal: {isOpen: true, onClose: jest.fn()},
            dntNotification: {isOpen: true, onClose: jest.fn()}
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
        expect(screen.getByTestId('dnt-notification')).toBeInTheDocument()
    })

    test('does not render modals when props are not provided', () => {
        renderWithProviders(<AppModals {...defaultProps} />)

        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
        expect(screen.queryByTestId('dnt-notification')).not.toBeInTheDocument()
    })

    test('handles undefined authModal prop', () => {
        const props = {
            ...defaultProps,
            authModal: undefined
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    })

    test('handles undefined dntNotification prop', () => {
        const props = {
            ...defaultProps,
            dntNotification: undefined
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.queryByTestId('dnt-notification')).not.toBeInTheDocument()
    })

    test('passes correct props to AuthModal', () => {
        const authModal = {isOpen: true, onClose: jest.fn(), initialView: 'login'}
        const props = {
            ...defaultProps,
            authModal
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.getByTestId('auth-modal')).toHaveTextContent(JSON.stringify(authModal))
    })

    test('passes correct props to DNTNotification', () => {
        const dntNotification = {isOpen: true, onClose: jest.fn()}
        const props = {
            ...defaultProps,
            dntNotification
        }
        renderWithProviders(<AppModals {...props} />)

        expect(screen.getByTestId('dnt-notification')).toHaveTextContent(
            JSON.stringify(dntNotification)
        )
    })
})
