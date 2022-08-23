/*
 * Copyright (c) 2022, Salesforce, Inc..
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {useCategories, useCategory, useProduct, useProducts} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: `${__dirname}/mock-responses`})

describe('useProducts', () => {
    const ids = '25502228M,25503045M'

    const Products = ({ids}: {ids: string}): ReactElement => {
        const {data, isLoading, error} = useProducts({
            ids
        })
        return (
            <div>
                {isLoading && <span>Loading...</span>}
                {data && (
                    <div>
                        <div>Total: {data.total}</div>
                    </div>
                )}
                {data && (
                    <div>
                        {data.data?.map(({name}) => (
                            <div key={name}>{name}</div>
                        ))}
                    </div>
                )}
                {error && <span>error</span>}
            </div>
        )
    }

    test(
        'returns data',
        withMocks(async () => {
            renderWithProviders(<Products ids={ids} />)
            const productNames = ['Dot Pattern Cardigan', 'Belted Cardigan With Studs']

            expect(screen.queryByText(productNames[0])).toBeNull()
            expect(screen.queryByText(productNames[1])).toBeNull()
            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText(productNames[0]))
            expect(screen.getByText(productNames[0])).toBeInTheDocument()
            expect(screen.getByText(productNames[1])).toBeInTheDocument()
            expect(screen.getByText(`Total: ${productNames.length}`)).toBeInTheDocument()
        })
    )

    test(
        'returns an error',
        withMocks(async () => {
            // limit of id is 25, generating 26 random ids here to get an 400 error from server
            const fakeIds = [...new Array(26)].map((i) => Math.floor(Math.random() * 26)).join(',')
            renderWithProviders(<Products ids={fakeIds} />)

            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )
})

describe('useProduct', () => {
    const id = '25502228M'

    const Product = ({id}: {id: string}): ReactElement => {
        const {data, isLoading, error} = useProduct({
            id
        })
        return (
            <div>
                {isLoading && <span>Loading...</span>}
                {data && <div>{data.name}</div>}
                {error && <span>error</span>}
            </div>
        )
    }

    test(
        'returns data',
        withMocks(async () => {
            renderWithProviders(<Product id={id} />)
            const productName = 'Belted Cardigan With Studs'

            expect(screen.queryByText(productName)).toBeNull()
            expect(screen.getByText('Loading...')).toBeInTheDocument()

            await waitFor(() => screen.getByText(productName))

            expect(screen.getByText(productName)).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )

    test(
        'returns an error',
        withMocks(async () => {
            renderWithProviders(<Product id="abc" />)

            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )
})

describe('useCategories', () => {
    const Categories = ({ids}: {ids: string}): ReactElement => {
        const {data, isLoading, error} = useCategories({
            ids,
            levels: 2
        })
        console.log('data', data)
        return (
            <div>
                {isLoading && <span>Loading...</span>}
                {data && <div>Total: {data.total}</div>}
                {data && (
                    <div>
                        {data.data?.map(({id}: {id: string}) => (
                            <div key={id}>{id}</div>
                        ))}
                    </div>
                )}
                {error && <span>error</span>}
            </div>
        )
    }

    test(
        'returns data',
        withMocks(async () => {
            renderWithProviders(<Categories ids="womens-clothing,mens-clothing" />)
            const catIds = ['womens-clothing', 'mens-clothing']

            expect(screen.queryByText(catIds[0])).toBeNull()
            expect(screen.queryByText(catIds[1])).toBeNull()
            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText(`Total: 2`))
            expect(screen.getByText(catIds[0])).toBeInTheDocument()
            expect(screen.getByText(catIds[1])).toBeInTheDocument()
            expect(screen.getByText(`Total: ${catIds.length}`)).toBeInTheDocument()
        })
    )

    test(
        'returns an error',
        withMocks(async () => {
            // limit of id is 50, generating 51 random ids here to get an 400 error from server
            const fakeIds = [...new Array(51)].map((i) => Math.floor(Math.random() * 26)).join(',')
            console.log('fakeIds', fakeIds)
            renderWithProviders(<Categories ids={fakeIds} />)

            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )
})

describe('useCategory', () => {
    const id = 'newarrivals'

    const Category = ({id}: {id: string}): ReactElement => {
        const {data, isLoading, error} = useCategory({
            id
        })
        return (
            <div>
                {isLoading && <span>Loading...</span>}
                {data && <div>{data.name}</div>}
                {error && <span>error</span>}
            </div>
        )
    }

    test(
        'returns data',
        withMocks(async () => {
            renderWithProviders(<Category id={id} />)
            const categoryName = 'New Arrivals'

            expect(screen.queryByText(categoryName)).toBeNull()
            expect(screen.getByText('Loading...')).toBeInTheDocument()

            await waitFor(() => screen.getByText(categoryName))

            expect(screen.getByText(categoryName)).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )

    test(
        'returns an error',
        withMocks(async () => {
            renderWithProviders(<Category id="abc" />)

            expect(screen.getByText('Loading...')).toBeInTheDocument()
            await waitFor(() => screen.getByText('error'))
            expect(screen.getByText('error')).toBeInTheDocument()
            expect(screen.queryByText('Loading...')).toBeNull()
        })
    )
})
