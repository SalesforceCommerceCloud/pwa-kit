/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, within, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    renderWithProviders,
    createPathWithDefaults,
    guestToken,
    registerUserToken,
    clearAllCookies
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    AuthModal,
    useAuthModal,
    EMAIL_VIEW
} from '@salesforce/retail-react-app/app/hooks/use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '@salesforce/retail-react-app/app/pages/account'
import {rest} from 'msw'
import {mockedRegisteredCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'
import * as ReactHookForm from 'react-hook-form'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.setTimeout(60000)

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
    // Set default config mock (passkey enabled by default in mockConfig)
    getConfig.mockReturnValue(mockConfig)
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.post('*/customers/password/actions/create-reset-token', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPasswordToken))
        }),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid',
                    access_token: guestToken,
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        ),
        rest.post('*/baskets/actions/merge', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockMergedBasket))
        })
    )
})
afterEach(() => {
    localStorage.clear()
    clearAllCookies()
    jest.resetModules()
    jest.restoreAllMocks()
})

test('Renders login modal by default', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
})

// TODO: Skipping this test because our jest version seems to too old and is run into issues with react-hooks-form
// when trying to run jest.spyOn on useForm hook. Need to bump version for jest.
test.skip('Renders check email modal on email mode', async () => {
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
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent initialView="email" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
    mockUseForm.mockRestore()
})

test('allows regular login via Enter key in password mode', async () => {
    const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
    const validEmail = 'test@salesforce.com'
    const validPassword = 'Password123!'

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    await waitFor(() => {
        expect(screen.getByText(/Continue/i)).toBeInTheDocument()
    })

    // enter email and switch to password mode
    await user.type(screen.getByLabelText('Email'), validEmail)
    await user.click(screen.getByText(/password/i))

    // enter password
    await user.type(screen.getByLabelText('Password'), validPassword)

    // simulate Enter key press in password field
    await user.keyboard('{Enter}')

    // login successfully and close the modal
    await waitFor(() => {
        expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument()
    })
})

describe('Passwordless enabled', () => {
    beforeEach(() => {
        global.server.use(
            rest.post('*/oauth2/passwordless/login', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json({}))
            }),
            rest.post('*/oauth2/passwordless/token', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        customer_id: 'registeredCustomerId',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken',
                        usid: 'testusid',
                        enc_user_id: 'testEncUserId',
                        id_token: 'testIdToken'
                    })
                )
            })
        )
    })

    test('Renders passwordless login when enabled', async () => {
        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/Continue/i)).toBeInTheDocument()
        })
    })

    test('Allows passwordless login', async () => {
        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />, {
            wrapperProps: {
                bypassAuth: false
            }
        })
        // Disable passkey to test passwordless in isolation
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    ...mockConfig.app.login,
                    passkey: {enabled: false}
                }
            }
        })
        const validEmail = 'test@salesforce.com'

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/Continue/i)).toBeInTheDocument()
        })

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // initiate passwordless login
        const passwordlessLoginButton = screen.getByText(/Continue/i)
        await user.click(passwordlessLoginButton)

        // check that the auth modal is closed
        expect(authModal.isOpen).toBe(false)

        // check that OTP auth modal is open
        await waitFor(() => {
            expect(
                screen.getByText(/To log in to your account, enter the code/i)
            ).toBeInTheDocument()
        })

        // resend the email
        await user.click(screen.getByText(/Resend Code/i))

        // enter the code manually
        const code = '12345678'
        const otpInputs = screen.getAllByRole('textbox')
        for (let i = 0; i < 8; i++) {
            await user.type(otpInputs[i], code[i])
        }

        await waitFor(() => {
            expect(
                screen.queryByText(/To log in to your account, enter the code/i)
            ).not.toBeInTheDocument()
        })

        await waitFor(() => {
            expect(screen.getByText(/You're now signed in./i)).toBeInTheDocument()
        })
    })

    test('allows passwordless login via Enter key', async () => {
        jest.spyOn(window, 'location', 'get').mockReturnValue({
            pathname: '/',
            origin: 'https://example.com'
        })
        // Disable passkey to test passwordless in isolation
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    ...mockConfig.app.login,
                    passkey: {enabled: false}
                }
            }
        })
        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
        const validEmail = 'test@salesforce.com'

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/Continue/i)).toBeInTheDocument()
        })

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // simulate Enter key press in email field
        await user.keyboard('{Enter}')

        // check that the auth modal is closed
        expect(authModal.isOpen).toBe(false)

        // check that the OtpAuthModal is open
        await waitFor(() => {
            expect(
                screen.getByText(/To log in to your account, enter the code/i)
            ).toBeInTheDocument()
        })
    })

    test('sends callbackURI when passwordless callback is configured', async () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    passwordless: {
                        mode: 'callback',
                        callbackURI: 'https://callback.com/passwordless'
                    }
                }
            }
        })

        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
        const validEmail = 'test@salesforce.com'

        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/Continue/i)).toBeInTheDocument()
        })

        await user.type(screen.getByLabelText('Email'), validEmail)
        await user.click(screen.getByText(/Continue/i))

        // check that the auth modal is closed
        expect(authModal.isOpen).toBe(false)

        // check that the OtpAuthModal is open
        await waitFor(() => {
            expect(
                screen.getByText(/To log in to your account, enter the code/i)
            ).toBeInTheDocument()
        })
    })

    test('shows check your email view when initial view is set to email', async () => {
        const {user} = renderWithProviders(
            <MockedComponent isPasswordlessEnabled={true} initialView={EMAIL_VIEW} />
        )

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument()
        })

        await user.click(screen.getByText(/Resend Link/i))

        // check that the Check Your Email view is still open
        await waitFor(() => {
            expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument()
        })
    })

    test.each([
        ['no callback_uri is registered for client', 'This feature is not currently available.'],
        [
            'Too many login requests were made. Please try again later.',
            'You reached the limit for login attempts. For your security, wait 10 minutes and try again.'
        ],
        ['unexpected error message', 'Something went wrong. Try again!']
    ])(
        'displays correct error message when passwordless login fails with "%s"',
        async (apiErrorMessage, expectedMessage) => {
            global.server.use(
                rest.post('*/oauth2/passwordless/login', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(400), ctx.json({message: apiErrorMessage}))
                })
            )

            const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
            const validEmail = 'test@salesforce.com'

            // open the modal
            const trigger = screen.getByText(/open modal/i)
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText(/Continue/i)).toBeInTheDocument()
            })

            // enter email and submit
            await user.type(screen.getByLabelText('Email'), validEmail)
            await user.click(screen.getByText(/Continue/i))

            // Verify error message is displayed
            await waitFor(() => {
                expect(screen.getByText(expectedMessage)).toBeInTheDocument()
            })
        }
    )
})

