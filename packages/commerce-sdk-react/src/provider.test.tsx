/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import React, {useState, useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import useCommerceApi from './hooks/useCommerceApi'
import {renderWithProviders, mockHttpResponses, TEST_CONFIG} from './test-utils'
import useAuth from './hooks/useAuth'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, `../mock-responses`)})

jest.mock('./hooks/useAuth', () => {
    return jest.fn(() => ({
        ready: () => Promise.resolve({access_token: '123'})
    }))
})

test(
    'useCommerceApi returns a set of api clients',
    withMocks(async () => {
        const Component = () => {
            const api = useCommerceApi()
            const auth = useAuth()
            const [isAuthReady, setIsAuthReady] = useState(false)
            useEffect(() => {
                const waitForAuth = async () => {
                    await auth.ready()
                    setIsAuthReady(true)
                }
                waitForAuth()
            }, [])
            return (
                <>
                    <p>{api?.shopperSearch && 'success'}</p>
                    <p>{isAuthReady && 'ready'}</p>
                </>
            )
        }
        renderWithProviders(<Component />)
        await waitFor(() => screen.getByText('success') && screen.getByText('ready'))
        expect(screen.getByText('success')).toBeInTheDocument()
    })
)

test(
    'props are used properly when initializing api clients',
    withMocks(async () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li>{api?.shopperSearch?.clientConfig?.parameters?.clientId}</li>
                    <li>{api?.shopperSearch?.clientConfig?.parameters?.siteId}</li>
                    <li>{api?.shopperSearch?.clientConfig?.parameters?.shortCode}</li>
                    <li>{api?.shopperSearch?.clientConfig?.parameters?.organizationId}</li>
                </ul>
            )
        }
        renderWithProviders(<Component />)

        expect(screen.getByText(TEST_CONFIG.clientId)).toBeInTheDocument()
        expect(screen.getByText(TEST_CONFIG.siteId)).toBeInTheDocument()
        expect(screen.getByText(TEST_CONFIG.shortCode)).toBeInTheDocument()
        expect(screen.getByText(TEST_CONFIG.organizationId)).toBeInTheDocument()
    })
)

test(
    'api clients optional config are passed properly',
    withMocks(async () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li>{api?.shopperSearch?.clientConfig?.headers?.['correlation-id']}</li>
                    <li>{api?.shopperSearch?.clientConfig?.fetchOptions?.timeout}</li>
                </ul>
            )
        }
        const commerceApiProviderConfig = {
            headers: {'correlation-id': '373a3f80-6bbb-4157-a617-63d27fb15769'},
            fetchOptions: {
                timeout: 50
            }
        }
        renderWithProviders(
            <Component />,
            {},
            {
                commerceApiProvider: commerceApiProviderConfig
            }
        )
        expect(
            screen.getByText(commerceApiProviderConfig.headers['correlation-id'])
        ).toBeInTheDocument()
        expect(screen.getByText(commerceApiProviderConfig.fetchOptions.timeout)).toBeInTheDocument()
    })
)
