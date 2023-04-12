/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import HomePage from './index'
import {
    mockCustomerBaskets,
    mockedRegisteredCustomer,
    mockProductSearch
} from '../../mocks/mock-data'
import {createServer} from '../../../jest-setup'

const handlers = [
    {
        path: '*/customers/:customerId/baskets',
        res: () => {
            return mockCustomerBaskets
        }
    },
    {
        path: '*/customers/:customerId',
        res: () => {
            return mockedRegisteredCustomer
        }
    },
    {
        path: '*/product-search',
        res: () => {
            return mockProductSearch
        }
    }
]

describe('Home page', function () {
    createServer(handlers)
    test('should render without errors', async () => {
        const {getByTestId} = renderWithProviders(<HomePage />)

        expect(getByTestId('home-page')).toBeInTheDocument()
        expect(typeof HomePage.getTemplateName()).toEqual('string')
    })
})
