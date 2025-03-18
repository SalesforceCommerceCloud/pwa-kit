/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, waitFor, within} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ResetPasswordForm from '.'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {useForm} from 'react-hook-form'

const MockedComponent = ({mockSubmitForm, mockClickSignIn}) => {
    const form = useForm()
    return (
        <div>
            <ResetPasswordForm
                form={form}
                submitForm={mockSubmitForm}
                clickSignIn={mockClickSignIn}
            />
        </div>
    )
}

MockedComponent.propTypes = {
    mockSubmitForm: PropTypes.func,
    mockClickSignIn: PropTypes.func
}

const MockedErrorComponent = () => {
    const form = useForm()
    const mockForm = {
        ...form,
        formState: {
            ...form.formState,
            errors: {
                global: {message: 'Something went wrong'}
            }
        }
    }
    return (
        <div>
            <ResetPasswordForm form={mockForm} />
        </div>
    )
}

test('Allows customer to generate password token and see success message', async () => {
    const mockSubmitForm = jest.fn(async (data) => ({
        password: jest.fn(async (passwordData) => {
            // Mock behavior inside the password function
            console.log('Password function called with:', passwordData)
        })
    }))
    const mockClickSignIn = jest.fn()
    // render our test component
    const {user} = renderWithProviders(
        <MockedComponent mockSubmitForm={mockSubmitForm} mockClickSignIn={mockClickSignIn} />,
        {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        }
    )

    // enter credentials and submit
    await user.type(await screen.findByLabelText('Email'), 'foo@test.com')
    await user.click(
        within(await screen.findByTestId('sf-auth-modal-form')).getByText(/reset password/i)
    )
    await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalled()
    })

    await waitFor(() => {
        expect(screen.getByText(/you will receive an email/i)).toBeInTheDocument()
        expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText('Back to Sign In'))

    expect(mockClickSignIn).toHaveBeenCalledTimes(1)
})

test('Renders error message with form error state', async () => {
    // Render our test component
    renderWithProviders(<MockedErrorComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
})
