/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import LoginForm from '@salesforce/retail-react-app/app/components/login/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return <LoginForm form={form} {...props} />
}

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('allowPasswordless is true', () => {
        beforeEach(() => {
            const newConfig = {
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {allowPasswordless: true}
                }
            }
            getConfig.mockImplementation(() => newConfig)
        })

        test('renders passwordless login form', () => {
            renderWithProviders(<WrapperComponent />)

            expect(screen.getByText(/Welcome Back/)).toBeInTheDocument()
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
            expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Continue Securely'})).toBeInTheDocument()
            expect(screen.getByText(/Or Login With/)).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Password'})).toBeInTheDocument()
            expect(screen.getByText(/Don't have an account/)).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Create account'})).toBeInTheDocument()
        })

        test('renders form errors when "Continue Securely" button is clicked', async () => {
            const {user} = renderWithProviders(<WrapperComponent />)

            await user.click(screen.getByRole('button', {name: 'Continue Securely'}))
            expect(screen.getByText(/Please enter your email address./)).toBeInTheDocument()
        })

        test('renders form errors when "Password" button is clicked', async () => {
            const {user} = renderWithProviders(<WrapperComponent />)

            await user.click(screen.getByRole('button', {name: 'Password'}))
            expect(screen.getByText(/Please enter your email address./)).toBeInTheDocument()
        })
    })

    describe('allowPasswordless is false', () => {
        beforeEach(() => {
            const newConfig = {
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {allowPasswordless: false}
                }
            }
            getConfig.mockImplementation(() => newConfig)
        })

        test('renders standard login form', () => {
            renderWithProviders(<WrapperComponent />)

            expect(screen.getByText(/Welcome Back/)).toBeInTheDocument()
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
            expect(screen.getByLabelText('Password')).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Sign In'})).toBeInTheDocument()
            expect(screen.getByText(/Don't have an account/)).toBeInTheDocument()
            expect(screen.getByRole('button', {name: 'Create account'})).toBeInTheDocument()
        })

        test('renders form errors when "Sign In" button is clicked', async () => {
            const {user} = renderWithProviders(<WrapperComponent />)

            await user.click(screen.getByRole('button', {name: 'Sign In'}))
            expect(screen.getByText(/Please enter your email address./)).toBeInTheDocument()
        })
    })
})
