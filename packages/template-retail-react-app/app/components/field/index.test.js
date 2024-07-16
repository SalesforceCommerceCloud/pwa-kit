/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, fireEvent} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Field from '@salesforce/retail-react-app/app/components/field/index'

// Mock messages for IntlProvider
const messages = {
    'field.password.assistive_msg.show_password': 'Show password',
    'field.password.assistive_msg.hide_password': 'Hide password'
}

const TestComponent = ({defaultValues, children}) => {
    const methods = useForm({defaultValues})
    return <form>{children(methods)}</form>
}

TestComponent.propTypes = {
    defaultValues: PropTypes.object.isRequired,
    children: PropTypes.func.isRequired
}

test('renders Field component and forwards ref', () => {
    const emailRef = React.createRef()

    renderWithProviders(
        <TestComponent defaultValues={{email: ''}}>
            {({control}) => (
                <Field
                    name="email"
                    label="Email"
                    type="email"
                    control={control}
                    placeholder="Enter your email"
                    ref={emailRef}
                />
            )}
        </TestComponent>,
        {wrapperProps: {intl: {locale: 'en', messages}}}
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    expect(emailInput).toBeInTheDocument()

    // Focus the input using the ref and check if it works
    emailRef.current.focus()
    expect(emailInput).toHaveFocus()
})

test('renders Field component and handles password visibility toggle', () => {
    const passwordRef = React.createRef()

    renderWithProviders(
        <TestComponent defaultValues={{password: ''}}>
            {({control}) => (
                <Field
                    name="password"
                    label="Password"
                    type="password"
                    control={control}
                    placeholder="Enter your password"
                    ref={passwordRef}
                />
            )}
        </TestComponent>,
        {wrapperProps: {intl: {locale: 'en', messages}}}
    )

    const passwordInput = screen.getByPlaceholderText('Enter your password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByRole('button', {name: /show password/i})
    expect(toggleButton).toBeInTheDocument()

    // Click the toggle button to show the password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Click the toggle button again to hide the password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
})

test('renders Field component without ref and works correctly', () => {
    renderWithProviders(
        <TestComponent defaultValues={{username: ''}}>
            {({control}) => (
                <Field
                    name="username"
                    label="Username"
                    type="text"
                    control={control}
                    placeholder="Enter your username"
                />
            )}
        </TestComponent>,
        {wrapperProps: {intl: {locale: 'en', messages}}}
    )

    const usernameInput = screen.getByPlaceholderText('Enter your username')
    expect(usernameInput).toBeInTheDocument()

    // Simulate user typing
    fireEvent.change(usernameInput, {target: {value: 'testuser'}})
    expect(usernameInput.value).toBe('testuser')
})