// TODO: Fix flaky/broken test
// eslint-disable-next-line jest/no-disabled-tests
test.skip('Renders error when given incorrect log in credentials', async () => {
    const user = userEvent.setup()

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // enter credentials and submit
    await user.type(screen.getByLabelText('Email'), 'bad@test.com')
    await user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')

    // mock failed auth request
    global.server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Unauthorized Credentials.'}))
        ),
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(404), ctx.json({message: 'Not Found.'}))
        })
    )

    await user.click(screen.getByText(/sign in/i))
    // give it some time to show the error in the form
    await waitFor(
        () => {
            // wait for login error alert to appear
            expect(
                screen.getByText(/something's not right with your email or password\. try again\./i)
            ).toBeInTheDocument()
        },
        {
            timeout: 10000
        }
    )
})

test('Allows customer to create an account', async () => {
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: true
        }
    })

    // open the modal
    const trigger = screen.getByText('Open Modal')

    await user.click(trigger)
    let form
    await waitFor(() => {
        form = screen.queryByTestId('sf-auth-modal-form')
        expect(form).toBeInTheDocument()
    })
    const createAccount = screen.getByText(/create account/i)
    await user.click(createAccount)
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

    await user.type(withinForm.getByLabelText('First Name'), 'Tester')
    await user.type(withinForm.getByLabelText('Last Name'), 'Tester')
    await user.type(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    await user.type(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')

    // login with credentials
    global.server.use(
        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid_1',
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                    refresh_token: 'testrefeshtoken_1',
                    usid: 'testusid_1',
                    enc_user_id: 'testEncUserId_1',
                    id_token: 'testIdToken_1'
                })
            )
        }),
        rest.post('*/oauth2/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
    const submitButton = withinForm.getByText(/create account/i)
    await user.click(submitButton)

    await waitFor(() => {
        expect(form).not.toBeInTheDocument()
    })
    // wait for success state to appear
    await waitFor(
        () => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            const myAccount = screen.getAllByText(/My Account/)
            expect(myAccount).toHaveLength(3) // h1 (sr-only), h2 (accordion), h2 (sidebar)
        },
        {
            timeout: 5000
        }
    )
})

