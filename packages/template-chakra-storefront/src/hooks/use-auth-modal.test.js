/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {act, screen, within, waitFor} from '@testing-library/react'
import {renderWithProviders, createPathWithDefaults, guestToken} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../pages/account'
import {mockedRegisteredCustomer} from '../../mocks/mock-data'
import * as ReactHookForm from 'react-hook-form'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'
import {prependHandlersToServer} from '../../jest-setup'

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}
const mockPasswordToken = {
    email: 'foo@test.com',
    expiresInMinutes: 10,
    login: 'foo@test.com',
    resetToken: 'testresettoken'
}

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'customer@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'customer@test.com'
}

const mockAuthHelperFunctions = {
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()},
    [AuthHelpers.Register]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()},
    [AuthHelpers.ResetPassword]: {mutateAsync: jest.fn()}
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType])
    }
})
jest.mock('./use-datacloud', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        sendViewPage: jest.fn(),
        sendViewProduct: jest.fn(),
        sendViewCategory: jest.fn(),
        sendViewSearchResults: jest.fn(),
        sendViewRecommendations: jest.fn()
    }))
}))

// Mock usePasswordReset hook
const mockGetPasswordResetToken = jest.fn()
jest.mock('./use-password-reset', () => ({
    __esModule: true,
    usePasswordReset: () => ({
        getPasswordResetToken: mockGetPasswordResetToken
    })
}))

let authModal = undefined
const MockedComponent = (props) => {
    const {initialView, isPasswordlessEnabled = false} = props
    authModal = useAuthModal(initialView || undefined)
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <button onClick={authModal.onOpen}>Open Modal</button>
            <AuthModal {...authModal} isPasswordlessEnabled={isPasswordlessEnabled} />
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}
MockedComponent.propTypes = {
    initialView: PropTypes.string,
    isPasswordlessEnabled: PropTypes.bool
}

// Set up and clean up
beforeEach(() => {
    authModal = undefined
    prependHandlersToServer([
        {
            path: '*/customers',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockRegisteredCustomer
        },
        {
            path: '*/customers/:customerId',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockRegisteredCustomer
        },
        {
            path: '*/customers/password/actions/create-reset-token',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockPasswordToken
        },
        {
            path: '*/oauth2/token',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => ({
                customer_id: 'customerid',
                access_token: guestToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            })
        },
        {
            path: '*/baskets/actions/merge',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockMergedBasket
        }
    ])
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

test('Renders login modal by default', async () => {
    const {user} = renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await act(async () => {
        await user.click(trigger)
    })

    await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
})

test('Renders check email modal on email mode', async () => {
    // Store the original useForm function
    const originalUseForm = ReactHookForm.useForm

    // Spy on useForm
    const mockUseForm = jest.spyOn(ReactHookForm, 'useForm').mockImplementation((...args) => {
        // Call the original useForm
        const methods = originalUseForm(...args)

        // Override only formState
        return {
            ...methods,
            formState: {
                ...methods.formState,
                isSubmitSuccessful: true // Set to true to render the Check Your Email modal
            }
        }
    })

    const {user} = renderWithProviders(<MockedComponent initialView="email" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)

    await act(async () => {
        await user.click(trigger)
    })
    await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
    mockUseForm.mockRestore()
})

describe('Passwordless enabled', () => {
    test('Renders passwordless login when enabled', async () => {
        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })

        await waitFor(() => {
            expect(screen.getByText(/continue securely/i)).toBeInTheDocument()
        })
    })

    test('Allows passwordless login', async () => {
        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
        const validEmail = 'test@salesforce.com'

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })

        await waitFor(() => {
            expect(screen.getByText(/continue securely/i)).toBeInTheDocument()
        })

        // enter a valid email address
        await act(async () => {
            await user.type(screen.getByLabelText('Email'), validEmail)
        })

        // initiate passwordless login
        const passwordlessLoginButton = screen.getByText(/continue securely/i)
        await act(async () => {
            // Click the button twice as the isPasswordlessLoginClicked state doesn't change after the first click
            await user.click(passwordlessLoginButton)
            await user.click(passwordlessLoginButton)
        })

        expect(
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync
        ).toHaveBeenCalledWith({
            userid: validEmail,
            callbackURI: 'https://webhook.site/27761b71-50c1-4097-a600-21a3b89a546c?redirectUrl=/'
        })

        // check that check email modal is open
        await waitFor(() => {
            const withinForm = within(screen.getByTestId('sf-form-resend-passwordless-email'))
            expect(withinForm.getByText(/Check Your Email/i)).toBeInTheDocument()
            expect(withinForm.getByText(validEmail)).toBeInTheDocument()
        })

        await act(async () => {
            // resend the email
            await user.click(screen.getByText(/Resend Link/i))
        })
        expect(
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync
        ).toHaveBeenCalledWith({
            userid: validEmail,
            callbackURI: 'https://webhook.site/27761b71-50c1-4097-a600-21a3b89a546c?redirectUrl=/'
        })
    })
})

