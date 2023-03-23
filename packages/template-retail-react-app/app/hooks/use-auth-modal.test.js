/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {screen, within, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders, createPathWithDefaults} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../pages/account'
import {rest} from 'msw'
import {mockedRegisteredCustomer} from '../commerce-api/mock-data'
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
    const {initialView} = props
    authModal = initialView ? useAuthModal(initialView) : useAuthModal()
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <button onClick={authModal.onOpen}>Open Modal</button>
            <AuthModal {...authModal} />
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}
MockedComponent.propTypes = {
    initialView: PropTypes.string
}

// Set up and clean up
beforeEach(() => {
    authModal = undefined
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
                    access_token:
                        'eyJ2ZXIiOiIxLjAiLCJqa3UiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJraWQiOiJiMjNkZTU5YS1iMTk3LTQyNTAtODdkNy1mNDFmNmUzNjcwNzciLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJIUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLWNvbnRleHQucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjAyY2NhYjMyLWQwMWUtNGFiYy04MDlhLWE0NTdmYTA1MTJjMiIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3OTAxMzcwOCwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YmNrYmhIdzBkR2tYZ1J4YmFWeHFZWXd1aEg6OmNoaWQ6ICIsImV4cCI6MTkyNDkwNTYwMDAwMCwiaWF0IjoxNjc5MDEzNzM4LCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0OTg1MjcwNDEzOTY1MjIyIn0.o9XBf1TiGmNhEkFsVsFKGkDODuk1zK8ovE8GRnVTZWw',
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
    jest.resetModules()
})

test('Renders login modal by default', async () => {
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
})

test('Renders error when given incorrect log in credentials', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'bad@test.com')
    user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')

    // mock failed auth request
    global.server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Unauthorized Credentials.'}))
        ),
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(404), ctx.json({message: 'Not Found.'}))
        })
    )

    user.click(screen.getByText(/sign in/i))
    // give it some time to show the error in the form
    await waitFor(
        () => {
            // wait for login error alert to appear
            expect(
                screen.getByText(/something's not right with your email or password\. try again\./i)
            ).toBeInTheDocument()
        },
        {
            timeout: 2000
        }
    )
})

test('Allows customer to create an account', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: true
        }
    })

    // open the modal
    const trigger = screen.getByText('Open Modal')

    user.click(trigger)
    let form
    await waitFor(() => {
        form = screen.queryByTestId('sf-auth-modal-form')
        expect(form).toBeInTheDocument()
    })
    const createAccount = screen.getByText(/create account/i)
    user.click(createAccount)
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

    user.paste(withinForm.getByLabelText('First Name'), 'Tester')
    user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
    user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')

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
    user.click(submitButton)

    await waitFor(() => {
        expect(form).not.toBeInTheDocument()
    })
    // wait for success state to appear
    await waitFor(
        () => {
            expect(window.location.pathname).toEqual('/uk/en-GB/account')
            const myAccount = screen.getAllByText(/My Account/)
            expect(myAccount.length).toEqual(2)
        },
        {
            timeout: 5000
        }
    )
})

// TODO: investingate why this test is failing when running with other tests
test.skip('Allows customer to sign in to their account', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'customer@test.com')
    user.type(screen.getByLabelText('Password'), 'Password!1')

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
    user.click(screen.getByText(/sign in/i))

    // alow time to transition to account page
    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/account')
        expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
    })
})

describe('Reset password', function () {
    beforeEach(() => {
        global.server.use(
            rest.post('*/customers/password/actions/create-reset-token', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(200), ctx.json(mockPasswordToken))
            )
        )
    })
    test.skip('Allows customer to generate password token', async () => {
        // render our test component
        renderWithProviders(<MockedComponent initialView="password" />, {
            wrapperProps: {
                bypassAuth: false
            }
        })

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)
        expect(authModal.isOpen).toBe(true)

        // enter credentials and submit
        // const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

        let resetPwForm = await screen.findByTestId('sf-auth-modal-form-reset-pw')
        expect(resetPwForm).toBeInTheDocument()
        const withinForm = within(resetPwForm)
        user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
        user.click(withinForm.getByText(/reset password/i))

        // wait for success state
        await waitFor(() => {
            expect(screen.getByText(/password reset/i)).toBeInTheDocument()
            expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
        })
    })

    test.skip('Allows customer to open generate password token modal from everywhere', () => {
        // render our test component
        renderWithProviders(<MockedComponent initialView="password" />)

        // open the modal
        const trigger = screen.getByText(/open modal/i)
        user.click(trigger)
        expect(authModal.isOpen).toBe(true)

        const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

        expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()

        // close the modal
        const switchToSignIn = screen.getByText(/Sign in/i)
        user.click(switchToSignIn)

        // check that the modal is closed
        expect(authModal.isOpen).toBe(false)
    })
})
