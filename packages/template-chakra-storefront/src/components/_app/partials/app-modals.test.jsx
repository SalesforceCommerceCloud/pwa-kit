/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {createPortal} from 'react-dom'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppModals from './app-modals'

// Mock React Portal
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: jest.fn((child) => child)
}))

// Mock AuthModal component
jest.mock('../../../auth-modal', () => {
    const MockAuthModal = (props) => {
        return props.authModal ? (
            <div data-testid="auth-modal">
                <div data-testid="auth-modal-props">{JSON.stringify(props.authModal)}</div>
            </div>
        ) : null
    }
    MockAuthModal.propTypes = {
        authModal: require('prop-types').object
    }
    return MockAuthModal
})

// Mock DNTNotification component
jest.mock('../../../dnt-notification', () => {
    const MockDNTNotification = (props) => {
        return props.dntNotification ? (
            <div data-testid="dnt-notification">
                <div data-testid="dnt-props">{JSON.stringify(props.dntNotification)}</div>
            </div>
        ) : null
    }
    MockDNTNotification.propTypes = {
        dntNotification: require('prop-types').object
    }
    return MockDNTNotification
})

describe('AppModals', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock document.body for portal
        document.body.innerHTML = ''
    })

    it('renders auth modal when authModal prop is provided', () => {
        const authModal = {isOpen: true, onClose: jest.fn()}

        renderWithProviders(<AppModals authModal={authModal} />)

        expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
        expect(createPortal).toHaveBeenCalled()
    })

    it('renders DNT notification when dntNotification prop is provided', () => {
        const dntNotification = {isOpen: true, onClose: jest.fn()}

        renderWithProviders(<AppModals dntNotification={dntNotification} />)

        expect(screen.getByTestId('dnt-notification')).toBeInTheDocument()
        expect(createPortal).toHaveBeenCalled()
    })

    it('renders both modals when both props are provided', () => {
        const authModal = {isOpen: true, onClose: jest.fn()}
        const dntNotification = {isOpen: true, onClose: jest.fn()}

        renderWithProviders(<AppModals authModal={authModal} dntNotification={dntNotification} />)

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
        const authModal = {isOpen: true, onClose: jest.fn(), type: 'login'}

        renderWithProviders(<AppModals authModal={authModal} />)

        const propsElement = screen.getByTestId('auth-modal-props')
        const props = JSON.parse(propsElement.textContent)

        expect(props).toMatchObject(authModal)
    })

    it('passes correct props to DNTNotification', () => {
        const dntNotification = {isOpen: true, onClose: jest.fn(), message: 'DNT message'}

        renderWithProviders(<AppModals dntNotification={dntNotification} />)

        const propsElement = screen.getByTestId('dnt-props')
        const props = JSON.parse(propsElement.textContent)

        expect(props).toMatchObject(dntNotification)
    })
})
