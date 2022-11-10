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

jest.mock('./auth/index.ts');

test(
    'props are used properly when initializing api clients',
    async () => {
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
    }
)

test(
    'api clients optional config are passed properly',
    async () => {
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
    }
)
