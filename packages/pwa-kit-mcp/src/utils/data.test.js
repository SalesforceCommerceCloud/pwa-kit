/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {hooksCatalogAsJson, loadHooksCatalog} from './data'
import fs from 'fs/promises'

// Mock fs/promises
jest.mock('fs/promises')

describe('hooksCatalogAsJson', () => {
    it('should convert markdown with single section to JSON', () => {
        const markdown = `
### useProducts
This hook fetches product data from the API.

\`\`\`javascript
const {data, isLoading} = useProducts({ids: ['123']})
\`\`\`
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
            name: 'useProducts',
            summary: 'This hook fetches product data from the API.',
            snippet: "const {data, isLoading} = useProducts({ids: ['123']})"
        })
    })

    it('should convert markdown with multiple sections to JSON', () => {
        const markdown = `
Some preamble text that should be ignored.

### useCustomer
Get customer information.

\`\`\`javascript
const customer = useCustomer()
\`\`\`

### useBasket
Manage shopping basket.

\`\`\`jsx
const {basket, addToBasket} = useBasket()
\`\`\`
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
            name: 'useCustomer',
            summary: 'Get customer information.',
            snippet: 'const customer = useCustomer()'
        })
        expect(result[1]).toEqual({
            name: 'useBasket',
            summary: 'Manage shopping basket.',
            snippet: 'const {basket, addToBasket} = useBasket()'
        })
    })

    it('should handle multi-line summaries', () => {
        const markdown = `
### useProductSearch
This hook allows you to search for products.
It supports filtering and pagination.
Returns results with metadata.

\`\`\`typescript
const {data} = useProductSearch({query: 'shoes', limit: 20})
\`\`\`
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('useProductSearch')
        expect(result[0].summary).toContain('This hook allows you to search for products.')
        expect(result[0].summary).toContain('It supports filtering and pagination.')
        expect(result[0].summary).toContain('Returns results with metadata.')
    })

    it('should handle multi-line code snippets', () => {
        const markdown = `
### useAuth
Authentication hook for user login.

\`\`\`javascript
const {login, logout, user} = useAuth()

useEffect(() => {
    if (user) {
        console.log('User logged in:', user.name)
    }
}, [user])
\`\`\`
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(1)
        expect(result[0].snippet).toContain('const {login, logout, user} = useAuth()')
        expect(result[0].snippet).toContain('useEffect(() => {')
        expect(result[0].snippet).toContain("console.log('User logged in:', user.name)")
        expect(result[0].snippet).toContain('}, [user])')
    })

    it('should ignore text after code block', () => {
        const markdown = `
### useWishlist
Manage customer wishlist.

\`\`\`javascript
const {items, addItem} = useWishlist()
\`\`\`

This text after the code block should be ignored.
And so should this.
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(1)
        expect(result[0].summary).toBe('Manage customer wishlist.')
        expect(result[0].snippet).toBe('const {items, addItem} = useWishlist()')
    })

    it('should handle section without code block', () => {
        const markdown = `
### useConfig
Get application configuration.

No code block provided for this one.
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('useConfig')
        expect(result[0].summary).toContain('Get application configuration.')
        expect(result[0].snippet).toBe('')
    })

    it('should ignore different programming language identifiers', () => {
        const markdown = `
### usePython
Example with Python syntax.

\`\`\`python
def example():
    return "test"
\`\`\`

### useTypeScript
Example with TypeScript syntax.

\`\`\`ts
const value: string = 'test'
\`\`\`
`
        const result = hooksCatalogAsJson(markdown)

        expect(result).toHaveLength(2)
        expect(result[0].snippet).toBe('def example():\n    return "test"')
        expect(result[1].snippet).toBe("const value: string = 'test'")
    })
})

describe('loadHooksCatalog', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should load and parse catalog from default path', async () => {
        const mockMarkdown = `### useProduct

Hook for product.

\`\`\`javascript
const {data} = useProduct()
\`\`\`
`
        fs.readFile.mockResolvedValue(mockMarkdown)

        const result = await loadHooksCatalog()

        expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('hook-catalog.md'), 'utf8')
        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
            name: 'useProduct',
            summary: 'Hook for product.',
            snippet: 'const {data} = useProduct()'
        })
    })
    it('should throw error when file cannot be read', async () => {
        fs.readFile.mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(loadHooksCatalog()).rejects.toThrow('ENOENT: file not found')
    })
})
