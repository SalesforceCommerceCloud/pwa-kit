/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import Footer from './index'
import {renderWithProviders} from '../../utils/test-utils'

//@sfdc-extension-block-start SFDC_EXT_MARKETING_CONSENT_ENABLED
// Mocks for subscription hook to test UI interactions without hitting network
const mockActions = {setEmail: jest.fn(), submit: jest.fn()}
const mockState = {email: '', isLoading: false, feedback: {message: null, type: 'success'}}

jest.mock('../subscription/use-subscription', () => () => ({
    state: mockState,
    actions: mockActions
}))
//@sfdc-extension-block-end SFDC_EXT_MARKETING_CONSENT_ENABLED

test('renders component', () => {
    renderWithProviders(<Footer />)
    expect(screen.getAllByRole('link', {name: 'Privacy Policy'})).toHaveLength(2)
})

test('renders mobile version by default', () => {
    renderWithProviders(<Footer />)
    // This link is hidden initially, but would be shown for desktop
    expect(screen.getByRole('link', {name: 'About Us', hidden: true})).toBeInTheDocument()
})

describe('Footer subscribe interactions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockState.email = ''
        mockState.isLoading = false
        mockState.feedback = {message: null, type: 'success'}
    })

    test('clicking Subscribe calls submit', () => {
        renderWithProviders(<Footer />)
        const btn = screen.getByRole('button', {name: /subscribe/i})
        btn.click()
        expect(mockActions.submit).toHaveBeenCalledTimes(1)
    })

    test('pressing Enter in email calls submit when not loading', () => {
        renderWithProviders(<Footer />)
        const input = screen.getByLabelText(/email address/i)
        input.focus()
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
        expect(mockActions.submit).toHaveBeenCalledTimes(1)
    })

    test('pressing Enter in email does not call submit when loading', () => {
        mockState.isLoading = true
        renderWithProviders(<Footer />)
        const input = screen.getByLabelText(/email address/i)
        input.focus()
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}))
        expect(mockActions.submit).not.toHaveBeenCalled()
    })

    test('typing calls setEmail', async () => {
        const {user} = renderWithProviders(<Footer />)
        const input = screen.getByLabelText(/email address/i)
        await user.type(input, 'user@example.com')
        expect(mockActions.setEmail).toHaveBeenCalled()
    })

    test('renders feedback message', () => {
        mockState.feedback = {message: 'Thanks for subscribing!', type: 'success'}
        renderWithProviders(<Footer />)
        expect(screen.getByText(/thanks for subscribing!/i)).toBeInTheDocument()
    })
})
