/*
 * Copyright (c) 2021, salesforce.com, inc.
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
import {AuthHelpers} from '@salesforce/commerce-sdk-react'
import useCustomer from '../commerce-api/hooks/useCustomer'
jest.mock('../commerce-api/einstein')

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

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}
const mockAuthHelperFunctions = {
    [AuthHelpers.Register]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()}
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

const mockLogin = jest.fn()

jest.mock('../commerce-api/hooks/useCustomer', () => {
    const originalModule = jest.requireActual('../commerce-api/hooks/useCustomer')
    return {
        __esModule: true,
        default: () => ({
            ...originalModule.default(),
            isRegistered: false,
            getSkeletonCustomer: () => mockRegisteredCustomer,
            registerCustomer: jest.fn()
        })
    }
})

let authModal = undefined
const MockedComponent = (props) => {
    const customer = useCustomer()
    const {initialView} = props
    authModal = initialView ? useAuthModal(initialView) : useAuthModal()
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <p>Auth Type: {customer.authType}</p>
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

    // Wait for modal to appear
    await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
})

test('Allows customer to sign in to their account', async () => {
    jest.setTimeout(10000)

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    jest.mock('../commerce-api/hooks/useCustomer', () => {
        const originalModule = jest.requireActual('../commerce-api/hooks/useCustomer')
        return {
            __esModule: true,
            default: () => ({
                ...originalModule.default(),
                auth: {
                    get: jest.fn((key) => {
                        if (key === 'customer_id') return 'registeredCustomerId'
                        if (key === 'customer_type') return 'registered'
                        return null
                    })
                }
            })
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

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
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        })
    )

    await waitFor(
        () => {
            expect(screen.getByText(/Auth Type:/i)).toBeInTheDocument()
        },
        {timeout: 5000}
    )

    // enter credentials and submit
    await user.type(screen.getByLabelText('Email'), 'customer@test.com')
    await user.type(screen.getByLabelText('Password'), 'Password!1')

    await user.click(screen.getByText(/sign in/i))
    // wait for successful toast to appear
    await waitFor(
        () => {
            expect(screen.getByText(/Auth Type: registered/i)).toBeInTheDocument()
        },
        {timeout: 5000}
    )
})

test('Renders error when given incorrect log in credentials', async () => {
    jest.setTimeout(10000)

    mockAuthHelperFunctions[AuthHelpers.LoginRegisteredUserB2C].mutateAsync.mockRejectedValueOnce(
        new Error('Invalid credentials')
    )

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {
            bypassAuth: false
        }
    })

    jest.mock('../commerce-api/hooks/useCustomer', () => {
        const originalModule = jest.requireActual('../commerce-api/hooks/useCustomer')
        return {
            __esModule: true,
            default: () => ({
                ...originalModule.default(),
                auth: {
                    get: jest.fn((key) => {
                        if (key === 'customer_id') return 'guestCustomerId'
                        if (key === 'customer_type') return 'guest'
                        return null
                    })
                }
            })
        }
    })

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // login with credentials
    global.server.use(
        rest.post('*/oauth2/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Invalid credentials'}))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(404), ctx.json({}))
        })
    )

    await waitFor(
        () => {
            expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
        },
        {timeout: 5000}
    )

    // enter credentials and submit
    await user.type(screen.getByLabelText('Email'), 'customer@test.com')
    await user.type(screen.getByLabelText('Password'), 'Password!1')

    await user.click(screen.getByText(/sign in/i))
    await waitFor(
        () => {
            expect(
                screen.getByText(/Something's not right with your email or password. Try again./i)
            ).toBeInTheDocument()
        },
        {timeout: 5000}
    )
})

test('Allows customer to generate password token', async () => {
    // render our test component
    renderWithProviders(<MockedComponent initialView="password" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)
    await waitFor(() => {
        expect(authModal.isOpen).toBe(true)
    })

    // enter credentials and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    user.type(withinForm.getByLabelText('Email'), 'foo@test.com')
    user.click(withinForm.getByText(/reset password/i))

    await waitFor(() => {
        expect(screen.getByText(/password reset/i)).toBeInTheDocument()
        expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
    })
})

test('Allows customer to open generate password token modal from everywhere', async () => {
    // render our test component
    renderWithProviders(<MockedComponent initialView="password" />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)
    await waitFor(() => {
        expect(authModal.isOpen).toBe(true)
    })

    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

    expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()

    // close the modal
    const switchToSignIn = screen.getByText(/Sign in/i)
    await user.click(switchToSignIn)

    // check that the modal is closed
    expect(authModal.isOpen).toBe(false)
})

test('Allows customer to create an account', async () => {
    jest.setTimeout(30000)
    mockLogin.mockImplementationOnce(async () => {
        return {url: '/callback', customerId: 'registeredCustomerId'}
    })
    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText('Open Modal')

    await user.click(trigger)

    // switch to 'create account' view
    await user.click(screen.getByText(/create account/i))

    // fill out form and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))

    await user.type(withinForm.getByLabelText('First Name'), 'Tester')
    await user.type(withinForm.getByLabelText('Last Name'), 'Tester')
    await user.type(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    await user.type(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    await user.click(withinForm.getByText(/create account/i))

    await waitFor(
        () => {
            expect(screen.getAllByText(/My Account/i).length).toEqual(2)
            expect(screen.getAllByText(/Log Out/i).length).toEqual(2)
        },
        {timeout: 20000}
    )
})