// TODO: investigate why this test is failing when running with other tests
// eslint-disable-next-line jest/no-disabled-tests
test.skip('Allows customer to sign in to their account', async () => {
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // enter credentials and submit
    await user.type(screen.getByLabelText('Email'), 'customer@test.com')
    await user.type(screen.getByLabelText('Password'), 'Password!1')

    // login with credentials
    global.server.use(
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'customerid_1',
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                    refresh_token: 'testrefeshtoken_1',
                    usid: 'testusid_1',
                    enc_user_id: 'testEncUserId_1',
                    id_token: 'testIdToken_1'
                })
            )
        )
    )
    await user.click(screen.getByText(/sign in/i))

    // allow time to transition to account page
    await waitFor(
        () => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        },
        {timeout: 5000}
    )
})

describe('Passkey login', () => {
    let mockCredentialsGet
    let mockPublicKeyCredential

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks()

        // Override getConfig to return config with passkey enabled
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    ...mockConfig.app.login,
                    passkey: {enabled: true}
                }
            }
        })

        // Mock WebAuthn API - default to never resolving (simulating no user action)
        mockCredentialsGet = jest.fn().mockImplementation(() => new Promise(() => {}))
        mockPublicKeyCredential = {
            parseRequestOptionsFromJSON: jest.fn(),
            isConditionalMediationAvailable: jest.fn().mockResolvedValue(true),
            isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true)
        }

        global.PublicKeyCredential = mockPublicKeyCredential
        global.window.PublicKeyCredential = mockPublicKeyCredential
        global.navigator.credentials = {
            get: mockCredentialsGet
        }

        // Mock parseRequestOptionsFromJSON to return mock options
        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue({
            challenge: 'mock-challenge',
            allowCredentials: []
        })

        // Setup MSW handlers for WebAuthn API endpoints
        global.server.use(
            rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        publicKey: {
                            challenge: 'mock-challenge-data',
                            rpId: 'example.com',
                            allowCredentials: [],
                            timeout: 60000
                        }
                    })
                )
            }),
            rest.post('*/oauth2/webauthn/authenticate/finish', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        tokenResponse: {
                            customer_id: 'customerid_passkey',
                            access_token: registerUserToken,
                            refresh_token: 'testrefeshtoken_passkey',
                            usid: 'testusid_passkey',
                            enc_user_id: 'testEncUserId_passkey',
                            id_token: 'testIdToken_passkey'
                        }
                    })
                )
            })
        )
    })

    afterEach(() => {
        delete global.PublicKeyCredential
        delete global.window.PublicKeyCredential
    })

    test('Triggers passkey login when modal opens with passkey enabled', async () => {
        // Mock credential that will be returned from navigator.credentials.get
        const mockCredential = {
            id: 'mock-credential-id',
            rawId: new ArrayBuffer(32),
            type: 'public-key',
            response: {
                authenticatorData: new ArrayBuffer(37),
                clientDataJSON: new ArrayBuffer(128),
                signature: new ArrayBuffer(64),
                userHandle: new ArrayBuffer(16)
            },
            getClientExtensionResults: jest.fn().mockReturnValue({}),
            toJSON: jest.fn().mockReturnValue({
                id: 'mock-credential-id',
                rawId: 'mock-raw-id',
                type: 'public-key',
                response: {
                    authenticatorData: 'mock-auth-data',
                    clientDataJSON: 'mock-client-data',
                    signature: 'mock-signature',
                    userHandle: 'mock-user-handle'
                }
            })
        }

        mockCredentialsGet.mockResolvedValue(mockCredential)

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Wait for passkey flow to be triggered
        await waitFor(
            () => {
                expect(mockCredentialsGet).toHaveBeenCalledWith(
                    expect.objectContaining({
                        mediation: 'conditional'
                    })
                )
            },
            {timeout: 2000}
        )
    })

    test('User can login with other method when passkey login is cancelled', async () => {
        // Simulate user cancelling passkey selection (NotAllowedError)
        const notAllowedError = new Error('User cancelled')
        notAllowedError.name = 'NotAllowedError'
        mockCredentialsGet.mockRejectedValue(notAllowedError)

        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Login form should be shown
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalled()
            expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByText(/continue/i)).toBeInTheDocument()
            expect(screen.getByText(/password/i)).toBeInTheDocument()
        })
    })

    test('Shows error when passkey authentication fails with error from the browser', async () => {
        // Simulate error in loginWithPasskey hook
        mockCredentialsGet.mockRejectedValue(new Error('Authentication failed'))

        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Should show error - passkey error should be caught and handled
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalled()
            expect(screen.getByText(/Something went wrong. Try again!/i)).toBeInTheDocument()
        })
    })

    test('Shows error when passkey authentication fails with error from the WebAuthn API', async () => {
        global.server.use(
            rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(401),
                    ctx.json({message: 'Authentication failed'})
                )
            })
        )

        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Should show error - 401 error from WebAuthn API should be caught and converted to user-friendly message
        await waitFor(() => {
            expect(screen.getByText(/Something went wrong. Try again!/i)).toBeInTheDocument()
        })
    })

    test('Passkey prompt is aborted when modal is closed', async () => {
        // Capture the abort signal passed to credentials.get
        let capturedSignal = null

        // Mock credentials.get to capture the abort signal and stay pending
        mockCredentialsGet.mockImplementation(({signal}) => {
            capturedSignal = signal
            return new Promise(() => {
                // Never resolve - simulates passkey prompt staying open
            })
        })

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Wait for passkey conditional mediation to start and capture the signal
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalledWith(
                expect.objectContaining({
                    mediation: 'conditional',
                    signal: expect.any(AbortSignal)
                })
            )
            expect(capturedSignal).not.toBeNull()
        })

        // Verify signal is not yet aborted
        expect(capturedSignal.aborted).toBe(false)

        // Close the modal by clicking the close button
        const closeButton = screen.getByLabelText(/close login form/i)
        await user.click(closeButton)

        // Verify the signal was aborted when modal closed
        expect(capturedSignal.aborted).toBe(true)
    })

    test('Passkey prompt is aborted when user logs in', async () => {
        // This test verifies that when the user logs in while the passkey
        // prompt is pending, the modal closes (login succeeds) and the passkey flow is
        // aborted via the cleanup that runs when the modal closes.
        let capturedSignal = null

        mockCredentialsGet.mockImplementation(({signal}) => {
            expect(signal).toBeInstanceOf(AbortSignal)
            capturedSignal = signal
            return new Promise(() => {
                // Never resolve - simulates passkey prompt staying open
            })
        })

        // Successful email/password login
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            ),
            rest.post('*/baskets/actions/merge', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockMergedBasket))
            })
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal - passkey flow starts and stays pending
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalledWith(
                expect.objectContaining({
                    mediation: 'conditional',
                    signal: expect.any(AbortSignal)
                })
            )
            expect(capturedSignal).not.toBeNull()
        })

        // User logs in with password while passkey prompt is still open
        await user.type(screen.getByLabelText(/email/i), 'customer@test.com')
        await user.type(screen.getByLabelText(/^password$/i), 'Password!1')
        await user.click(screen.getByRole('button', {name: /sign in/i}))

        // Wait for login to succeed and modal to close (cleanup runs and aborts passkey)
        await waitFor(
            () => {
                expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
                expect(capturedSignal.aborted).toBe(true)
            },
            {timeout: 3000}
        )
    })

    test('Does not trigger passkey when not enabled', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passkey: {enabled: false}
            }
        }

        // Override getConfig to return config with passkey disabled
        getConfig.mockReturnValue({
            ...mockConfig,
            app: mockAppConfig
        })

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
        })

        // Should not have called WebAuthn APIs
        expect(mockCredentialsGet).not.toHaveBeenCalled()
    })

    test('Successfully logs in with passkey', async () => {
        const mockCredential = {
            id: 'mock-credential-id',
            rawId: new ArrayBuffer(32),
            type: 'public-key',
            response: {
                authenticatorData: new ArrayBuffer(37),
                clientDataJSON: new ArrayBuffer(128),
                signature: new ArrayBuffer(64),
                userHandle: new ArrayBuffer(16)
            },
            getClientExtensionResults: jest.fn().mockReturnValue({}),
            toJSON: jest.fn().mockReturnValue({
                id: 'mock-credential-id',
                rawId: 'mock-raw-id',
                type: 'public-key',
                response: {
                    authenticatorData: 'mock-auth-data',
                    clientDataJSON: 'mock-client-data',
                    signature: 'mock-signature',
                    userHandle: 'mock-user-handle'
                }
            })
        }

        mockCredentialsGet.mockResolvedValue(mockCredential)

        // Mock customer as registered after passkey login
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            )
        )

        const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // Open the modal - this should trigger passkey login automatically
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)

        // Wait for passkey flow to be triggered when modal opens
        await waitFor(
            () => {
                expect(mockCredentialsGet).toHaveBeenCalled()
            },
            {timeout: 5000}
        )

        // login successfully and close the modal
        await waitFor(() => {
            expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument()
        })
    })

    describe('Passkey Registration', () => {
        beforeEach(() => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {enabled: true}
                    }
                }
            })

            // Mock WebAuthn API
            global.PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
                isConditionalMediationAvailable: jest.fn().mockResolvedValue(true)
            }
            global.window.PublicKeyCredential = global.PublicKeyCredential

            global.server.use(
                rest.post('*/oauth2/token', (req, res, ctx) =>
                    res(
                        ctx.delay(0),
                        ctx.json({
                            customer_id: 'registeredCustomerId',
                            access_token: registerUserToken,
                            refresh_token: 'testrefeshtoken',
                            usid: 'testusid',
                            enc_user_id: 'testEncUserId',
                            id_token: 'testIdToken'
                        })
                    )
                )
            )
        })

        afterEach(() => {
            delete global.PublicKeyCredential
            delete global.window.PublicKeyCredential
        })

        test('shows passkey registration toast after login', async () => {
            const {user} = renderWithProviders(<MockedComponent isPasswordlessEnabled={true} />)
            const validEmail = 'test@salesforce.com'
            const validPassword = 'Password123!'

            const trigger = screen.getByText(/open modal/i)
            await user.click(trigger)

            await waitFor(() => {
                expect(screen.getByText(/Continue/i)).toBeInTheDocument()
            })

            await user.type(screen.getByLabelText('Email'), validEmail)
            await user.click(screen.getByText(/password/i))
            await user.type(screen.getByLabelText('Password'), validPassword)
            await user.keyboard('{Enter}')

            // Create passkey toast is shown after login
            await waitFor(() => {
                // 2 matches are found for the toast
                const toasts = screen.getAllByText(/Create Passkey/i)
                expect(toasts.length).toBeGreaterThanOrEqual(1)
            })
        })
    })
})

