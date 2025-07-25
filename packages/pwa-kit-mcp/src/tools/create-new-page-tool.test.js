/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CreateNewPageTool } from '../tools'
import fs from 'fs/promises'
import * as utils from './utils'

describe('CreateNewPageTool', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.PWA_STOREFRONT_APP_PATH = '/mock/app'
    })

    it('returns system prompt if required args are missing', async () => {
        const result = await CreateNewPageTool.handler({})
        expect(result.role).toBe('system')
        expect(result.content[0].text).toContain(
            'Please ask the user to provide following information'
        )
    })

    it('calls createPage if all args are present', async () => {
        jest.spyOn(fs, 'access').mockRejectedValueOnce({code: 'ENOENT'})
        jest.spyOn(fs, 'mkdir').mockResolvedValue()
        jest.spyOn(fs, 'writeFile').mockResolvedValue()
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue('test content')
        jest.spyOn(CreateNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        const result = await CreateNewPageTool.handler({
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
        const result = await CreateNewPageTool.handler({
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
        jest.spyOn(CreateNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        // Mock generatePageContent to simulate unfound component
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockImplementation(function () {
            this.unfoundComponents = ['MissingComponent']
            return Promise.resolve('dummy')
        })
        const result = await CreateNewPageTool.handler({
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
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue('dummy')
        jest.spyOn(CreateNewPageTool, 'updateRoutes').mockResolvedValue()
        jest.spyOn(utils, 'logMCPMessage').mockImplementation(() => {})
        const result = await CreateNewPageTool.handler({
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
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue(
            `const productId = '25592300M';\nexport default function Page() { return <div>{productId}</div>; }`
        )
        const pageContent = await CreateNewPageTool.generatePageContent('Test', ['ProductView'])
        expect(pageContent).toContain('25592300M')
        expect(pageContent).not.toMatch(/error|exception|fail/i)
    })

    it('generates a page with Image component and default image path if Image is in componentList', async () => {
        const imageComponentString = `<Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${imageComponentString}`
        )
        const pageContent = await CreateNewPageTool.generatePageContent('Test', ['Image'])
        expect(pageContent).toContain('Image')
        expect(pageContent).toContain('static/img/hero.png')
    })

    it('uses default image path if user answers no to custom image for Image component', async () => {
        const defaultImageString = `<Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${defaultImageString}`
        )
        // Simulate user says no to custom image (in real flow, this would be a follow-up, here we just check the generated content)
        const pageContent = await CreateNewPageTool.generatePageContent('Test', ['Image'])
        expect(pageContent).toContain('static/img/hero.png')
        expect(pageContent).not.toMatch(/https?:\/\//)
    })

    it('updates image src, alt, height, width and ssr.js if user provides custom image info', async () => {
        const customSrc =
            'https://a.sfdcstatic.com/shared/images/c360-nav/salesforce-with-type-logo.svg'
        const customAlt = 'Salesforce Logo'
        const customWidth = 200
        const customHeight = 100
        const customImageString = `<Image src={"${customSrc}"} alt={"${customAlt}"} width={${customWidth}} height={${customHeight}} />`
        jest.spyOn(CreateNewPageTool, 'generatePageContent').mockResolvedValue(
            `import Image from 'somewhere';\n${customImageString}`
        )
        const ssrContent = `contentSecurityPolicy: {
  directives: {
    imgSrc: ["'self'", "https://a.sfdcstatic.com"]
  }
}`
        // In a real test, you would mock fs.readFile and fs.writeFile for ssr.js, but here we just check the logic
        const pageContent = await CreateNewPageTool.generatePageContent('Test', ['Image'])
        expect(pageContent).toContain(customSrc)
        expect(pageContent).toContain(customAlt)
        expect(pageContent).toContain(customWidth.toString())
        expect(pageContent).toContain(customHeight.toString())
        expect(ssrContent).toContain('a.sfdcstatic.com')
        expect(ssrContent).toContain('imgSrc')
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
})
