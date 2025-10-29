/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import ComponentsRecommendationTool, {
    recommendComponentsForUseCase,
    updatePageWithComponents
} from './components-recommendations.js'
import fs from 'fs/promises'
import {loadComponentsCatalog} from '../utils/data'

// Mock fs/promises and data module
jest.mock('fs/promises')
jest.mock('../utils/data')

describe('ComponentsRecommendationTool', () => {
    let tool

    beforeEach(() => {
        jest.clearAllMocks()
        tool = new ComponentsRecommendationTool()
    })

    describe('Tool metadata', () => {
        it('should have correct name', () => {
            expect(tool.name).toBe('pwakit_recommend_components')
        })

        it('should have description', () => {
            expect(tool.description).toContain('Recommend and use React components')
        })

        it('should have input schema', () => {
            expect(tool.inputSchema).toBeDefined()
            expect(tool.inputSchema.useCase).toBeDefined()
            expect(tool.inputSchema.selectedComponents).toBeDefined()
            expect(tool.inputSchema.pagePath).toBeDefined()
        })
    })

    describe('handler - missing parameters', () => {
        it('should return system prompt when no parameters provided', async () => {
            const result = await tool.handler({})
            expect(result.content[0].text).toContain(
                'please enter a page path and list of components'
            )
        })

        it('should return integration prompt when selectedComponents provided but no pagePath', async () => {
            const result = await tool.handler({
                selectedComponents: ['ProductTile', 'Breadcrumb']
            })
            expect(result.content[0].text).toContain('please enter the path to the page to update')
        })
    })

    describe('handler - happy paths', () => {
        const mockCatalog = [
            {
                name: 'ProductTile',
                summary: 'Component for displaying product tiles.',
                snippet: `import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'

function MyComponent() {
  return (
    <ProductTile product={product} />
  )
}`
            },
            {
                name: 'Breadcrumb',
                summary: 'Component for breadcrumb navigation.',
                snippet: `import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'

function MyComponent() {
  return (
    <Breadcrumb categories={categories} />
  )
}`
            }
        ]

        it('should recommend components for a use case', async () => {
            loadComponentsCatalog.mockResolvedValue(mockCatalog)

            const result = await tool.handler({
                useCase: 'display product information'
            })

            expect(result.content[0].text).toContain('Given the following use case')
            expect(result.content[0].text).toContain('display product information')
            expect(result.content[0].text).toContain('ProductTile')
            expect(result.content[0].text).toContain('Breadcrumb')
        })

        it('should update page with selected components', async () => {
            const mockPageContent = `import React from 'react'

const TestPage = () => {
  return (
    <div>Test</div>
  )
}

export default TestPage`

            loadComponentsCatalog.mockResolvedValue(mockCatalog)
            fs.readFile.mockResolvedValue(mockPageContent)

            const result = await tool.handler({
                selectedComponents: ['ProductTile'],
                pagePath: '/test/page.jsx'
            })

            expect(result.content[0].text).toContain('Use the file edit tools')
            expect(result.content[0].text).toContain('/test/page.jsx')
            expect(result.content[0].text).toContain('import ProductTile')
        })
    })

    describe('handler - error paths', () => {
        it('should handle error when catalog not found', async () => {
            loadComponentsCatalog.mockRejectedValue(new Error('File not found'))

            const result = await tool.handler({
                useCase: 'test case'
            })

            expect(result.content[0].text).toContain('Failed to recommend components')
            expect(result.content[0].text).toContain('File not found')
        })

        it('should handle error when component not found in catalog', async () => {
            const mockCatalogSingle = [
                {
                    name: 'ProductTile',
                    summary: 'Component for product tiles.',
                    snippet: `import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'

function MyComponent() {
  return <ProductTile product={product} />
}`
                }
            ]

            loadComponentsCatalog.mockResolvedValue(mockCatalogSingle)
            fs.readFile.mockResolvedValue('const TestPage = () => {}')

            const result = await tool.handler({
                selectedComponents: ['NonExistent'],
                pagePath: '/test/page.jsx'
            })

            expect(result.content[0].text).toContain('Failed to recommend components')
        })
    })
})

