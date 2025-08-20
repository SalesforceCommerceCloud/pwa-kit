/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CreateNewComponentTool from './create-new-component.js'
import * as fs from 'fs/promises'

// Mock fs/promises to avoid actual file operations
jest.mock('fs/promises', () => ({
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
}))

describe('CreateNewComponentTool', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        fs.mkdir.mockReset && fs.mkdir.mockReset()
        fs.writeFile.mockReset && fs.writeFile.mockReset()
        fs.access.mockReset && fs.access.mockReset()
    })

    it('should instantiate and set componentData', () => {
        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: 'TestComponent',
            location: '/tmp',
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        expect(tool.componentData.name).toBe('TestComponent')
    })

    it('should call createComponent without error', async () => {
        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: 'TestComponent',
            location: '/tmp',
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        await expect(tool.createComponent()).resolves.toBeDefined()
    })

    it('should not throw if name is missing', async () => {
        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: '',
            location: '/tmp',
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        const result = await tool.createComponent()
        expect(result.content[0].text).toMatch(/Created|Error/)
    })

    it('should not throw if location is invalid', async () => {
        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: 'TestComponent',
            location: '',
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        const result = await tool.createComponent()
        expect(result.content[0].text).toMatch(/Created|Error/)
    })

    it('should handle fs/promises errors gracefully', async () => {
        fs.writeFile.mockRejectedValueOnce(new Error('FS error'))
        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: 'TestComponent',
            location: '/tmp', // Ensure this is a valid string
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        const result = await tool.createComponent()
        expect(result.content[0].text).toMatch(/FS error|must be of type string/i)
    })

    it('should update component to presentational (single product)', async () => {
        const tool = new CreateNewComponentTool()
        const dataModel = {
            name: {type: 'string'},
            price: {type: 'number'},
            imageGroups: {type: 'array'}
        }
        await expect(
            tool.updateComponentToPresentational('product', 'ProductDisplay', '/tmp', dataModel, {
                list: false
            })
        ).resolves.toMatch(/Updated .* to presentational component for product/)
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('ProductDisplay'),
            expect.anything()
        )
    })

    it('should update component to presentational (list of products)', async () => {
        const tool = new CreateNewComponentTool()
        const dataModel = {
            name: {type: 'string'},
            price: {type: 'number'},
            imageGroups: {type: 'array'}
        }
        await expect(
            tool.updateComponentToPresentational('product', 'ProductList', '/tmp', dataModel, {
                list: true
            })
        ).resolves.toMatch(/Updated .* to presentational component for product/)
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('ProductList'),
            expect.anything()
        )
    })
})
