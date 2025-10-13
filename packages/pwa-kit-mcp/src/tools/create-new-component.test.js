/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CreateNewComponentTool from './create-new-component.js'

describe('CreateNewComponentTool', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should instantiate correctly', () => {
        const tool = new CreateNewComponentTool()
        expect(tool.name).toBe('pwakit_create_component')
        expect(tool.description).toBeTruthy()
        expect(tool.inputSchema).toBeTruthy()
        expect(tool.handler).toBeTruthy()
    })

    it('should call createComponent without error', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.createComponent('TestComponent', '/tmp', 'singleProduct')
        expect(result).toBeDefined()
        expect(result.content).toBeDefined()
        expect(result.content[0].type).toBe('text')
    })

    it('should not throw if name is missing', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.createComponent('', '/tmp', 'singleProduct')
        expect(result.content).toBeDefined()
        expect(result.content[0].text).toBeTruthy()
    })

    it('should not throw if location is invalid', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.createComponent('TestComponent', '', 'singleProduct')
        expect(result.content).toBeDefined()
        expect(result.content[0].text).toBeTruthy()
    })

    it('should handle fs/promises errors gracefully', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.createComponent('TestComponent', '/invalid/path', 'singleProduct')
        expect(result.content).toBeDefined()
        expect(result.content[0].text).toBeTruthy()
    })

    it('should update component to presentational (single product)', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.updateComponentToPresentational(
            'product',
            'ProductDisplay',
            '/tmp',
            {list: false}
        )
        expect(result.content).toBeDefined()
        expect(result.content[0].text).toBeTruthy()
        expect(result.content[0].text).toContain('ProductDisplay')
    })

    it('should update component to presentational (list of products)', async () => {
        const tool = new CreateNewComponentTool()
        const result = await tool.updateComponentToPresentational(
            'product',
            'ProductList',
            '/tmp',
            {list: true}
        )
        expect(result.content).toBeDefined()
        expect(result.content[0].text).toBeTruthy()
        expect(result.content[0].text).toContain('ProductList')
    })
})
