/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import LoginState from '@salesforce/retail-react-app/app/pages/checkout/partials/login-state'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'

const mockTogglePasswordField = jest.fn()
const idps = ['apple', 'google']

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return <LoginState form={form} togglePasswordField={mockTogglePasswordField} {...props} />
}

describe('LoginState', () => {
    test('shows login button when showPasswordField is false', async () => {
        const {getByRole, user} = renderWithProviders(<WrapperComponent />)
        const trigger = getByRole('button', {name: /Already have an account\? Log in/i})
        await user.click(trigger)
        expect(mockTogglePasswordField).toHaveBeenCalled()
    })

    test('shows checkout as guest button when showPasswordField is true', async () => {
        const {getByRole, user} = renderWithProviders(<WrapperComponent showPasswordField={true} />)
        const trigger = getByRole('button', {name: /Checkout as Guest/i})
        await user.click(trigger)
        expect(mockTogglePasswordField).toHaveBeenCalled()
    })

    test('shows passwordless login button if enabled', async () => {
        const {getByRole, getByText, user} = renderWithProviders(
            <WrapperComponent isPasswordlessEnabled={true} />
        )
        expect(getByText('Or Login With')).toBeInTheDocument()
        expect(getByRole('button', {name: 'Secure Link'})).toBeInTheDocument()
        const trigger = getByRole('button', {name: 'Password'})
        await user.click(trigger)
        expect(mockTogglePasswordField).toHaveBeenCalled()
        expect(getByRole('button', {name: 'Back to Sign In Options'})).toBeInTheDocument()
    })

    test('does not show passwordless login button if disabled', () => {
        const {queryByRole, queryByText} = renderWithProviders(
            <WrapperComponent isPasswordlessEnabled={false} />
        )
        expect(queryByText('Or Login With')).not.toBeInTheDocument()
        expect(queryByRole('button', {name: 'Secure Link'})).not.toBeInTheDocument()
    })

    test('shows social login buttons if enabled', async () => {
        const {getByRole, getByText, user} = renderWithProviders(
            <WrapperComponent isSocialEnabled={true} idps={idps} />
        )
        expect(getByText('Or Login With')).toBeInTheDocument()
        expect(getByRole('button', {name: /Google/i})).toBeInTheDocument()
        expect(getByRole('button', {name: /Apple/i})).toBeInTheDocument()
        const trigger = getByRole('button', {name: 'Password'})
        await user.click(trigger)
        expect(mockTogglePasswordField).toHaveBeenCalled()
        expect(getByRole('button', {name: 'Back to Sign In Options'})).toBeInTheDocument()
    })

    test('does not show social login buttons if disabled', () => {
        const {queryByRole, queryByText} = renderWithProviders(
            <WrapperComponent isSocialEnabled={false} idps={idps} />
        )
        expect(queryByText('Or Login With')).not.toBeInTheDocument()
        expect(queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
        expect(queryByRole('button', {name: /Apple/i})).not.toBeInTheDocument()
    })
})
