/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import HooksRecommendationTool, {
    recommendHooksForUseCase,
    updatePageWithHooks
} from './hooks-recommendation-tool.js'
import fs from 'fs/promises'

// Mock fs/promises
jest.mock('fs/promises')

describe('HooksRecommendationTool', () => {
    let tool

    beforeEach(() => {
        jest.clearAllMocks()
        tool = new HooksRecommendationTool()
    })

    describe('Tool metadata', () => {
        it('should have correct name', () => {
            expect(tool.name).toBe('retailapp_recommend_hooks')
        })

        it('should have description', () => {
            expect(tool.description).toContain('Recommend React hooks')
        })

        it('should have input schema', () => {
            expect(tool.inputSchema).toBeDefined()
            expect(tool.inputSchema.useCase).toBeDefined()
            expect(tool.inputSchema.selectedHooks).toBeDefined()
            expect(tool.inputSchema.pagePath).toBeDefined()
        })
    })

    describe('handler - missing parameters', () => {
        it('should return system prompt when no parameters provided', async () => {
            const result = await tool.handler({})
            expect(result.content[0].text).toContain('please enter a page path and list of hooks')
        })

        it('should return integration prompt when selectedHooks provided but no pagePath', async () => {
            const result = await tool.handler({
                selectedHooks: ['useProduct', 'useBasket']
            })
            expect(result.content[0].text).toContain('please enter the path to the page to update')
        })
    })

    describe('handler - happy paths', () => {
        const mockCatalog = [
            {
                name: 'useProduct',
                summary: 'Hook for product.',
                snippet:
                    "// Imports: {useProduct} from '@salesforce/commerce-sdk-react'\nconst {data: product} = useProduct({parameters: {id: productId}})"
            },
            {
                name: 'useBasket',
                summary: 'Hook for basket.',
                snippet:
                    "// Imports: {useBasket} from '@salesforce/commerce-sdk-react'\nconst {data: basket} = useBasket()"
            }
        ]

        it('should recommend hooks for a use case', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockCatalog))

            const result = await tool.handler({
                useCase: 'fetch product data'
            })

            expect(result.content[0].text).toContain('Given the following use case')
            expect(result.content[0].text).toContain('fetch product data')
            expect(result.content[0].text).toContain('useProduct')
            expect(result.content[0].text).toContain('useBasket')
        })

        it('should update page with selected hooks', async () => {
            const mockPageContent = `import React from 'react'

const TestPage = () => {
  return <div>Test</div>
}

export default TestPage`

            fs.readFile
                .mockResolvedValueOnce(JSON.stringify(mockCatalog))
                .mockResolvedValueOnce(mockPageContent)

            const result = await tool.handler({
                selectedHooks: ['useProduct'],
                pagePath: '/test/page.jsx'
            })

            expect(result.content[0].text).toContain('Use the file edit tools')
            expect(result.content[0].text).toContain('/test/page.jsx')
            expect(result.content[0].text).toContain('import {useProduct}')
        })
    })

    describe('handler - error paths', () => {
        it('should handle error when catalog not found', async () => {
            fs.readFile.mockRejectedValue(new Error('File not found'))

            const result = await tool.handler({
                useCase: 'test case'
            })

            expect(result.content[0].text).toContain('Failed to recommend hooks')
            expect(result.content[0].text).toContain('File not found')
        })

        it('should handle error when hook not found in catalog', async () => {
            const mockCatalog = [
                {
                    name: 'useProduct',
                    summary: 'Hook for product.',
                    snippet: "const {data: product} = useProduct({parameters: {id: 'test'}})"
                }
            ]

            fs.readFile
                .mockResolvedValueOnce(JSON.stringify(mockCatalog))
                .mockResolvedValueOnce('const TestPage = () => {}')

            const result = await tool.handler({
                selectedHooks: ['useNonExistent'],
                pagePath: '/test/page.jsx'
            })

            expect(result.content[0].text).toContain('Failed to recommend hooks')
        })
    })
})

describe('recommendHooksForUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should throw error if catalog file cannot be read', async () => {
        fs.readFile.mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(recommendHooksForUseCase('test use case')).rejects.toThrow(
            'Failed to read hook catalog'
        )
    })

    it('should throw error if catalog JSON is invalid', async () => {
        fs.readFile.mockResolvedValue('invalid json')

        await expect(recommendHooksForUseCase('test use case')).rejects.toThrow()
    })
})

