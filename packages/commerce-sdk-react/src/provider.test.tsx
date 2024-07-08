/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import useCommerceApi from './hooks/useCommerceApi'
import {renderWithProviders} from './test-utils'
import Auth from './auth'

jest.mock('./auth/index.ts')

describe('provider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('api clients optional config are passed properly', () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li>{api?.shopperSearch?.clientConfig?.headers?.['correlation-id']}</li>
                    <li>{api?.shopperSearch?.clientConfig?.fetchOptions?.timeout}</li>
                </ul>
            )
        }
        const config = {
            headers: {'correlation-id': '373a3f80-6bbb-4157-a617-63d27fb15769'},
            fetchOptions: {
                timeout: 50
            }
        }
        renderWithProviders(<Component />, config)
        expect(screen.getByText(config.headers['correlation-id'])).toBeInTheDocument()
        expect(screen.getByText(config.fetchOptions.timeout)).toBeInTheDocument()
    })

    test('Auth is initialized by invoking ready()', () => {
        renderWithProviders(<h1>I can render with no problem!</h1>)
        expect(screen.getByText('I can render with no problem!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(1)
    })

    test('Auth, if initialized with `fetchedToken` short circuits auth.ready()', () => {
        renderWithProviders(<h1>I can render with no problem!</h1>)
        expect(screen.getByText('I can render with no problem!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(1)
        expect(authInstance.queueRequest).toHaveBeenCalledTimes(0)
    })

    test('shopper login api client uses private proxy when enabled', () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li data-testid="proxy-value">{api?.shopperLogin?.clientConfig?.proxy}</li>
                </ul>
            )
        }
        const config = {
            enablePWAKitPrivateClient: true
        }
        renderWithProviders(<Component />, config)
        const element = screen.getByTestId('proxy-value')
        expect(element).toBeInTheDocument()
        expect(element.textContent?.includes('/mobify/slas/private')).toBeTruthy()
    })
})
