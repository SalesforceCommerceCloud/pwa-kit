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
import {renderWithProviders} from '../../utils/test-utils'
import Field from '../../components/field/index'

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
                    inputRef={emailRef}
                />
            )}
        </TestComponent>
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    expect(emailInput).toBeInTheDocument()

    // Focus the input using the ref and check if it works
    emailRef.current.focus()
    expect(emailInput).toHaveFocus()
})

test('renders Field component without ref and works correctly', () => {
    renderWithProviders(
        <TestComponent defaultValues={{email: ''}}>
            {({control}) => (
                <Field
                    name="email"
                    label="Email"
                    type="text"
                    control={control}
                    placeholder="Enter your email"
                />
            )}
        </TestComponent>
    )

    const emailInput = screen.getByPlaceholderText('Enter your email')
    expect(emailInput).toBeInTheDocument()

    // Simulate user typing email
    fireEvent.change(emailInput, {target: {value: 'testuser@example.com'}})
    expect(emailInput.value).toBe('testuser@example.com')
})

test('renders Field component with endElement', () => {
    const EndElementComponent = () => <span data-testid="end-element">USD</span>

    renderWithProviders(
        <TestComponent defaultValues={{amount: ''}}>
            {({control}) => (
                <Field
                    name="amount"
                    label="Amount"
                    type="text"
                    control={control}
                    placeholder="Enter amount"
                    inputProps={{
                        endElement: <EndElementComponent />
                    }}
                />
            )}
        </TestComponent>
    )

    const amountInput = screen.getByPlaceholderText('Enter amount')
    const endElement = screen.getByTestId('end-element')

    expect(amountInput).toBeInTheDocument()
    expect(endElement).toBeInTheDocument()
    expect(endElement).toHaveTextContent('USD')
})

test('renders Field component with password type shows password toggle endElement', () => {
    renderWithProviders(
        <TestComponent defaultValues={{password: ''}}>
            {({control}) => (
                <Field
                    name="password"
                    label="Password"
                    type="password"
                    control={control}
                    placeholder="Enter your password"
                />
            )}
        </TestComponent>
    )

    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const toggleButton = screen.getByLabelText('Show password')

    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(toggleButton).toBeInTheDocument()

    // Click toggle to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument()

    // Click toggle again to hide password
    fireEvent.click(screen.getByLabelText('Hide password'))
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Show password')).toBeInTheDocument()
})

test('renders select Field component with correct ref assignment for React Hook Form', () => {
    renderWithProviders(
        <TestComponent defaultValues={{country: ''}}>
            {({control}) => (
                <Field
                    name="country"
                    label="Country"
                    type="select"
                    control={control}
                    defaultValue=""
                    options={[
                        {value: '', label: 'Select Country'},
                        {value: 'US', label: 'United States'},
                        {value: 'CA', label: 'Canada'},
                        {value: 'UK', label: 'United Kingdom'}
                    ]}
                />
            )}
        </TestComponent>
    )

    const selectElement = screen.getByRole('combobox')
    expect(selectElement).toBeInTheDocument()
    expect(selectElement.tagName).toBe('SELECT')
    expect(selectElement.value).toBe('')

    fireEvent.change(selectElement, {target: {value: 'US'}})
    expect(selectElement.value).toBe('US')

    selectElement.focus()
    expect(selectElement).toHaveFocus()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveValue('')
    expect(options[0]).toHaveTextContent('Select Country')
    expect(options[1]).toHaveValue('US')
    expect(options[1]).toHaveTextContent('United States')
    expect(options[2]).toHaveValue('CA')
    expect(options[2]).toHaveTextContent('Canada')
    expect(options[3]).toHaveValue('UK')
    expect(options[3]).toHaveTextContent('United Kingdom')
})
