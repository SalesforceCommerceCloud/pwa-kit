import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {Helmet} from 'react-helmet'
import ProductDetail from './index' // Adjust path as necessary
import {useProduct} from '@salesforce/commerce-sdk-react'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'
import {useParams, useHistory, useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'

// Mock hooks and dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useProduct: jest.fn(),
    useCategory: jest.fn(() => ({data: {id: 'mock-category'}})), // Simple mock for useCategory
    useShopperBasketsMutation: jest.fn(() => ({mutateAsync: jest.fn()})),
    useShopperCustomersMutation: jest.fn(() => ({mutate: jest.fn()})),
    useCustomerId: jest.fn(() => 'mock-customer-id')
}))

jest.mock('@salesforce/retail-react-app/app/hooks', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/hooks'),
    useVariant: jest.fn(),
    useCurrentBasket: jest.fn(() => ({isLoading: false})),
    useToast: jest.fn(() => jest.fn()),
    useWishList: jest.fn(() => ({data: null, isLoading: false})),
    useNavigation: jest.fn(() => jest.fn()),
    useEinstein: jest.fn(() => ({sendViewProduct: jest.fn(), sendAddToCart: jest.fn()})),
    useDataCloud: jest.fn(() => ({sendViewProduct: jest.fn()})),
    useActiveData: jest.fn(() => ({sendViewProduct: jest.fn()}))
}))

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
    useHistory: jest.fn(() => ({replace: jest.fn(), push: jest.fn()})),
    useLocation: jest.fn(() => ({pathname: '/mock-path', search: ''}))
}))

jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: jest.fn(() => ({formatMessage: jest.fn((msg) => msg.defaultMessage || msg.id)}))
}))

// Mock react-helmet
// Helmet usually writes to document.head. We can inspect that directly.
// Or, we can use the `Helmet.peek()` method if we configure Helmet for server-side rendering tests,
// but for client-side, checking document.head is standard.

const mockProductBase = {
    id: '123',
    name: 'Test Product',
    pageTitle: 'Test Product Title',
    pageDescription: 'This is a test product.',
    shortDescription: 'Short description.',
    brand: 'TestBrand',
    currency: 'USD',
    price: 99.99,
    imageGroups: [
        {
            viewType: 'large',
            images: [{link: 'https://example.com/image1.jpg', alt: 'Image 1'}]
        },
        {
            viewType: 'small',
            images: [{link: 'https://example.com/image1_small.jpg', alt: 'Image 1 Small'}]
        }
    ],
    inventory: {
        orderable: true,
        stockLevel: 100
    },
    type: {master: true} // Assuming it's a master product for simplicity in tests
    // Add other fields as necessary based on component usage
}

const mockVariantBase = {
    productId: '456-variant',
    price: 89.99,
    inventory: {
        orderable: true,
        stockLevel: 50
    }
    // Add other variant-specific fields
}

