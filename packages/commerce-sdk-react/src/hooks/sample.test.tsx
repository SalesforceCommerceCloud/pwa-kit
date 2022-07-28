/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import '@testing-library/jest-dom'
import {screen, waitFor} from '@testing-library/react'
import {rest} from 'msw'

import {renderWithProviders, setupMockServer} from '../test-utils'
import useCommerceApi from './useCommerceApi'
import {useProduct} from './ShopperProducts'
import {product} from './mock-data'

const server = setupMockServer(
    rest.get(
        '/proxy/product/shopper-products/v1/organizations/f_ecom_zzrf_001/products/1',
        (req, res, ctx) => {
            return res(ctx.json(product))
        }
    )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('useCommerceApi', () => {
    const Component = () => {
        const api = useCommerceApi()
        return <div>{api?.shopperSearch && 'success'}</div>
    }
    // This util function would automatically integrate the provider components for you
    renderWithProviders(<Component />)

    expect(screen.getByText('success')).toBeInTheDocument()
})

// TODO
// https://testing-library.com/docs/react-testing-library/api#renderhook
// test('renderHook', () => {})

test('mocking api response', async () => {
    const Component = () => {
        // I think this hook does not really work as expected
        // because it relies on useAsync that still needs to be implemented correctly.
        const product = useProduct({parameters: {id: '1'}})
        return (
            <div>
                {product.isLoading && <span>loading</span>}
                {product.data && <span>{product.data.name}</span>}
            </div>
        )
    }

    renderWithProviders(<Component />)
    await waitFor(() => screen.getByText('loading'))

    expect(screen.getByText('loading')).toBeInTheDocument()
})
