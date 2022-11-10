/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {
    useCustomer,
    useCustomerAddress,
    useCustomerOrders,
    useCustomerBaskets,
    useCustomerProductList
} from './query'
import {screen, waitFor} from '@testing-library/react'
import {useQueryClient} from '@tanstack/react-query'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const CUSTOMER_EMAIL = 'kobe@test.com'
const ADDRESS_NAME = 'TestAddress'
const LIST_ID = '987ae461a7c6c5fd17006fc774'

const CustomerComponent = ({customerId}: {customerId: string}): ReactElement => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const {data, isLoading, error} = useCustomer(
        {customerId},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <>
            {(isLoading || loginRegisteredUser.isLoading) && <span>Loading...</span>}
            {data && <div>{data?.login}</div>}
            {error && <span>error</span>}
        </>
    )
}

const CustomerAddressComponent = ({
    customerId,
    addressName
}: {
    customerId: string
    addressName: string
}): ReactElement => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const {data, isLoading, error} = useCustomerAddress(
        {customerId, addressName},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <>
            {(isLoading || loginRegisteredUser.isLoading) && <span>Loading...</span>}
            {data && <div>{JSON.stringify(data)}</div>}
            {error && <span>error</span>}
        </>
    )
}

const CustomerOrdersComponent = ({customerId}: {customerId: string}): ReactElement => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const {data, isLoading, error} = useCustomerOrders(
        {customerId},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <>
            {(isLoading || loginRegisteredUser.isLoading) && <span>Loading...</span>}
            {data && <div>{JSON.stringify(data)}</div>}
            {error && <span>error</span>}
        </>
    )
}

//TODO: Create a basket for the register user before testing if the basket exist
// Baskets are created in PR not merged yet https://github.com/SalesforceCommerceCloud/pwa-kit/pull/768
const CustomerBasketsComponent = ({customerId}: {customerId: string}): ReactElement => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const {data, isLoading, error} = useCustomerBaskets(
        {customerId},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <>
            {(isLoading || loginRegisteredUser.isLoading) && <span>Loading...</span>}
            {data && <div>{JSON.stringify(data)}</div>}
            {error && <span>error</span>}
        </>
    )
}

const CustomerProductListComponent = ({
    customerId,
    listId
}: {
    customerId: string
    listId: string
}): ReactElement => {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        queryClient.invalidateQueries([{entity: 'customer'}])
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const {data, isLoading, error} = useCustomerProductList(
        {customerId, listId},
        {
            // wait until the access_token is back before fetching
            enabled: !!loginRegisteredUser?.data?.access_token
        }
    )

    return (
        <>
            {(isLoading || loginRegisteredUser.isLoading) && <span>Loading...</span>}
            {data && <div>{data?.id}</div>}
            {error && <span>error</span>}
        </>
    )
}

const tests = [
    {
        hook: 'useCustomer',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerComponent customerId={CUSTOMER_ID} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(CUSTOMER_EMAIL))
                    expect(screen.getByText(CUSTOMER_EMAIL)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerComponent customerId={'WRONG_CUSTOMER_ID'} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    },
    {
        hook: 'useCustomerAddress',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerAddressComponent
                            customerId={CUSTOMER_ID}
                            addressName={ADDRESS_NAME}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(/address/i))
                    expect(screen.getByText(/address/i)).toBeInTheDocument()
                    await waitFor(() => screen.getByText(/postalCode/i))
                    expect(screen.queryByText(/postalCode/i)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerAddressComponent
                            customerId={'WRONG_CUSTOMER_ID'}
                            addressName={ADDRESS_NAME}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    },
    {
        hook: 'useCustomerOrders',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerOrdersComponent customerId={CUSTOMER_ID} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(/orderNo/i))
                    expect(screen.getByText(/orderTotal/i)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerOrdersComponent customerId={'WRONG_CUSTOMER_ID'} />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    },
    //TODO: Create a basket for the register user before testing if the basket exist
    // Baskets are created in PR not merged yet https://github.com/SalesforceCommerceCloud/pwa-kit/pull/768
    {
        hook: 'useCustomerBaskets',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(<CustomerBasketsComponent customerId={CUSTOMER_ID} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(/baskets/i))
                    expect(screen.getByText(/baskets/i)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerBasketsComponent customerId={'WRONG_CUSTOMER_ID'} />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    },
    {
        hook: 'useCustomerProductList',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerProductListComponent customerId={CUSTOMER_ID} listId={LIST_ID} />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(LIST_ID))
                    expect(screen.getByText(LIST_ID)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    renderWithProviders(
                        <CustomerProductListComponent
                            customerId={'WRONG_CUSTOMER_ID'}
                            listId={LIST_ID}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