describe('recommendComponentsForUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should throw error if catalog cannot be loaded', async () => {
        loadComponentsCatalog.mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(recommendComponentsForUseCase('test use case')).rejects.toThrow(
            'Failed to read component catalog'
        )
    })

    it('should handle catalog load errors gracefully', async () => {
        loadComponentsCatalog.mockRejectedValue(new Error('Parse error'))

        await expect(recommendComponentsForUseCase('test use case')).rejects.toThrow(
            'Failed to read component catalog'
        )
    })
})

describe('updatePageWithComponents', () => {
    const mockCatalog = [
        {
            name: 'ProductTile',
            summary: 'Component for displaying product tiles',
            snippet: `import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'

function MyComponent() {
  return (
    <ProductTile product={product} />
  )
}`
        },
        {
            name: 'Breadcrumb',
            summary: 'Component for breadcrumb navigation',
            snippet: `import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'

function MyComponent() {
  return (
    <Breadcrumb categories={categories} />
  )
}`
        },
        {
            name: 'AddressDisplay',
            summary: 'Component for displaying formatted address',
            snippet: `import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'

function MyComponent() {
  const address = {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St'
  }
  return <AddressDisplay address={address} />
}`
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

    it('should add component imports and usages to page', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        const result = await updatePageWithComponents(['ProductTile'], '/test/page.jsx')

        expect(result).toContain('import ProductTile')
        expect(result).toContain("from '@salesforce/retail-react-app/app/components/product-tile'")
        expect(result).toContain('ProductTile: Component for displaying product tiles')
        expect(result).toContain('ProductTile product={product}')
    })

    it('should add multiple components to page', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        const result = await updatePageWithComponents(
            ['ProductTile', 'Breadcrumb'],
            '/test/page.jsx'
        )

        expect(result).toContain('ProductTile')
        expect(result).toContain('Breadcrumb')
        expect(result).toContain('Component for displaying product tiles')
        expect(result).toContain('Component for breadcrumb navigation')
    })

    it('should handle components with JSX expressions', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        const result = await updatePageWithComponents(['AddressDisplay'], '/test/page.jsx')

        expect(result).toContain('import AddressDisplay')
        expect(result).toContain('<AddressDisplay address={address} />')
    })

    it('should throw error when component not found in catalog', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        await expect(updatePageWithComponents(['NonExistent'], '/test/page.jsx')).rejects.toThrow(
            'The following components were not found in the catalog: NonExistent'
        )
    })

    it('should throw error for multiple missing components', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        await expect(
            updatePageWithComponents(['NonExistent1', 'NonExistent2'], '/test/page.jsx')
        ).rejects.toThrow('NonExistent1, NonExistent2')
    })

    it('should throw error if page file cannot be read', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockRejectedValue(new Error('ENOENT: file not found'))

        await expect(updatePageWithComponents(['ProductTile'], '/test/page.jsx')).rejects.toThrow(
            'Failed to update page with components'
        )
    })

    it('should handle page with no existing imports gracefully', async () => {
        const pageWithNoImports = `const TestPage = () => {
  return <div>Test</div>
}

export default TestPage`

        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(pageWithNoImports)

        const result = await updatePageWithComponents(['Breadcrumb'], '/test/page.jsx')

        expect(result).toBeDefined()
        expect(result).toContain('Breadcrumb')
    })

    it('should handle page with arrow function component', async () => {
        const pageWithArrowFunction = `import React from 'react'

const TestPage = () => {
  return <div>Test</div>
}

export default TestPage`

        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(pageWithArrowFunction)

        const result = await updatePageWithComponents(['Breadcrumb'], '/test/page.jsx')

        expect(result).toBeDefined()
        expect(result).toContain('Breadcrumb categories={categories}')
    })

    it('should not duplicate imports', async () => {
        loadComponentsCatalog.mockResolvedValue(mockCatalog)
        fs.readFile.mockResolvedValue(mockPageContent)

        const result = await updatePageWithComponents(
            ['ProductTile', 'Breadcrumb'],
            '/test/page.jsx'
        )

        // Count occurrences of the same import
        const importCount = (result.match(/import ProductTile/g) || []).length
        expect(importCount).toBe(1)
    })
})
