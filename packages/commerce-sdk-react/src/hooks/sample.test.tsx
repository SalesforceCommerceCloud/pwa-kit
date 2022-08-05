/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import '@testing-library/jest-dom'
import {screen, waitFor} from '@testing-library/react'

import {mockHttpResponses, renderWithProviders} from '../test-utils'
import useCommerceApi from './useCommerceApi'
import {useProduct} from './ShopperProducts'
import {useAsync} from './useAsync'

const {withMocks} = mockHttpResponses({directory: `${__dirname}/mock-responses`})

// NOTE: how to easily _update_ the mocked responses:
// - Globally, via `npm run test:update-mocked-responses`
// - Per individual test file, by passing in `mode` value -> mockHttpResponses({mode: 'update', directory})

const ProductName = ({id}: {id: string}) => {
    const api = useCommerceApi()
    const [productName, setProductName] = useState('')

    useEffect(() => {
        const fetchProductName = async () => {
            const product = await api.shopperProducts.getProduct({
                parameters: {id}
            })
            setProductName(product.name as string)
        }
        fetchProductName()
    }, [])

    return <div>{productName}</div>
}

const ProductName2 = ({id}: {id: string}) => {
    const api = useCommerceApi()
    const {data, isLoading, error} = useAsync(
        () => api.shopperProducts.getProduct({parameters: {id}}),
        [id]
    )

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <span>{data.name}</span>}
            {error && <span>error</span>}
        </div>
    )
}

test(
    'useCommerceApi as lower-level hook',

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

describe('useAsync as higher-level hook', () => {
    test(
        'happy path',
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
        'non-existent product id',
        withMocks(async () => {
            renderWithProviders(<ProductName2 id="1" />)
            expect(screen.getByText('Loading...')).toBeInTheDocument()

            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
        })
    )
})

test(
    'useProduct as highest-level hook',
    withMocks(async () => {
        // TODO: what should get tested in a highest-level hook (like useProduct)?
        // If we've tested the lower-level hooks (useCommerceApi, useAsync), would that be sufficient?
        // And can we assume that the isomorphic sdk is well-tested already?
    })
)

// TODO: install eslint plugin https://github.com/testing-library/eslint-plugin-testing-library

// TODO: new tests that demonstrate:
// pwa kit domain:
// - mimic async network requests by delaying the response. And also checking the return value of our hooks _twice_
// - common patterns when testing hooks <- is this for a separate PR?
//
// nock domain: <- is this necessary?
// - a new recording / json file created for every test
// - multiple requests to the same endpoint in the same test would result in multiple results in the json file
