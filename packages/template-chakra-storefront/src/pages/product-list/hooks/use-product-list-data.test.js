/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, waitFor} from '@testing-library/react'
import {useProductListData} from './use-product-list-data'
import {useParams, useLocation} from 'react-router-dom'
import {useProductSearch, useCategory} from '@salesforce/commerce-sdk-react'
import {useSearchParams} from '../../../hooks'
import useEinstein from '../../../hooks/use-einstein'
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
    useLocation: jest.fn()
}))
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useProductSearch: jest.fn(),
    useCategory: jest.fn()
}))
jest.mock('../../../hooks', () => ({
    useSearchParams: jest.fn()
}))
jest.mock('../../../hooks/use-einstein', () => ({
    __esModule: true,
    default: jest.fn()
}))

const mockProductSearchResult = {
    hits: [{productId: '1', productName: 'Product 1'}],
    refinements: [
        {attributeId: 'c_color', values: []},
        {attributeId: 'c_isNew', values: []}
    ],
    total: 1
}
const mockCategory = {id: 'mens', name: 'Mens'}
const mockEinstein = {
    sendClickSearch: jest.fn(),
    sendClickCategory: jest.fn()
}

describe('useProductListData', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        useParams.mockReturnValue({})
        useLocation.mockReturnValue({search: ''})
        useSearchParams.mockReturnValue([
            {
                _refine: []
            }
        ])
        useProductSearch.mockReturnValue({
            isLoading: true,
            data: undefined,
            isRefetching: false
        })
        useCategory.mockReturnValue({data: undefined, error: undefined})
        useEinstein.mockReturnValue(mockEinstein)

        global.scrollTo = jest.fn()
    })

    test('returns initial loading state', () => {
        const {result} = renderHook(() => useProductListData())
        expect(result.current.isLoading).toBe(true)
        expect(result.current.productSearchResult).toBeUndefined()
    })

    describe('Search Results Page', () => {
        beforeEach(() => {
            useLocation.mockReturnValue({search: '?q=test'})
            useSearchParams.mockReturnValue([
                {
                    q: 'test',
                    _refine: []
                }
            ])
            useProductSearch.mockReturnValue({
                isLoading: false,
                isFetched: true,
                isRefetching: false,
                data: mockProductSearchResult
            })
        })

        test('returns search results and filters disallowed refinements', () => {
            const {result} = renderHook(() => useProductListData())

            expect(result.current.isSearch).toBe(true)
            expect(result.current.searchQuery).toBe('test')
            expect(result.current.productSearchResult.hits).toHaveLength(1)
            expect(result.current.productSearchResult.refinements).toHaveLength(1)
            expect(result.current.productSearchResult.refinements[0].attributeId).toBe('c_color')
            expect(result.current.category).toBeUndefined()
        })

        test('handles product click for search', () => {
            const {result} = renderHook(() => useProductListData())
            const product = {id: '1'}
            result.current.handleProductClick(product)
            expect(mockEinstein.sendClickSearch).toHaveBeenCalledWith('test', product)
            expect(mockEinstein.sendClickCategory).not.toHaveBeenCalled()
        })

        test('shows no results message when there are no hits', () => {
            useProductSearch.mockReturnValue({
                isLoading: false,
                isFetched: true,
                isRefetching: false,
                data: {hits: null, total: 0}
            })
            const {result} = renderHook(() => useProductListData())
            expect(result.current.showNoResults).toBe(true)
        })
    })

    describe('Category Page', () => {
        beforeEach(() => {
            useParams.mockReturnValue({categoryId: 'mens'})
            useSearchParams.mockReturnValue([
                {
                    _refine: []
                }
            ])
            useProductSearch.mockReturnValue({
                isLoading: false,
                isFetched: true,
                isRefetching: false,
                data: mockProductSearchResult
            })
            useCategory.mockReturnValue({data: mockCategory})
        })

        test('returns category data and product search results', () => {
            const {result} = renderHook(() => useProductListData())

            expect(result.current.isSearch).toBe(false)
            expect(result.current.category).toEqual(mockCategory)
            expect(result.current.productSearchResult.hits).toHaveLength(1)
            expect(useProductSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.objectContaining({
                        refine: ['cgid=mens']
                    })
                }),
                expect.anything()
            )
        })

        test('handles product click for category', () => {
            const {result} = renderHook(() => useProductListData())
            const product = {id: '1'}
            result.current.handleProductClick(product)
            expect(mockEinstein.sendClickCategory).toHaveBeenCalledWith(mockCategory, product)
            expect(mockEinstein.sendClickSearch).not.toHaveBeenCalled()
        })

        test('throws HTTPNotFound for 404 category error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            
            useCategory.mockReturnValue({error: {response: {status: 404}}})
            expect(() => renderHook(() => useProductListData())).toThrow(HTTPNotFound)
            
            consoleSpy.mockRestore()
        })

        test('throws HTTPError for other category errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            useCategory.mockReturnValue({error: {response: {status: 500}}})
            expect(() => renderHook(() => useProductListData())).toThrow(HTTPError)
            consoleSpy.mockRestore()
        })
    })

    describe('Refetching behavior', () => {
        test('scrolls to top and sets filters loading on refetch', async () => {
            const initialProps = {isRefetching: false}
            const {result, rerender} = renderHook(
                ({isRefetching}) => {
                    useProductSearch.mockReturnValue({isRefetching})
                    return useProductListData()
                },
                {initialProps}
            )

            rerender({isRefetching: true})

            expect(result.current.filtersLoading).toBe(true)
            await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 0))
        })
    })
})
