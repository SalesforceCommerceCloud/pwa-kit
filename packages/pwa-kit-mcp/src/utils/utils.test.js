/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EmptyJsonSchema, getCreateAppCommand, isMonoRepo} from './utils'
import fs from 'fs'
import path from 'path'

describe('Utils', () => {
    describe('EmptyJsonSchema', () => {
        it('should be a valid JSON schema', () => {
            expect(EmptyJsonSchema).toEqual({
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {},
                additionalProperties: false
            })
        })

        it('should have required JSON schema properties', () => {
            expect(EmptyJsonSchema).toHaveProperty('type', 'object')
            expect(EmptyJsonSchema).toHaveProperty('properties')
            expect(EmptyJsonSchema).toHaveProperty('additionalProperties', false)
        })

        it('should not allow additional properties', () => {
            expect(EmptyJsonSchema.additionalProperties).toBe(false)
            expect(EmptyJsonSchema.properties).toEqual({})
        })
    })

    describe('isMonoRepo', () => {
        const originalEnv = process.env.WORKSPACE_FOLDER_PATHS
        const mockPath = '/mock/root'

        beforeEach(() => {
            jest.clearAllMocks()
            process.env.WORKSPACE_FOLDER_PATHS = mockPath
        })

        afterEach(() => {
            process.env.WORKSPACE_FOLDER_PATHS = originalEnv
            jest.restoreAllMocks()
        })

        test('returns true if lerna.json exists', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
            expect(isMonoRepo()).toBe(true)
        })

        test('returns false if lerna.json does not exist', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            expect(isMonoRepo()).toBe(false)
        })
    })

    describe('getCreateAppCommand', () => {
        const originalEnv = process.env.WORKSPACE_FOLDER_PATHS
        const mockPath = '/mock/root'
        const mockScriptPath = `${mockPath}/packages/pwa-kit-create-app/scripts/create-mobify-app.js`
        const CREATE_APP_VERSION = 'latest'

        beforeEach(() => {
            jest.clearAllMocks()
            process.env.WORKSPACE_FOLDER_PATHS = mockPath
        })

        afterEach(() => {
            process.env.WORKSPACE_FOLDER_PATHS = originalEnv
            jest.restoreAllMocks()
        })

        test('returns local script path if monorepo', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
            const result = getCreateAppCommand()
            expect(result).toBe(path.resolve(mockScriptPath))
        })

        test('returns npm package with version if not monorepo', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            const result = getCreateAppCommand()
            expect(result).toBe(`@salesforce/pwa-kit-create-app@${CREATE_APP_VERSION}`)
        })
    })
})

describe('logMCPMessage', () => {
    const logFilePath = path.join(__dirname, 'mcp-debug.log')
    const testMessage = 'Test log message'

    beforeEach(async () => {
        process.env.DEBUG = '1'
        // Remove log file if it exists
        try {
            await fs.promises.unlink(logFilePath)
        } catch (e) {
            // File does not exist, nothing to clean up
        }
    })

    afterEach(async () => {
        // Clean up log file
        try {
            await fs.promises.unlink(logFilePath)
        } catch (e) {
            // File does not exist, nothing to clean up
        }
        delete process.env.DEBUG
    })

    it('writes a log message to mcp-debug.log when DEBUG is set', async () => {
        const {logMCPMessage} = await import('./utils')
        await logMCPMessage(testMessage)
        const content = await fs.promises.readFile(logFilePath, 'utf8')
        expect(content).toContain(testMessage)
    })

    it('does not write log if DEBUG is not set', async () => {
        delete process.env.DEBUG
        const {logMCPMessage} = await import('./utils')
        await logMCPMessage('Should not log')
        let exists = true
        try {
            await fs.promises.access(logFilePath)
        } catch {
            exists = false
        }
        expect(exists).toBe(false)
    })
})