describe('ProductDetail Component - Schema.org Markup', () => {
    let originalLocation

    beforeAll(() => {
        originalLocation = window.location

        // Mock window.location.href
        delete window.location
        window.location = {
            ...originalLocation,
            href: 'https://www.example.com/product/123'
        }

        // Mock for InformationAccordion and RecommendedProducts if they cause issues
        jest.mock(
            '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion',
            () => () => <div data-testid="info-accordion-mock">Information Accordion</div>
        )
        jest.mock(
            '@salesforce/retail-react-app/app/components/recommended-products',
            () => () => <div data-testid="recommended-products-mock">Recommended Products</div>
        )
    })

    afterAll(() => {
        window.location = originalLocation // Restore original window.location
    })

    beforeEach(() => {
        // Reset mocks for each test
        useProduct.mockReset()
        useVariant.mockReset()
        useParams.mockReturnValue({productId: '123'}) // Default params
        // Clear Helmet effects by removing script tags added by it
        const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
        scripts.forEach((s) => s.remove())
    })

    test('should render Product JSON-LD script when product data is available', async () => {
        useProduct.mockReturnValue({data: mockProductBase, isLoading: false, isError: false})
        useVariant.mockReturnValue(mockVariantBase)

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            expect(scriptTag).toBeInTheDocument()
            const parsedSchema = JSON.parse(scriptTag.innerHTML)

            expect(parsedSchema['@context']).toBe('https://schema.org/')
            expect(parsedSchema['@type']).toBe('Product')
            expect(parsedSchema.name).toBe(mockProductBase.name)
            expect(parsedSchema.description).toBe(mockProductBase.pageDescription)
            expect(parsedSchema.sku).toBe(mockVariantBase.productId) // Uses variant SKU
            expect(parsedSchema.image).toEqual(['https://example.com/image1.jpg'])
            expect(parsedSchema.brand['@type']).toBe('Brand')
            expect(parsedSchema.brand.name).toBe(mockProductBase.brand)

            const offers = parsedSchema.offers
            expect(offers['@type']).toBe('Offer')
            expect(offers.priceCurrency).toBe(mockProductBase.currency)
            expect(offers.price).toBe(mockVariantBase.price) // Uses variant price
            expect(offers.availability).toBe('https://schema.org/InStock')
            expect(offers.url).toBe('https://www.example.com/product/123')
        })
    })

    test('should use master product details for SKU and price if variant is not available', async () => {
        useProduct.mockReturnValue({data: mockProductBase, isLoading: false, isError: false})
        useVariant.mockReturnValue(null) // No variant selected or available

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            expect(scriptTag).toBeInTheDocument()
            const parsedSchema = JSON.parse(scriptTag.innerHTML)

            expect(parsedSchema.sku).toBe(mockProductBase.id) // Fallback to master product ID
            expect(parsedSchema.offers.price).toBe(mockProductBase.price) // Fallback to master price
        })
    })


    test('should correctly set availability to OutOfStock', async () => {
        const outOfStockProduct = {
            ...mockProductBase,
            inventory: {orderable: false, stockLevel: 0}
        }
        useProduct.mockReturnValue({data: outOfStockProduct, isLoading: false, isError: false})
        useVariant.mockReturnValue(null) // No variant

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            const parsedSchema = JSON.parse(scriptTag.innerHTML)
            expect(parsedSchema.offers.availability).toBe('https://schema.org/OutOfStock')
        })
    })

    test('should not render Product JSON-LD script when product data is null', async () => {
        useProduct.mockReturnValue({data: null, isLoading: false, isError: false})
        useVariant.mockReturnValue(null)

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            expect(scriptTag).not.toBeInTheDocument()
        })
    })

    test('should handle product with no brand gracefully', async () => {
        const noBrandProduct = {...mockProductBase, brand: undefined}
        useProduct.mockReturnValue({data: noBrandProduct, isLoading: false, isError: false})
        useVariant.mockReturnValue(mockVariantBase)

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            const parsedSchema = JSON.parse(scriptTag.innerHTML)
            expect(parsedSchema.brand).toBeUndefined()
        })
    })

    test('should handle product with minimal image data', async () => {
        const minimalImageProduct = {
            ...mockProductBase,
            imageGroups: [{viewType: 'testing', images: [{link: 'https://example.com/test.jpg'}]}]
        }
        useProduct.mockReturnValue({data: minimalImageProduct, isLoading: false, isError: false})
        useVariant.mockReturnValue(mockVariantBase)

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            const parsedSchema = JSON.parse(scriptTag.innerHTML)
            expect(parsedSchema.image).toEqual(['https://example.com/test.jpg'])
        })
    })

    test('should handle product with no image groups but a primary image', async () => {
        const primaryImageProduct = {
            ...mockProductBase,
            imageGroups: null, // No image groups
            image: 'https://example.com/primary.jpg' // Has a primary image field
        }
        useProduct.mockReturnValue({data: primaryImageProduct, isLoading: false, isError: false})
        useVariant.mockReturnValue(mockVariantBase)

        render(<ProductDetail />)

        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            const parsedSchema = JSON.parse(scriptTag.innerHTML)
            expect(parsedSchema.image).toEqual(['https://example.com/primary.jpg'])
        })
    })

    test('should handle product with no images at all', async () => {
        const noImageProduct = {
            ...mockProductBase,
            imageGroups: null,
            image: null
        }
        useProduct.mockReturnValue({data: noImageProduct, isLoading: false, isError: false})
        useVariant.mockReturnValue(mockVariantBase)

        render(<ProductDetail />)
        
        await waitFor(() => {
            const scriptTag = document.head.querySelector('script[type="application/ld+json"]')
            const parsedSchema = JSON.parse(scriptTag.innerHTML)
            expect(parsedSchema.image).toEqual([]) // Should be empty array or undefined based on implementation
        })
    })
})