describe('Reset password', function () {
    beforeEach(() => {
        global.server.use(
            rest.post('*/customers/password/actions/create-reset-token', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(200), ctx.json(mockPasswordToken))
            ),
            rest.post('*/oauth2/password/reset', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json({}))
            })
        )
    })

    // TODO: Fix flaky/broken test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Allows customer to generate password token', async () => {
        // render our test component
        const {user} = renderWithProviders(<MockedComponent initialView="password" />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)
        expect(authModal.isOpen).toBe(true)

        // enter credentials and submit
        // const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

        let resetPwForm = await screen.findByTestId('sf-auth-modal-form-reset-pw')
        expect(resetPwForm).toBeInTheDocument()
        const withinForm = within(resetPwForm)
        await user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
        await user.click(withinForm.getByText(/reset password/i))

        // wait for success state
        await waitFor(() => {
            expect(screen.getByText(/password reset/i)).toBeInTheDocument()
            expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
        })
    })

    // TODO: Fix flaky/broken test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Allows customer to open generate password token modal from everywhere', async () => {
        // render our test component
        const {user} = renderWithProviders(<MockedComponent initialView="password" />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        await user.click(trigger)
        expect(authModal.isOpen).toBe(true)

        const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

        expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()

        // close the modal
        const switchToSignIn = screen.getByText(/Sign in/i)
        await user.click(switchToSignIn)

        // check that the modal is closed
        expect(authModal.isOpen).toBe(false)
    })

    test.each([
        ['no callback_uri is registered for client', 'This feature is not currently available.'],
        [
            'Too many password reset requests were made. Please try again later.',
            'You reached the limit for password resets. For your security, wait 10 minutes and try again.'
        ],
        ['unexpected error message', 'Something went wrong. Try again!']
    ])(
        'displays correct error message when password reset fails with "%s"',
        async (apiErrorMessage, expectedMessage) => {
            global.server.use(
                rest.post('*/oauth2/password/reset', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(400), ctx.json({message: apiErrorMessage}))
                })
            )

            const {user} = renderWithProviders(<MockedComponent initialView="password" />, {
                wrapperProps: {
                    bypassAuth: false
                }
            })

            // open the modal
            const trigger = screen.getByText(/open modal/i)
            await user.click(trigger)

            // Wait for password reset form
            let resetPwForm = await screen.findByTestId('sf-auth-modal-form')
            expect(resetPwForm).toBeInTheDocument()
            const withinForm = within(resetPwForm)

            // Enter email and submit
            await user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
            await user.click(withinForm.getByText(/reset password/i))

            // Verify error message is displayed
            await waitFor(() => {
                expect(withinForm.getByText(expectedMessage)).toBeInTheDocument()
            })
        }
    )
})
