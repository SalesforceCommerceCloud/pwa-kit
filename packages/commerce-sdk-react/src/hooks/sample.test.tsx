/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {screen, waitFor} from '@testing-library/react'

import {mockHttpResponses, renderWithProviders} from '../test-utils'
import useCommerceApi from './useCommerceApi'
import {useAsync} from './useAsync'
import useAuth from './useAuth'

const {withMocks} = mockHttpResponses({directory: `${__dirname}/mock-responses`})

// NOTE: how to easily _update_ the mocked responses:
// - Globally, via `npm run test:update-mocked-responses`
// - Per individual test file,
//   - by temporarily passing in `mode: update` -> mockHttpResponses({mode: 'update', directory})
//   - OR by manually removing the mock-responses folder and re-running the tests

const ProductName = ({id}: {id: string}) => {
    const api = useCommerceApi()
    const auth = useAuth()
    const [productName, setProductName] = useState('')

    useEffect(() => {
        const fetchProductName = async () => {
            const {access_token} = await auth.ready()
            const product = await api.shopperProducts.getProduct({
                parameters: {id},
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            })
            setProductName(product.name as string)
        }
        fetchProductName()
    }, [])

    return <div>{productName}</div>
}

const ProductName2 = ({id}: {id: string}) => {
    const api = useCommerceApi()
    const {data, isLoading, error} = useAsync(['getProduct', {id}], async ({access_token}) =>
        api.shopperProducts.getProduct({
            parameters: {id},
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
    )

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <span>{data.name}</span>}
            {error && <span>error</span>}
        </div>
    )
}

describe('lower-level hook', () => {
    test(
        'useCommerceApi',

        // Every test that calls `withMocks` would get associated with its own recording file,
        // whose filename matches the name of the current test.
        withMocks(async () => {
            // This util function would automatically integrate the provider components for you
            renderWithProviders(<ProductName id="25591862M" />)

            const productName = 'Stripe Walking Short'
            await waitFor(() => screen.getByText(productName))

            expect(screen.getByText(productName)).toBeInTheDocument()
        })
    )
})

describe('higher-level hook', () => {
    test(
        'useAsync happy path',
        withMocks(async () => {
            renderWithProviders(<ProductName2 id="25591862M" />)
            const productName = 'Stripe Walking Short'

            expect(screen.queryByText(productName)).toBeNull()
            expect(screen.getByText('Loading...')).toBeInTheDocument()

            await waitFor(() => screen.getByText(productName))

            expect(screen.getByText(productName)).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )

    test(
        'useAsync error',
        withMocks(async () => {
            // Pass in a non-existent product id
            renderWithProviders(<ProductName2 id="1" />)
            expect(screen.getByText('Loading...')).toBeInTheDocument()

            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )
})

describe('highest-level hook', () => {
    test(
        'useProduct',
        withMocks(async () => {
            // TODO: what should get tested in a highest-level hook (like useProduct)?
            // If we've tested the lower-level hooks (useCommerceApi, useAsync), would that be sufficient?
            // And can we assume that the isomorphic sdk is well-tested already?
        })
    )
})
