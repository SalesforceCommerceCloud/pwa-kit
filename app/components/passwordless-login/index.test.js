/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
import PasswordlessLogin from '@salesforce/retail-react-app/app/components/passwordless-login'
import {screen} from '@testing-library/react'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return (
        <form>
            <PasswordlessLogin form={form} {...props} />
        </form>
    )
}

describe('PasswordlessLogin component', () => {
    test('renders properly', () => {
        renderWithProviders(<WrapperComponent />)

        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Continue Securely'})).toBeInTheDocument()
        expect(screen.getByText(/Or Login With/)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Password'})).toBeInTheDocument()
    })

    test('renders password input after "Password" button is clicked', async () => {
        const mockSetLoginType = jest.fn()
        const {user} = renderWithProviders(<WrapperComponent setLoginType={mockSetLoginType} />)

        await user.type(screen.getByLabelText('Email'), 'myemail@test.com')
        await user.click(screen.getByRole('button', {name: 'Password'}))
        expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Sign In'})).toBeInTheDocument()
    })

    test('stays on page when email field has form validation errors after the "Password" button is clicked', async () => {
        const mockSetLoginType = jest.fn()
        const {user} = renderWithProviders(<WrapperComponent setLoginType={mockSetLoginType} />)

        await user.type(screen.getByLabelText('Email'), 'badEmail')
        await user.click(screen.getByRole('button', {name: 'Password'}))
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    })

    test('renders social login buttons', async () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={true} idps={['google', 'apple']} />)

        expect(screen.getByRole('button', {name: /Google/})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Apple/})).toBeInTheDocument()
    })
})
