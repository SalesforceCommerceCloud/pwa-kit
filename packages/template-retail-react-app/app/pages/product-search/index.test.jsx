import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProductSearch from './index'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {mockProductSearchItem} from '@salesforce/retail-react-app/app/mocks/product-search-hit-data'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useProductSearch: jest.fn()
    }
})

describe('ProductSearch', () => {
    const MOCK_USE_QUERY_RESULT = {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        useProductSearch.mockImplementation(() => ({
            ...MOCK_USE_QUERY_RESULT,
            isLoading: true
        }))
        renderWithProviders(<ProductSearch searchQuery="suit" />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders error state', async () => {
        useProductSearch.mockImplementation(() => ({
            ...MOCK_USE_QUERY_RESULT,
            isError: true,
            error: {message: 'Something went wrong'}
        }))
        renderWithProviders(<ProductSearch searchQuery="suit" />)
        expect(await screen.findByText(/Error loading search results/i)).toBeInTheDocument()
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })

    it('renders no results state', async () => {
        useProductSearch.mockImplementation(() => ({
            ...MOCK_USE_QUERY_RESULT,
            data: {hits: [], total: 0}
        }))
        renderWithProviders(<ProductSearch searchQuery="notfound" />)
        expect(await screen.findByText(/couldn't find anything/i)).toBeInTheDocument()
    })

    it('renders prompt to enter search term if no query', async () => {
        useProductSearch.mockImplementation(() => ({
            ...MOCK_USE_QUERY_RESULT,
            data: {hits: [], total: 0}
        }))
        renderWithProviders(<ProductSearch />)
        expect(await screen.findByText(/Enter a search term/i)).toBeInTheDocument()
    })

    it('renders search results', async () => {
        useProductSearch.mockImplementation(() => ({
            ...MOCK_USE_QUERY_RESULT,
            data: {hits: [mockProductSearchItem], total: 1}
        }))
        renderWithProviders(<ProductSearch searchQuery="suit" />)
        expect(await screen.findByText(/Search Results for/i)).toBeInTheDocument()
        expect(screen.getByText(/1 Results/)).toBeInTheDocument()
        expect(screen.getByText(mockProductSearchItem.productName)).toBeInTheDocument()
    })
}) 