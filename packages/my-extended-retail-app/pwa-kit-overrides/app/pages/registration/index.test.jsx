/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within, waitFor} from '@testing-library/react'
import {
    guestToken,
    registerUserToken,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Registration from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '@salesforce/retail-react-app/app/pages/account'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {rest} from 'msw'
import {mockedRegisteredCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'

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
const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
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
    jest.resetModules()
    localStorage.clear()
})

test('Allows customer to create an account', async () => {
    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
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

    await user.type(withinForm.getByLabelText('First Name'), 'Tester')
    await user.type(withinForm.getByLabelText('Last Name'), 'Tester')
    await user.type(withinForm.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    await user.type(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    screen.logTestingPlaygroundURL()

    // login with credentials
    global.server.use(
        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
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
        }),
        rest.post('*/oauth2/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )

    await user.click(withinForm.getByText(/create account/i))

    // wait for success state to appear
    const myAccount = await screen.findAllByText(/My Account/)

    await waitFor(
        () => {
            expect(myAccount).toHaveLength(2)
        },
        {
            timeout: 5000
        }
    )
})
