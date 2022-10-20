/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useShopperLoginHelper} from './helper'
import {fireEvent, waitFor, screen} from '@testing-library/react'
import {renderWithProviders} from '../../test-utils'

const mockLoginGuestUser = jest.fn().mockResolvedValue('mockLoginGuestUser')

jest.mock('../useAuth', () => {
    return jest.fn(() => ({
        ready: () => Promise.resolve({access_token: '123'}),
        loginGuestUser: mockLoginGuestUser
    }))
})

const tests = [
    {
        hook: 'useShopperLoginHelper',
        cases: [
            {
                name: 'isLoading initial state',
                assertions: async () => {
                    const Component = () => {
                        const loginGuestUser = useShopperLoginHelper('loginGuestUser')
                        const loginRegisteredUserB2C = useShopperLoginHelper(
                            'loginRegisteredUserB2C'
                        )
                        const logout = useShopperLoginHelper('logout')
                        return (
                            <>
                                <p>
                                    loginGuestUser:isLoading:{loginGuestUser.isLoading.toString()}
                                </p>
                                <p>
                                    loginRegisteredUserB2C:isLoading:
                                    {loginRegisteredUserB2C.isLoading.toString()}
                                </p>
                                <p>logout:isLoading:{logout.isLoading.toString()}</p>
                            </>
                        )
                    }
                    renderWithProviders(<Component />)
                    expect(screen.getByText('loginGuestUser:isLoading:false')).toBeInTheDocument()
                    expect(
                        screen.getByText('loginRegisteredUserB2C:isLoading:false')
                    ).toBeInTheDocument()
                    expect(screen.getByText('logout:isLoading:false')).toBeInTheDocument()
                }
            },
            {
                name: 'mutate',
                assertions: async () => {
                    const Component = () => {
                        const loginGuestUser = useShopperLoginHelper('loginGuestUser')
                        return (
                            <>
                                <button onClick={() => loginGuestUser.mutate()}>login</button>
                                <p>{loginGuestUser.data}</p>
                            </>
                        )
                    }
                    renderWithProviders(<Component />)
                    const button = screen.getByText('login')
                    fireEvent.click(button)
                    await waitFor(() => screen.getByText('mockLoginGuestUser'))
                    expect(mockLoginGuestUser).toHaveBeenCalled()
                    expect(screen.getByText('mockLoginGuestUser')).toBeInTheDocument()
                }
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        afterEach(() => {
            mockLoginGuestUser.mockClear()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
