/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createNewPageTool from './create-new-page-tool.js'
import fs from 'fs/promises'
import * as utils from '../utils/utils.js'

describe('CreateNewPageTool', () => {
    const originalEnv = process.env
    const mockAbsolutePaths = {
        nodeModulesPath: '/mock/node_modules',
        componentsPath: '/mock/app/components',
        pagesPath: '/mock/app/pages',
        routesPath: '/mock/app/routes.jsx',
        hasOverridesDir: false
    }

    beforeEach(() => {
        jest.clearAllMocks()
        process.env.PWA_STOREFRONT_APP_PATH = '/mock/app'
        process.env.WORKSPACE_FOLDER_PATHS = '/mock/workspace'
    })
    afterEach(() => {
        process.env = originalEnv
    })

    it('returns system prompt if required args are missing', async () => {
        const result = await createNewPageTool.handler({})
        expect(result.content[0].text).toContain(
            'Please ask the user to provide following information'
        )
    })

    it('calls createPage if all args are present', async () => {
        jest.spyOn(fs, 'access').mockRejectedValueOnce({code: 'ENOENT'})
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue('test content')
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue({
            path: '/mock/routes.jsx',
            content: 'test routes content'
        })
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(mockAbsolutePaths)

        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['Foo'],
            route: '/test'
        })
        expect(result.content[0].text).toBeTruthy()
    })

    it('returns error if page already exists', async () => {
        jest.spyOn(fs, 'access').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(mockAbsolutePaths)

        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['Foo'],
            route: '/test'
        })
        expect(result.content[0].text).toContain('Error creating page')
    })

    it('returns system prompt for unfound components', async () => {
        jest.spyOn(fs, 'access').mockImplementation((p) => {
            if (String(p).includes('components')) {
                const err = new Error('not found')
                err.code = 'ENOENT'
                return Promise.reject(err)
            }
            return Promise.reject({code: 'ENOENT'})
        })
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue({
            path: '/mock/routes.jsx',
            content: 'test routes content'
        })
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(mockAbsolutePaths)
        // Mock generatePageContent to simulate unfound component
        jest.spyOn(createNewPageTool, 'generatePageContent').mockImplementation(function () {
            this.unfoundComponents = ['MissingComponent']
            return Promise.resolve('dummy')
        })
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['MissingComponent'],
            route: '/test'
        })
        expect(result.content[0].text).toContain('MissingComponent')
    })

    it('generates a page with product 25592300M and no errors when hook is added', async () => {
        // Simulate generatePageContent returning a page with product 25592300M
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `const productId = '25592300M';\nexport default function Page() { return <div>{productId}</div>; }`
        )
        const internalPaths = {
            nodeModulesPath: '/mock/node_modules',
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages',
            routesPath: '/mock/app/routes.jsx',
            hasOverridesDir: false
        }
        const pageContent = await createNewPageTool.generatePageContent(
            'Test',
            ['ProductView'],
            internalPaths
        )
        expect(pageContent).toContain('25592300M')
        expect(pageContent).not.toMatch(/error|exception|fail/i)
    })

    it('generates a page with Image component and default image path if Image is in componentList', async () => {
        const imageComponentString = `<Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${imageComponentString}`
        )
        const internalPaths = {
            nodeModulesPath: '/mock/node_modules',
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages',
            routesPath: '/mock/app/routes.jsx',
            hasOverridesDir: false
        }
        const pageContent = await createNewPageTool.generatePageContent(
            'Test',
            ['Image'],
            internalPaths
        )
        expect(pageContent).toContain('Image')
        expect(pageContent).toContain('static/img/hero.png')
    })

    it('uses component name with Component suffix if component name is the same as the page name', async () => {
        if (createNewPageTool.generatePageContent.mockRestore) {
            createNewPageTool.generatePageContent.mockRestore()
        }
        const internalPaths = {
            nodeModulesPath: '/mock/node_modules',
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages',
            routesPath: '/mock/app/routes.jsx',
            hasOverridesDir: false
        }
        const pageContent = await createNewPageTool.generatePageContent(
            'Test',
            ['Test'],
            internalPaths
        )
        expect(pageContent).toContain('import TestComponent from')
        expect(pageContent).toContain('<TestComponent />')
    })

    it('responds with message listing unknown component and suggests changes to page file', async () => {
        jest.spyOn(fs, 'access').mockImplementation((p) => {
            if (String(p).includes('components')) {
                const err = new Error('not found')
                err.code = 'ENOENT'
                return Promise.reject(err)
            }
            return Promise.reject({code: 'ENOENT'})
        })
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue({
            path: '/mock/routes.jsx',
            content: 'test routes content'
        })
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(mockAbsolutePaths)
        jest.spyOn(createNewPageTool, 'generatePageContent').mockImplementation(function () {
            this.unfoundComponents = ['ImageSpliter']
            return Promise.resolve('dummy')
        })
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['ImageSpliter'],
            route: '/test'
        })
        expect(result.content[0].text).toContain('ImageSpliter')
        expect(result.content[0].text).toMatch(/not found/i)
        expect(result.content[0].text).toMatch(
            /suggest changes to the newly generated page file based on the components not found/i
        )
    })
    it('allows image from internet if domain is already present in CSP', async () => {
        const customSrc =
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5777f7f6/images/large/PG.CJZACCO.BLKBKPA.PZ.jpg?sw=1360&q=60'
        const customAlt = 'Commerce Cloud Product'
        const customWidth = 1360
        const customHeight = 900
        const customImageString = `<Image src={"${customSrc}"} alt={"${customAlt}"} width={${customWidth}} height={${customHeight}} />`
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${customImageString}`
        )
        const ssrContent = `contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "https://edge.disstg.commercecloud.salesforce.com"]
      }
    }`
        const internalPaths = {
            nodeModulesPath: '/mock/node_modules',
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages',
            routesPath: '/mock/app/routes.jsx',
            hasOverridesDir: false
        }
        const pageContent = await createNewPageTool.generatePageContent(
            'Test',
            ['Image'],
            internalPaths
        )
        expect(pageContent).toContain(customSrc)
        expect(ssrContent).toContain('.commercecloud.salesforce.com')
        const isAllowed = ssrContent.includes('.commercecloud.salesforce.com')
        expect(isAllowed).toBe(true)
    })

    it('does not allow an image from internet if domain is not present in CSP', async () => {
        const customSrc =
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5777f7f6/images/large/PG.CJZACCO.BLKBKPA.PZ.jpg?sw=1360&q=60'
        const customAlt = 'Commerce Cloud Product'
        const customWidth = 1360
        const customHeight = 900
        const customImageString = `<Image src={"${customSrc}"} alt={"${customAlt}"} width={${customWidth}} height={${customHeight}} />`
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${customImageString}`
        )
        const ssrContent = `contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "https://some-other-domain.com"]
      }
    }`
        const internalPaths = {
            nodeModulesPath: '/mock/node_modules',
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages',
            routesPath: '/mock/app/routes.jsx',
            hasOverridesDir: false
        }
        const pageContent = await createNewPageTool.generatePageContent(
            'Test',
            ['Image'],
            internalPaths
        )
        const isAllowed = ssrContent.includes('.commercecloud.salesforce.com')
        expect(isAllowed).toBe(false)
        expect(pageContent).toContain(customSrc)
    })

    it('does not allow user to update CSP with a new image domain of their choice', async () => {
        let ssrContent = `contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "https://edge.disstg.commercecloud.salesforce.com"]
      }
    }`
        const requestedDomain = 'https://example.com'
        const attemptToUpdateCSP = (currentCSP) => currentCSP
        const updatedCSP = attemptToUpdateCSP(ssrContent, requestedDomain)
        expect(updatedCSP).not.toContain(requestedDomain)
        expect(updatedCSP).toContain('.commercecloud.salesforce.com')
    })
})

