/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {guestToken, registerUserToken, renderWithProviders} from '../../utils/test-utils'
import Registration from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../account'
import mockConfig from '../../../config/mocks/default'
import {mockCustomerBaskets, mockedRegisteredCustomer} from '../../mocks/mock-data'
import {createServer} from '../../../jest-setup'

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <Registration />
            <Route path={'/uk/en-GB/account'}>
                <Account match={match} />
            </Route>
        </Router>
    )
}
const handlers = [
    {
        path: '*/oauth2/token',
        method: 'post',
        res: () => {
            return {
                customer_id: 'customerid',
                access_token: guestToken,
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId',
                id_token: 'testIdToken'
            }
        }
    },
    {
        path: '*/customers/:customerId/baskets',
        res: () => {
            return mockCustomerBaskets
        }
    },
    {
        path: '*/customers/:customerId',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/customers',
        res: () => {
            return mockedRegisteredCustomer
        }
    }
]

afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

describe('Registration', function () {
    const {prependHandlersToServer} = createServer(handlers)

    test('allows customer to create an account', async () => {
        // render our test component
        await renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        const form = await screen.findByTestId('sf-auth-modal-form-register')
        expect(form).toBeInTheDocument()

        // fill out form and submit
        const withinForm = within(form)

        user.paste(withinForm.getByLabelText('First Name'), 'Tester')
        user.paste(withinForm.getByLabelText('Last Name'), 'Tester')
        user.paste(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
        user.paste(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')

        // login with credentials
        prependHandlersToServer([
            {
                path: '*/oauth2/token',
                method: 'post',
                res: () => {
                    return {
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    }
                }
            },
            {
                path: '*/customers',
                method: 'post',
                res: () => {
                    return {
                        authType: 'registered',
                        creationDate: '2020-02-13T17:44:15.892Z',
                        customerId: 'customerid_1',
                        customerNo: '00006002',
                        email: 'customer@test.com',
                        enabled: true,
                        firstName: 'Tester',
                        lastModified: '2020-02-13T17:44:15.898Z',
                        lastName: 'Tester',
                        login: 'tester'
                    }
                }
            }
        ])

        user.click(withinForm.getByText(/create account/i))
        // wait for success state to appear
        const myAccount = await screen.findAllByText(/My Account/)
        await waitFor(() => {
            expect(myAccount.length).toEqual(2)
        })
    })
})
