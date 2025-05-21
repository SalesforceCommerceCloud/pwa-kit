import request from 'supertest' // Assuming supertest is available
import {get as getApp} from './ssr' // Assuming ssr.js exports the app or a getter for it
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {ShopperProducts, ShopperCategories} from 'commerce-sdk-isomorphic'

// Mock PWA Kit utilities
jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => ({
    getAppOrigin: jest.fn()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Mock Commerce SDK clients
jest.mock('commerce-sdk-isomorphic', () => {
    const originalModule = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...originalModule,
        ShopperProducts: jest.fn().mockImplementation(() => ({
            getProducts: jest.fn()
        })),
        ShopperCategories: jest.fn().mockImplementation(() => ({
            getCategories: jest.fn()
        }))
    }
})

describe('/sitemap.xml endpoint', () => {
    let app
    let mockProductsClient
    let mockCategoriesClient

    beforeAll(() => {
        // This assumes `getApp()` returns the express app instance.
        // Adjust if ssr.js exports the app differently.
        // The original ssr.js exports `get` which is `runtime.createHandler(...)`,
        // which internally creates the express app. We might need to spy on `runtime.createHandler`
        // or modify ssr.js slightly to get the app instance for testing.
        // For now, proceeding with the assumption that `getApp()` can provide the express app.
        // If `getApp` is the handler, supertest can often work with it directly.
        app = getApp()

        // Configure mock return values for PWA Kit utilities
        getAppOrigin.mockReturnValue('https://www.example.com')
        getConfig.mockReturnValue({
            app: {
                commerceAPI: {
                    parameters: {
                        clientId: 'test-client-id',
                        organizationId: 'test-org-id',
                        shortCode: 'test-short-code',
                        siteId: 'test-site-id'
                    }
                }
            }
        })

        // Get instances of mocked SDK clients to set up their method mocks
        // This requires ShopperProducts and ShopperCategories to be constructible
        // and their methods mockable, which the jest.mock setup above should provide.
        mockProductsClient = new ShopperProducts()
        mockCategoriesClient = new ShopperCategories()
    })

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks()
        // Redefine default mock implementations for each test if necessary
        getAppOrigin.mockReturnValue('https://www.example.com') // Ensure it's reset for each test
        getConfig.mockReturnValue({ // Ensure it's reset for each test
            app: {
                commerceAPI: {
                    parameters: {
                        clientId: 'test-client-id',
                        organizationId: 'test-org-id',
                        shortCode: 'test-short-code',
                        siteId: 'test-site-id'
                    }
                }
            }
        })

        mockCategoriesClient.getCategories.mockResolvedValue({
            data: [
                {
                    id: 'mock-category-id',
                    name: 'Mock Category',
                    categories: [{id: 'mock-subcategory-id', name: 'Mock SubCategory'}]
                }
            ]
        })
        mockProductsClient.getProducts.mockResolvedValue({
            data: [{id: 'mock-product-id', name: 'Mock Product'}]
        })
    })

    test('should respond with 200 OK and Content-Type application/xml', async () => {
        const response = await request(app).get('/sitemap.xml')
        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('application/xml')
    })

    test('response body should be valid XML and contain basic sitemap structure', async () => {
        const response = await request(app).get('/sitemap.xml')
        const body = response.text

        expect(body).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/)
        expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
        expect(body).toContain('</urlset>')
        expect(body).toContain('<url>')
        expect(body).toContain('</url>')
        expect(body).toContain('<lastmod>')
        expect(body).toContain('</lastmod>')

        // A more robust XML validation might involve an XML parser if available
        // For now, regex and string contains are used.
    })

    test('should contain correct loc entries for homepage, categories, and products', async () => {
        const response = await request(app).get('/sitemap.xml')
        const body = response.text

        expect(body).toContain('<loc>https://www.example.com/</loc>')
        expect(body).toContain('<loc>https://www.example.com/category/mock-category-id</loc>')
        expect(body).toContain('<loc>https://www.example.com/category/mock-subcategory-id</loc>')
        expect(body).toContain('<loc>https://www.example.com/product/mock-product-id</loc>')
    })

    test('should handle errors from SDK calls gracefully', async () => {
        mockCategoriesClient.getCategories.mockRejectedValue(new Error('Category API Error'))
        mockProductsClient.getProducts.mockRejectedValue(new Error('Product API Error'))

        const response = await request(app).get('/sitemap.xml')
        // Even if parts fail, the sitemap should still be generated with what's available
        // and not crash the server. Or it could return a 500, depending on desired error handling.
        // The current implementation in ssr.js logs errors but sends the XML string built so far.
        expect(response.status).toBe(200) // Or 500 if we change error handling to be more strict
        expect(response.headers['content-type']).toContain('application/xml')
        expect(response.text).toContain('<urlset') // Basic structure should still be there
        // Check that it does not contain the errored parts, or contains a comment about it
        expect(response.text).not.toContain('mock-category-id')
        expect(response.text).not.toContain('mock-product-id')
    })

    test('should handle empty data from SDK calls', async () => {
        mockCategoriesClient.getCategories.mockResolvedValue({data: []})
        mockProductsClient.getProducts.mockResolvedValue({data: []})

        const response = await request(app).get('/sitemap.xml')
        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('application/xml')
        expect(response.text).toContain('<loc>https://www.example.com/</loc>') // Homepage always there
        expect(response.text).not.toContain('/category/')
        expect(response.text).not.toContain('/product/')
    })
})