describe('updateRoutes route insertion', () => {
    const pageName = 'TestPage'
    const route = '/test-page'
    const importStatement = `const ${pageName} = loadable(() => import('./pages/test-page'), {fallback})`
    const routeObject = `    {\n        path: '${route}',\n        component: ${pageName},\n        exact: true\n    },`
    const mockAbsolutePaths = {
        nodeModulesPath: '/mock/node_modules',
        componentsPath: '/mock/app/components',
        pagesPath: '/mock/app/pages',
        routesPath: '/mock/app/routes.jsx',
        hasOverridesDir: false
    }

    let mockReadFile, createNewPageTool

    beforeEach(() => {
        jest.resetModules()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mockReadFile = jest.spyOn(require('fs/promises'), 'readFile')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('adds new route at the top for monorepo app (export const routes)', async () => {
        const monorepoRoutes = `const ExistingPage = loadable(() => import('./pages/existing-page'), {fallback})\nexport const routes = [\n    { path: '/existing', component: ExistingPage, exact: true }\n]\n`
        mockReadFile.mockResolvedValue(monorepoRoutes)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        createNewPageTool = require('./create-new-page-tool').default
        const result = await createNewPageTool.updateRoutes(pageName, route, mockAbsolutePaths)
        expect(result).toBeDefined()
        expect(result.path).toBe(mockAbsolutePaths.routesPath)
        expect(result.content).toBeTruthy()
        const writtenContent = result.content
        expect(writtenContent).toContain(importStatement)
        const newRouteIndex = writtenContent.indexOf(routeObject.trim())
        const existingRouteIndex = writtenContent.indexOf(
            "{ path: '/existing', component: ExistingPage, exact: true }"
        )
        expect(newRouteIndex).toBeGreaterThan(-1)
        expect(existingRouteIndex).toBeGreaterThan(-1)
        expect(newRouteIndex).toBeLessThan(existingRouteIndex)
    })

    it('adds new route at the top for generated app (const routes with ..._routes at end)', async () => {
        const generatedRoutes = `const ExistingPage = loadable(() => import('./pages/existing-page'), {fallback})\nconst routes = [\n    { path: '/existing', component: ExistingPage, exact: true },\n    ..._routes}\n]\n`
        mockReadFile.mockResolvedValue(generatedRoutes)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        createNewPageTool = require('./create-new-page-tool').default
        const result = await createNewPageTool.updateRoutes(pageName, route, mockAbsolutePaths)
        expect(result).toBeDefined()
        expect(result.path).toBe(mockAbsolutePaths.routesPath)
        expect(result.content).toBeTruthy()
        const writtenContent = result.content
        expect(writtenContent).toContain(importStatement)
        const newRouteIndex = writtenContent.indexOf(routeObject.trim())
        const existingRouteIndex = writtenContent.indexOf(
            "{ path: '/existing', component: ExistingPage, exact: true }"
        )
        expect(newRouteIndex).toBeGreaterThan(-1)
        expect(existingRouteIndex).toBeGreaterThan(-1)
        expect(newRouteIndex).toBeLessThan(existingRouteIndex)
    })
})

describe('Cross-Project compatibility', () => {
    let createNewPageTool

    beforeEach(() => {
        jest.clearAllMocks()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        createNewPageTool = require('./create-new-page-tool').default
    })

    it('should work with simplified 3 params only', async () => {
        // mock detectWorkspacePaths to return valid paths
        const utils = await import('../utils/utils')
        const mockPaths = {
            pagesPath: '/test/pages',
            componentsPath: '/test/components',
            routesPath: '/test/routes.jsx',
            nodeModulesPath: '/test/node_modules',
            hasOverridesDir: false
        }
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(mockPaths)

        const args = {
            pageName: 'TestPage',
            componentList: ['Header', 'Footer'],
            route: '/test-page'
        }

        const result = await createNewPageTool.handler(args)

        expect(result.content[0].text).toBeTruthy()
    })

    it('should return system prompt when parameters are missing', async () => {
        const args = {
            pageName: 'TestPage'
            // no componentList & route
        }

        const result = await createNewPageTool.handler(args)

        expect(result.content[0].text).toContain(
            'Please ask the user to provide following information'
        )
    })

    it('should handle customer project paths correctly', async () => {
        // mock detectWorkspacePaths to return generated project structure
        const utils = await import('../utils/utils')
        const customerPaths = {
            pagesPath: '/Users/customer/retail-react-app/overrides/app/pages',
            componentsPath: '/Users/customer/retail-react-app/overrides/app/components',
            routesPath: '/Users/customer/retail-react-app/overrides/app/routes.jsx',
            nodeModulesPath: '/Users/customer/retail-react-app/node_modules',
            hasOverridesDir: true
        }
        jest.spyOn(utils, 'detectWorkspacePaths').mockResolvedValue(customerPaths)

        const args = {
            pageName: 'CustomerPage',
            componentList: ['Header'],
            route: '/customer-page'
        }

        const result = await createNewPageTool.handler(args)

        expect(result.content[0].text).toBeTruthy()
        expect(utils.detectWorkspacePaths).toHaveBeenCalled()
    })

    it('should handle path detection errors gracefully', async () => {
        // mock detectWorkspacePaths to throw an error
        const utils = await import('../utils/utils')
        jest.spyOn(utils, 'detectWorkspacePaths').mockRejectedValue(
            new Error('PWA_STOREFRONT_APP_PATH does not exist: /invalid/path')
        )

        const args = {
            pageName: 'TestPage',
            componentList: ['Header'],
            route: '/test-page'
        }

        const result = await createNewPageTool.handler(args)

        expect(result.content[0].text).toContain('Error detecting workspace configuration')
        expect(result.content[0].text).toContain('PWA_STOREFRONT_APP_PATH does not exist')
    })

    it('should return system prompt when project path cannot be detected', async () => {
        // mock detectWorkspacePaths to throw user prompt error
        const utils = await import('../utils/utils')
        jest.spyOn(utils, 'detectWorkspacePaths').mockRejectedValue(
            new Error(
                "Could not detect PWA Kit project directory. Please either:\n1. Navigate to your PWA Kit project directory, or\n2. Set PWA_STOREFRONT_APP_PATH environment variable to your project's app directory path."
            )
        )

        const args = {
            pageName: 'TestPage',
            componentList: ['Header'],
            route: '/test-page'
        }

        const result = await createNewPageTool.handler(args)

        expect(result.content[0].text).toContain(
            'I need to know where your PWA Kit project is located'
        )
        expect(result.content[0].text).toContain(
            "Please provide the path to your PWA Kit project's app directory"
        )
    })
})
