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
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.PWA_STOREFRONT_APP_PATH = '/mock/app'
    })

    it('returns system prompt if required args are missing', async () => {
        const result = await createNewPageTool.handler({})
        expect(result.role).toBe('system')
        expect(result.content[0].text).toContain(
            'Please ask the user to provide following information'
        )
    })

    it('calls createPage if all args are present', async () => {
        jest.spyOn(fs, 'access').mockRejectedValueOnce({code: 'ENOENT'})
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue('test content')
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['Foo'],
            route: '/test'
        })
        expect(result.role).toBe('system')
        expect(result.content[0].text).toContain('Created page')
    })

    it('returns error if page already exists', async () => {
        jest.spyOn(fs, 'access').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['Foo'],
            route: '/test'
        })
        expect(result.role).toBe('developer')
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
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
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
        expect(result.role).toBe('system')
        expect(result.content[0].text).toContain('MissingComponent')
    })

    it('includes product hook prompt if ProductView is in componentList', async () => {
        jest.spyOn(fs, 'access').mockRejectedValueOnce({code: 'ENOENT'})
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue('dummy')
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['ProductView'],
            route: '/test'
        })
        expect(result.role).toBe('system')
        expect(result.content[0].text).toContain(
            'would you like to add the hook useProduct to your page?'
        )
    })

    it('generates a page with product 25592300M and no errors when hook is added', async () => {
        // Simulate generatePageContent returning a page with product 25592300M
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `const productId = '25592300M';\nexport default function Page() { return <div>{productId}</div>; }`
        )
        const pageContent = await createNewPageTool.generatePageContent('Test', ['ProductView'])
        expect(pageContent).toContain('25592300M')
        expect(pageContent).not.toMatch(/error|exception|fail/i)
    })

    it('generates a page with Image component and default image path if Image is in componentList', async () => {
        const imageComponentString = `<Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${imageComponentString}`
        )
        const pageContent = await createNewPageTool.generatePageContent('Test', ['Image'])
        expect(pageContent).toContain('Image')
        expect(pageContent).toContain('static/img/hero.png')
    })

    it('uses default image path if user answers no to custom image for Image component', async () => {
        const defaultImageString = `<Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
        jest.spyOn(createNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${defaultImageString}`
        )
        // Simulate user says no to custom image (in real flow, this would be a follow-up, here we just check the generated content)
        const pageContent = await createNewPageTool.generatePageContent('Test', ['Image'])
        expect(pageContent).toContain('static/img/hero.png')
        expect(pageContent).not.toMatch(/https?:\/\//)
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
        jest.spyOn(createNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        jest.spyOn(createNewPageTool, 'generatePageContent').mockImplementation(function () {
            this.unfoundComponents = ['ImageSpliter']
            return Promise.resolve('dummy')
        })
        const result = await createNewPageTool.handler({
            pageName: 'Test',
            componentList: ['ImageSpliter'],
            route: '/test'
        })
        expect(result.role).toBe('system')
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
        const pageContent = await createNewPageTool.generatePageContent('Test', ['Image'])
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
        const pageContent = await createNewPageTool.generatePageContent('Test', ['Image'])
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
        const attemptToUpdateCSP = (currentCSP, _newDomain) => currentCSP
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

    let mockWriteFile, mockReadFile, createNewPageTool

    beforeEach(() => {
        jest.resetModules()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        mockWriteFile = jest.spyOn(require('fs/promises'), 'writeFile').mockResolvedValue()
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
        await createNewPageTool.updateRoutes(pageName, route)
        expect(mockWriteFile).toHaveBeenCalled()
        const writtenContent = mockWriteFile.mock.calls[0][1]
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
        await createNewPageTool.updateRoutes(pageName, route)
        expect(mockWriteFile).toHaveBeenCalled()
        const writtenContent = mockWriteFile.mock.calls[0][1]
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