describe('updatePageWithHooks', () => {
    const mockCatalog = [
        {
            name: 'useProduct',
            summary: 'Hook for fetching product data',
            snippet:
                "// Imports: {useProduct} from '@salesforce/commerce-sdk-react'; {useParams} from 'react-router-dom'\nconst {productId} = useParams()\nconst {data: product} = useProduct({parameters: {id: productId}})\n// Example:\n// Use product data here"
        },
        {
            name: 'useBasket',
            summary: 'Hook for basket operations',
            snippet:
                "// Imports: {useBasket} from '@salesforce/commerce-sdk-react'\nconst {data: basket} = useBasket()\n// Example:\n// Use basket data"
        },
        {
            name: 'useStandardImport',
            summary: 'Hook with standard imports',
            snippet:
                "import {useStandardImport} from '@salesforce/commerce-sdk-react'\nimport {useState} from 'react'\nconst {data} = useStandardImport()"
        }
    ]

    const mockPageContent = `import React from 'react'
import {Box} from '@chakra-ui/react'

const TestPage = () => {
  return (
    <Box>
      <h1>Test Page</h1>
    </Box>
  )
}

export default TestPage`

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should add hook imports and implementations to page', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        const result = await updatePageWithHooks(['useProduct'], '/test/page.jsx')

        expect(result).toContain('import {useProduct}')
        expect(result).toContain("from '@salesforce/commerce-sdk-react'")
        expect(result).toContain('import {useParams}')
        expect(result).toContain("from 'react-router-dom'")
        expect(result).toContain('useProduct: Hook for fetching product data')
        expect(result).toContain('const {data: product} = useProduct')
    })

    it('should add multiple hooks to page', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        const result = await updatePageWithHooks(['useProduct', 'useBasket'], '/test/page.jsx')

        expect(result).toContain('useProduct')
        expect(result).toContain('useBasket')
        expect(result).toContain('Hook for fetching product data')
        expect(result).toContain('Hook for basket operations')
    })

    it('should handle hooks with standard import statements', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        const result = await updatePageWithHooks(['useStandardImport'], '/test/page.jsx')

        expect(result).toContain('import {useStandardImport}')
        expect(result).toContain('import {useState}')
    })

    it('should exclude content after "Example:" comment', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        const result = await updatePageWithHooks(['useProduct'], '/test/page.jsx')

        expect(result).not.toContain('Use product data here')
    })

    it('should throw error when hook not found in catalog', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        await expect(updatePageWithHooks(['useNonExistent'], '/test/page.jsx')).rejects.toThrow(
            'The following hooks were not found in the catalog: useNonExistent'
        )
    })

    it('should throw error for multiple missing hooks', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        await expect(
            updatePageWithHooks(['useNonExistent1', 'useNonExistent2'], '/test/page.jsx')
        ).rejects.toThrow('useNonExistent1, useNonExistent2')
    })

    it('should throw error if page file cannot be read', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.reject(new Error('ENOENT: file not found'))
        })

        await expect(updatePageWithHooks(['useProduct'], '/test/page.jsx')).rejects.toThrow(
            'Failed to update page with hooks'
        )
    })

    it('should handle page with no existing imports gracefully', async () => {
        const pageWithNoImports = `const TestPage = () => {
  return <div>Test</div>
}

export default TestPage`

        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(pageWithNoImports)
        })

        const result = await updatePageWithHooks(['useBasket'], '/test/page.jsx')

        expect(result).toBeDefined()
        expect(result).toContain('useBasket')
    })

    it('should handle page with arrow function component', async () => {
        const pageWithArrowFunction = `import React from 'react'

const TestPage = () => {
  return <div>Test</div>
}

export default TestPage`

        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(pageWithArrowFunction)
        })

        const result = await updatePageWithHooks(['useBasket'], '/test/page.jsx')

        expect(result).toBeDefined()
        expect(result).toContain('const {data: basket} = useBasket()')
    })

    it('should not duplicate imports', async () => {
        fs.readFile.mockImplementation((path) => {
            if (path.includes('catalog')) {
                return Promise.resolve(JSON.stringify(mockCatalog))
            }
            return Promise.resolve(mockPageContent)
        })

        const result = await updatePageWithHooks(['useProduct', 'useBasket'], '/test/page.jsx')

        // Count occurrences of the same import
        const importCount = (result.match(/import {useProduct}/g) || []).length
        expect(importCount).toBe(1)
    })
})
