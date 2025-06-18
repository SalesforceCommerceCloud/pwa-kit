/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import Registration from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '../account'
import mockConfig from '../../../config/mocks/default'
import {rest} from 'msw'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'

jest.setTimeout(60000)

jest.mock('../../commerce-api/einstein')

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'darek@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'darek@test.com'
}

const mockAuthHelperFunctions = {
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

jest.mock('../../commerce-api/hooks/useCustomer', () => {
    const originalModule = jest.requireActual('../../commerce-api/hooks/useCustomer')
    return {
        __esModule: true,
        default: () => ({
            ...originalModule.default(),
            isRegistered: false,
            getSkeletonCustomer: () => mockRegisteredCustomer,
            login: jest.fn().mockResolvedValue(mockRegisteredCustomer)
        })
    }
})

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

// Set up and clean up
beforeEach(() => {
    jest.useFakeTimers()
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockRegisteredCustomer))
        })
    )
})
afterEach(() => {
    localStorage.clear()
    jest.resetModules()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
})

test.skip('Allows customer to create an account', async () => {
    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    screen.debug()
    // fill out form and submit
    await user.type(screen.getByLabelText('First Name'), 'Tester')
    await user.type(screen.getByLabelText('Last Name'), 'Tester')
    await user.type(screen.getByPlaceholderText(/you@email.com/i), 'customer@test.com')
    await user.type(screen.getAllByLabelText(/password/i)[0], 'Password!1')
    await user.click(screen.getByText(/create account/i))

    expect(await screen.findByText(/My Account/i)).toBeInTheDocument()
})
