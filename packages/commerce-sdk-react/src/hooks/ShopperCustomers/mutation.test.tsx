/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders, queryClient} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {useShopperCustomersMutation, ShopperCustomersMutations} from './mutation'
import nock from 'nock'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const CUSTOMER_EMAIL = 'kobe@test.com'
const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const RANDOM_STR = Math.random()
    .toString(36)
    .slice(2, 7)

const CustomerMutationComponent = () => {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const updateCustomer = useShopperCustomersMutation(ShopperCustomersMutations.UpdateCustomer)

    React.useEffect(() => {
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            <div>
                <button
                    onClick={() =>
                        updateCustomer.mutate({
                            parameters: {customerId: CUSTOMER_ID},
                            body: {firstName: `Kobe${RANDOM_STR}`}
                        })
                    }
                >
                    Update Customer
                </button>

                {updateCustomer.error?.message && (
                    <p style={{color: 'red'}}>Error: {updateCustomer.error?.message}</p>
                )}
                <hr />
                <div>{JSON.stringify(updateCustomer)}</div>
            </div>
        </>
    )
}

const tests = [
    {
        hook: 'updateCustomer',
        cases: [
            {
                name: 'success',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerMutationComponent />)
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /update customer/i
                        })
                    )

                    // CACHE Pre-populate cache with the query keys we invalidate on success
                    queryClient.setQueryData(
                        ['/customers', CUSTOMER_ID, '/payment-instruments'],
                        {}
                    )
                    queryClient.setQueryData(['/customers', CUSTOMER_ID, '/addresses'], {})
                    queryClient.setQueryData(['/customers', '/external-profile'], {})

                    expect(
                        queryClient.getQueryState([
                            '/customers',
                            CUSTOMER_ID,
                            '/payment-instruments'
                        ])?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', CUSTOMER_ID, '/addresses'])
                            ?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', '/external-profile'])
                            ?.isInvalidated
                    ).toBeFalsy()

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .patch((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, {
                            customerId: CUSTOMER_ID,
                            email: CUSTOMER_EMAIL,
                            login: CUSTOMER_EMAIL
                        })

                    const button = screen.getByRole('button', {
                        name: /update customer/i
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/email/i))
                    expect(screen.getByText(/email/i)).toBeInTheDocument()

                    // TODO: Remove DEBUG console.log printing queries in cache
                    // console.log('queryClient.getQueryCache():',queryClient.getQueryCache())

                    // CACHE assert updated query keys
                    expect(
                        queryClient.getQueryState([
                            '/customers',
                            CUSTOMER_ID,
                            {customerId: CUSTOMER_ID}
                        ])?.isInvalidated
                    ).toBeFalsy()

                    // CACHE assert invalidated query keys
                    expect(
                        queryClient.getQueryState([
                            '/customers',
                            CUSTOMER_ID,
                            '/payment-instruments'
                        ])?.isInvalidated
                    ).toBeTruthy()
                    expect(
                        queryClient.getQueryState(['/customers', CUSTOMER_ID, '/addresses'])
                            ?.isInvalidated
                    ).toBeTruthy()
                    expect(
                        queryClient.getQueryState(['/customers', '/external-profile'])
                            ?.isInvalidated
                    ).toBeTruthy()
                })
            },
            {
                name: 'error',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerMutationComponent />)
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: /update customer/i
                        })
                    )

                    // CACHE Pre-populate cache with the query keys we invalidate on success
                    queryClient.setQueryData(
                        ['/customers', CUSTOMER_ID, '/payment-instruments'],
                        {}
                    )
                    queryClient.setQueryData(['/customers', CUSTOMER_ID, '/addresses'], {})
                    queryClient.setQueryData(['/customers', '/external-profile'], {})

                    expect(
                        queryClient.getQueryState([
                            '/customers',
                            CUSTOMER_ID,
                            '/payment-instruments'
                        ])?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', CUSTOMER_ID, '/addresses'])
                            ?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', '/external-profile'])
                            ?.isInvalidated
                    ).toBeFalsy()

                    // Mocking the server request
                    nock('http://localhost:3000')
                        .patch((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(500)

                    const button = screen.getByRole('button', {
                        name: /update customer/i
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/error/i))
                    expect(screen.getByText(/error/i)).toBeInTheDocument()

                    // CACHE assert invalidated query keys
                    expect(
                        queryClient.getQueryState([
                            '/customers',
                            CUSTOMER_ID,
                            '/payment-instruments'
                        ])?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', CUSTOMER_ID, '/addresses'])
                            ?.isInvalidated
                    ).toBeFalsy()
                    expect(
                        queryClient.getQueryState(['/customers', '/external-profile'])
                            ?.isInvalidated
                    ).toBeFalsy()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
            queryClient.clear()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
