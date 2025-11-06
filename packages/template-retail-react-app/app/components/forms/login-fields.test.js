/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
import LoginFields from '@salesforce/retail-react-app/app/components/forms/login-fields'
import {screen} from '@testing-library/react'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return <LoginFields form={form} handleForgotPasswordClick={() => {}} {...props} />
}

describe('LoginFields component', () => {
    test('renders both email and password fields by default', () => {
        renderWithProviders(<WrapperComponent />)

        const emailInput = screen.getByLabelText('Email')
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')

        const passwordInput = screen.getByLabelText('Password')
        expect(passwordInput).toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('type', 'password')
        expect(screen.getByRole('button', {name: 'Forgot password?'})).toBeInTheDocument()
    })

    test('renders properly when hideEmail is true', () => {
        renderWithProviders(<WrapperComponent hideEmail={true} />)

        expect(screen.queryByText('Email')).not.toBeInTheDocument()
        expect(screen.queryByRole('textbox', {name: 'Email'})).not.toBeInTheDocument()

        const passwordInput = screen.getByLabelText('Password')
        expect(passwordInput).toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('type', 'password')
        expect(screen.getByRole('button', {name: 'Forgot password?'})).toBeInTheDocument()
    })

    test('renders properly when hidePassword is true', () => {
        renderWithProviders(<WrapperComponent hidePassword={true} />)

        const emailInput = screen.getByLabelText('Email')
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')

        expect(screen.queryByText('Password')).not.toBeInTheDocument()
        expect(screen.queryByRole('textbox', {name: 'password'})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: 'Forgot password?'})).not.toBeInTheDocument()
    })

    test('hides "Forgot Password?" button when handleForgotPasswordClick is undefined', () => {
        renderWithProviders(<WrapperComponent handleForgotPasswordClick={undefined} />)

        const passwordInput = screen.getByLabelText('Password')
        expect(passwordInput).toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('type', 'password')
        expect(screen.queryByRole('button', {name: 'Forgot password?'})).not.toBeInTheDocument()
    })
})
