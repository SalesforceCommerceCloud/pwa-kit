/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import useCommerceApi from './useCommerceApi'
import {renderWithProviders} from '../test-utils'
import {ApiClients} from './types'

jest.mock('../auth/index.ts');

describe('useCommerceApi',() => {
    test(
        'returns a set of api clients',
        async () => {
            const clients: (keyof ApiClients)[] = [
                'shopperBaskets',
                'shopperContexts',
                'shopperCustomers',
                'shopperDiscoverySearch',
                'shopperGiftCertificates',
                'shopperLogin',
                'shopperOrders',
                'shopperProducts',
                'shopperPromotions',
                'shopperSearch'
            ]

            const Component = () => {
                const api = useCommerceApi()
                return (
                    <>
                    {clients.map((name) => {
                        return <p key={name}>{api[name] && name}</p>
                    })}
                    </>
                )
            }
            renderWithProviders(<Component />)
            clients.forEach((name) => {
                expect(screen.getByText(name)).toBeInTheDocument()
            })
        }
    )
})
