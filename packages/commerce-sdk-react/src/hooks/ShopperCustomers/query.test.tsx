/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect} from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders, withRegisteredUser} from '../../test-utils'
import {useCustomer} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const CUSTOMER_EMAIL = 'kobe@test.com'
const CustomerComponent = ({
    customerId,
    loginRegisteredUser
}: {
    customerId: string
    loginRegisteredUser: any
}): ReactElement => {
    const {data, isLoading, error} = useCustomer(
        {customerId},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <div>{data?.email}</div>}
            {error && <span>error</span>}
        </div>
    )
}

const tests = [
    {
        hook: 'useCustomer',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const Component = withRegisteredUser(CustomerComponent)
                    renderWithProviders(<Component customerId={CUSTOMER_ID} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(CUSTOMER_EMAIL))
                    expect(screen.getByText(CUSTOMER_EMAIL)).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    const Component = withRegisteredUser(CustomerComponent)

                    renderWithProviders(<Component customerId={'WRONG_CUSTOMER_ID'} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
