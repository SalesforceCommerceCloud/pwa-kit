/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import {useProductListControls} from './use-product-list-controls'
import {useLocation, useParams} from 'react-router-dom'
import {usePageUrls, useSortUrls, useSearchParams} from '../../../hooks'
import useNavigation from '../../../hooks/use-navigation'

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn(),
    useParams: jest.fn()
}))

jest.mock('../../../hooks', () => ({
    usePageUrls: jest.fn(),
    useSortUrls: jest.fn(),
    useSearchParams: jest.fn()
}))

jest.mock('../../../hooks/use-navigation', () => jest.fn())

const mockProductSearchResult = {
    total: 100,
    sortingOptions: [{id: 'best-matches', label: 'Best Matches'}]
}

describe('useProductListControls', () => {
    let mockNavigate
    let mockStringifySearchParams

    beforeEach(() => {
        mockNavigate = jest.fn()
        mockStringifySearchParams = jest.fn((params) => {
            const query = new URLSearchParams()
            if (params.refine) {
                Object.entries(params.refine).forEach(([key, value]) => {
                    query.set(`refine_${key}`, Array.isArray(value) ? value.join('|') : value)
                })
            }
            if (params.sort) {
                query.set('sort', params.sort)
            }
            // `URLSearchParams` stringifies to '' if empty, which is what we want.
            return query.toString()
        })

        useLocation.mockReturnValue({
            pathname: '/category/womens',
            search: ''
        })
        useParams.mockReturnValue({categoryId: 'womens'})
        usePageUrls.mockReturnValue({1: '/page1', 2: '/page2'})
        useSortUrls.mockReturnValue([{href: '/sort', 'aria-checked': true}])
        useSearchParams.mockReturnValue([{}, {stringify: mockStringifySearchParams}])
        useNavigation.mockReturnValue(mockNavigate)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns the correct initial state', () => {
        const searchParams = {sort: 'best-matches'}
        useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
        useLocation.mockReturnValue({pathname: '/category/womens', search: '?sort=best-matches'})
        const {result} = renderHook(() =>
            useProductListControls({productSearchResult: mockProductSearchResult})
        )

        expect(result.current.basePath).toBe('/category/womens?sort=best-matches')
        expect(result.current.pageUrls).toEqual({1: '/page1', 2: '/page2'})
        expect(result.current.sortUrls).toEqual([{href: '/sort', 'aria-checked': true}])
        expect(result.current.searchParams).toEqual(searchParams)
    })

    describe('toggleFilter', () => {
        test('adds a value to a multi-select filter', () => {
            const searchParams = {refine: {c_color: 'blue'}, offset: 20}
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.toggleFilter({value: 'red'}, 'c_color', false)
            const expectedParams = {refine: {c_color: ['blue', 'red']}}
            expect(mockStringifySearchParams).toHaveBeenCalledWith(expectedParams)
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('removes a value from a multi-select filter', () => {
            const searchParams = {refine: {c_color: 'blue|red'}, offset: 20}
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.toggleFilter({value: 'red'}, 'c_color', true)
            const expectedParams = {refine: {c_color: ['blue']}}
            expect(mockStringifySearchParams).toHaveBeenCalledWith(expectedParams)
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('removes the attribute when the last value is removed', () => {
            const searchParams = {refine: {c_color: 'blue'}, offset: 20}
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.toggleFilter({value: 'blue'}, 'c_color', true)
            const expectedParams = {refine: {}}
            expect(mockStringifySearchParams).toHaveBeenCalledWith(expectedParams)
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('replaces a value for a single-select filter', () => {
            const searchParams = {refine: {price: '10-20'}, offset: 20}
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.toggleFilter({value: '20-30'}, 'price', false, false)
            const expectedParams = {refine: {price: '20-30'}}
            expect(mockStringifySearchParams).toHaveBeenCalledWith(expectedParams)
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('removes a value for a single-select filter when deselected', () => {
            const searchParams = {refine: {price: '10-20'}, offset: 20}
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.toggleFilter({value: '10-20'}, 'price', true, false)
            const expectedParams = {refine: {}}
            expect(mockStringifySearchParams).toHaveBeenCalledWith(expectedParams)
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('navigates to search URL for search pages', () => {
            const {result} = renderHook(() =>
                useProductListControls({
                    productSearchResult: mockProductSearchResult,
                    isSearch: true
                })
            )
            result.current.toggleFilter({value: 'red'}, 'c_color', false)
            const expectedParams = {refine: {c_color: ['red']}}
            expect(mockNavigate).toHaveBeenCalledWith(
                `/search?${mockStringifySearchParams(expectedParams)}`
            )
        })
    })

    describe('resetFilters', () => {
        test('removes all filters for a category page', () => {
            const searchParams = {
                refine: {c_color: 'blue', c_size: 'M'},
                sort: 'best-matches'
            }
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({productSearchResult: mockProductSearchResult})
            )
            result.current.resetFilters()
            const expectedParams = {refine: [], sort: 'best-matches'}
            expect(mockNavigate).toHaveBeenCalledWith(
                `/category/womens?${mockStringifySearchParams(expectedParams)}`
            )
        })

        test('removes all filters for a search page', () => {
            const searchParams = {
                refine: {c_color: 'blue', c_size: 'M'},
                sort: 'best-matches'
            }
            useSearchParams.mockReturnValue([searchParams, {stringify: mockStringifySearchParams}])
            const {result} = renderHook(() =>
                useProductListControls({
                    productSearchResult: mockProductSearchResult,
                    isSearch: true
                })
            )
            result.current.resetFilters()
            const expectedParams = {refine: [], sort: 'best-matches'}
            expect(mockNavigate).toHaveBeenCalledWith(
                `/search?${mockStringifySearchParams(expectedParams)}`
            )
        })
    })
})