test('Renders error when given incorrect login credentials', async () => {
    // Mock the login function to throw an error for this test
    mockAuthHelperFunctions[AuthHelpers.LoginRegisteredUserB2C].mutateAsync.mockRejectedValueOnce(
        new Error('incorrect credentials')
    )

    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await act(async () => {
        await user.click(trigger)
    })
    await act(async () => {
        // enter credentials and submit
        await user.type(screen.getByLabelText('Email'), 'bad@test.com')
        await user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')
    })

    const signInButton = screen.getByText(/sign in/i)
    await act(async () => {
        await user.click(signInButton)
    })
    // give it some time to show the error in the form
    await waitFor(
        () => {
            // wait for login error alert to appear
            expect(screen.getByText(/Something went wrong. Try again!/i)).toBeInTheDocument()
        }
    )
})

test('Allows customer to create an account', async () => {
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: true
        }
    })

    // open the modal
    const trigger = screen.getByText('Open Modal')
    await act(async () => {
        await user.click(trigger)
    })
    let form
    await waitFor(() => {
        form = screen.queryByTestId('sf-auth-modal-form')
        expect(form).toBeInTheDocument()
    })
    const createAccount = screen.getByText(/create account/i)

    await act(async () => {
        await user.click(createAccount)
    })
    let registerForm
    await waitFor(() => {
        registerForm = screen.getByTestId('sf-auth-modal-form-register')
        expect(registerForm).toBeInTheDocument()
    })

    const withinForm = within(registerForm)
    // fill out form and submit
    await waitFor(() => {
        const firstName = withinForm.getByLabelText(/First Name/i)
        expect(firstName).toBeInTheDocument()
    })

    await act(async () => {
        await user.type(withinForm.getByLabelText('First Name'), 'Tester')
        await user.type(withinForm.getByLabelText('Last Name'), 'Tester')
        await user.type(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
        await user.type(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    })

    // login with credentials
    prependHandlersToServer([
        {
            path: '*/oauth2/token',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => ({
                customer_id: 'customerid_1',
                access_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                refresh_token: 'testrefeshtoken_1',
                usid: 'testusid_1',
                enc_user_id: 'testEncUserId_1',
                id_token: 'testIdToken_1'
            })
        },
        {
            path: '*/oauth2/login',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockedRegisteredCustomer
        },
        {
            path: '*/customers/:customerId',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockedRegisteredCustomer
        }
    ])
    const submitButton = withinForm.getByText(/create account/i)
    await act(async () => {
        await user.click(submitButton)
    })

    await waitFor(() => {
        expect(form).not.toBeInTheDocument()
    })
    // wait for success state to appear
    await waitFor(
        () => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            const myAccount = screen.getAllByText(/My Account/)
            expect(myAccount).toHaveLength(2)
        }
    )
})

test('Allows customer to sign in to their account', async () => {
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: true
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await act(async () => {
        await user.click(trigger)
    })
    await act(async () => {
        // enter credentials and submit
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')
    })

    // login with credentials
    prependHandlersToServer([
        {
            path: '*/oauth2/login',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockRegisteredCustomer
        }
    ])

    await act(async () => {
        await user.click(screen.getByText(/sign in/i))
    })

    // allow time to transition to account page
    await waitFor(
        () => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            const myAccount = screen.getAllByText(/My Account/)
            expect(myAccount).toHaveLength(2)
        }
    )
})

describe('Reset password', function () {
    beforeEach(() => {
        // Reset the mock before each test
        mockGetPasswordResetToken.mockClear()
        mockGetPasswordResetToken.mockResolvedValue()
    })

    test('Allows customer to generate password token', async () => {
        // render our test component
        const {user} = renderWithProviders(<MockedComponent initialView="password" />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
        expect(authModal.isOpen).toBe(true)

        let resetPwForm = await screen.findByTestId('sf-auth-modal-form')
        expect(resetPwForm).toBeInTheDocument()
        const withinForm = within(resetPwForm)

        await act(async () => {
            await user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
            await user.click(withinForm.getByText(/reset password/i))
        })

        // wait for success state
        await waitFor(
            () => {
                expect(mockGetPasswordResetToken).toHaveBeenCalledWith('foo@test.com')
                expect(screen.getByText(/password reset/i)).toBeInTheDocument()
                expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
            }
        )
    })

    test('Allows customer to open generate password token modal from everywhere', async () => {
        // render our test component
        const {user} = renderWithProviders(<MockedComponent initialView="password" />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
        expect(authModal.isOpen).toBe(true)

        const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

        expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()

        // close the modal
        const switchToSignIn = screen.getByText(/Sign in/i)
        await act(async () => {
            await user.click(switchToSignIn)
        })

        // check that the modal is closed
        expect(authModal.isOpen).toBe(false)
    })
})
