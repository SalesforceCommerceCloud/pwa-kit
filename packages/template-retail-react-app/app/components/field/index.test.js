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
