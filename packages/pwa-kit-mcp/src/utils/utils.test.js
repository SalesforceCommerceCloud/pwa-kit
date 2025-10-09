/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    EmptyJsonSchema,
    getCreateAppCommand,
    isMonoRepo,
    isBaseComponent,
    isSharedUIBaseComponent,
    isLocalComponent,
    isLocalSharedUIComponent,
    generateComponentImportStatement,
    loadConfig
} from './utils'
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

    describe('isBaseComponent', () => {
        const componentName = 'TestComponent'
        const mockNodeModulesPath = '/mock/node_modules'
        const baseComponentPath = path.join(
            mockNodeModulesPath,
            '@salesforce/retail-react-app/app/components',
            componentName
        )

        beforeEach(() => {
            jest.clearAllMocks()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('returns true if base component exists', () => {
            jest.spyOn(fs, 'existsSync').mockImplementation(
                (inputPath) => inputPath === baseComponentPath
            )
            expect(isBaseComponent(componentName, mockNodeModulesPath)).toBe(true)
        })

        test('returns false if base component does not exist', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            expect(isBaseComponent(componentName, mockNodeModulesPath)).toBe(false)
        })
    })

    describe('isSharedUIBaseComponent', () => {
        const componentName = 'SharedComponent'
        const mockNodeModulesPath = '/mock/node_modules'
        const sharedUIComponentPath = path.join(
            mockNodeModulesPath,
            '@salesforce/retail-react-app/app/components/shared/ui',
            componentName
        )

        beforeEach(() => {
            jest.clearAllMocks()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('returns true if shared UI base component exists', () => {
            jest.spyOn(fs, 'existsSync').mockImplementation(
                (inputPath) => inputPath === sharedUIComponentPath
            )
            expect(isSharedUIBaseComponent(componentName, mockNodeModulesPath)).toBe(true)
        })

        test('returns false if shared UI base component does not exist', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            expect(isSharedUIBaseComponent(componentName, mockNodeModulesPath)).toBe(false)
        })
    })

    describe('isLocalComponent', () => {
        const componentName = 'local-component'
        const mockComponentsPath = '/mock/app/components'
        const localComponentPath = path.join(mockComponentsPath, componentName)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('returns true if local component exists', () => {
            jest.spyOn(fs, 'existsSync').mockImplementation(
                (inputPath) => inputPath === localComponentPath
            )
            expect(isLocalComponent(componentName, mockComponentsPath)).toBe(true)
        })

        test('returns false if local component does not exist', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            expect(isLocalComponent(componentName, mockComponentsPath)).toBe(false)
        })
    })

    describe('isLocalSharedUIComponent', () => {
        const componentName = 'shared-component'
        const mockComponentsPath = '/mock/app/components'
        const localSharedUIComponentPath = path.join(
            mockComponentsPath,
            'shared',
            'ui',
            componentName
        )

        beforeEach(() => {
            jest.clearAllMocks()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('returns true if local shared UI component exists', () => {
            jest.spyOn(fs, 'existsSync').mockImplementation(
                (inputPath) => inputPath === localSharedUIComponentPath
            )
            expect(isLocalSharedUIComponent(componentName, mockComponentsPath)).toBe(true)
        })

        test('returns false if local shared UI component does not exist', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
            expect(isLocalSharedUIComponent(componentName, mockComponentsPath)).toBe(false)
        })
    })

    describe('generateComponentImportStatement', () => {
        const componentName = 'MyComponent'
        const componentDir = 'my-component'
        const absolutePaths = {
            componentsPath: '/mock/app/components',
            pagesPath: '/mock/app/pages'
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('returns base import statement when isBase is true and hasOverridesDir is false', () => {
            const result = generateComponentImportStatement(
                componentName,
                componentDir,
                false, // isLocal
                true, // isBase
                absolutePaths,
                false // hasOverridesDir
            )
            expect(result).toBe(
                "import MyComponent from '@salesforce/retail-react-app/app/components/my-component'"
            )
        })

        it('returns base import statement when isLocal is true and hasOverridesDir is false', () => {
            const result = generateComponentImportStatement(
                componentName,
                componentDir,
                true, // isLocal
                false, // isBase
                absolutePaths,
                false // hasOverridesDir
            )
            expect(result).toBe(
                "import MyComponent from '@salesforce/retail-react-app/app/components/my-component'"
            )
        })

        it('returns relative import statement when isLocal is true and hasOverridesDir is true', () => {
            const result = generateComponentImportStatement(
                componentName,
                componentDir,
                true, // isLocal
                false, // isBase
                absolutePaths,
                true // hasOverridesDir
            )
            expect(result).toBe("import MyComponent from '../../components/my-component'")
        })

        it('returns relative import statement when both isLocal and isBase are false', () => {
            const result = generateComponentImportStatement(
                componentName,
                componentDir,
                false, // isLocal
                false, // isBase
                absolutePaths,
                true // hasOverridesDir
            )
            expect(result).toBe("import MyComponent from '../../components/my-component'")
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

describe('loadConfig', () => {
    const originalEnv = {
        SFCC_HOSTNAME: process.env.SFCC_HOSTNAME,
        SFCC_INSTANCE_ID: process.env.SFCC_INSTANCE_ID,
        AM_CLIENT_ID: process.env.AM_CLIENT_ID,
        AM_CLIENT_SECRET: process.env.AM_CLIENT_SECRET,
        SFCC_ORG_ID: process.env.SFCC_ORG_ID,
        SFCC_SHORT_CODE: process.env.SFCC_SHORT_CODE,
        DW_JSON_PATH: process.env.DW_JSON_PATH
    }
    const originalGlobal = global.DW_JSON_PATH

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset environment variables
        Object.keys(originalEnv).forEach((key) => {
            delete process.env[key]
        })
        delete global.DW_JSON_PATH
        // Mock process.cwd to return a predictable path
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/current/directory')
    })

    afterEach(() => {
        // Restore environment variables
        Object.entries(originalEnv).forEach(([key, value]) => {
            if (value !== undefined) {
                process.env[key] = value
            } else {
                delete process.env[key]
            }
        })
        global.DW_JSON_PATH = originalGlobal
        jest.restoreAllMocks()
    })

    describe('when dw.json file exists', () => {
        const mockDwConfig = {
            hostname: 'https://test.dx.commercecloud.salesforce.com',
            'instance-id': 'test_instance',
            'client-id': 'test-client-id',
            'client-secret': 'test-client-secret',
            'org-id': 'test_org_id',
            'short-code': 'test123'
        }

        it('loads configuration from dw.json file when file exists', () => {
            global.DW_JSON_PATH = '/mock/current/directory/dw.json'
            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            expect(fs.existsSync).toHaveBeenCalledWith('/mock/current/directory/dw.json')
            expect(fs.readFileSync).toHaveBeenCalledWith('/mock/current/directory/dw.json', 'utf-8')
            expect(result).toEqual({
                hostname: 'https://test.dx.commercecloud.salesforce.com',
                instanceId: 'test_instance',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                organizationId: 'test_org_id',
                shortCode: 'test123'
            })
        })

        it('uses global.DW_JSON_PATH when set', () => {
            global.DW_JSON_PATH = '/global/path/dw.json'
            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            loadConfig()

            expect(fs.existsSync).toHaveBeenCalledWith('/global/path/dw.json')
        })

        it('handles malformed JSON gracefully', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json')
            jest.spyOn(console, 'error').mockImplementation()

            const result = loadConfig()

            expect(result).toEqual({
                hostname: undefined,
                instanceId: undefined,
                clientId: undefined,
                clientSecret: undefined,
                organizationId: undefined,
                shortCode: undefined
            })
        })

        it('prefers dw.json values over environment variables', () => {
            // Set environment variables
            process.env.SFCC_HOSTNAME = 'env-hostname'
            process.env.SFCC_INSTANCE_ID = 'env-instance'
            process.env.AM_CLIENT_ID = 'env-client-id'
            process.env.AM_CLIENT_SECRET = 'env-client-secret'
            process.env.SFCC_ORG_ID = 'env-org-id'
            process.env.SFCC_SHORT_CODE = 'env-short-code'

            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            // Should use dw.json values, not env values
            expect(result.hostname).toBe('https://test.dx.commercecloud.salesforce.com')
            expect(result.instanceId).toBe('test_instance')
            expect(result.clientId).toBe('test-client-id')
            expect(result.clientSecret).toBe('test-client-secret')
            expect(result.organizationId).toBe('test_org_id')
            expect(result.shortCode).toBe('test123')
        })
    })

    describe('when dw.json file does not exist', () => {
        it('falls back to environment variables', () => {
            global.DW_JSON_PATH = undefined
            process.env.SFCC_HOSTNAME = 'env-hostname'
            process.env.SFCC_INSTANCE_ID = 'env-instance'
            process.env.AM_CLIENT_ID = 'env-client-id'
            process.env.AM_CLIENT_SECRET = 'env-client-secret'
            process.env.SFCC_ORG_ID = 'env-org-id'
            process.env.SFCC_SHORT_CODE = 'env-short-code'

            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'env-hostname',
                instanceId: 'env-instance',
                clientId: 'env-client-id',
                clientSecret: 'env-client-secret',
                organizationId: 'env-org-id',
                shortCode: 'env-short-code'
            })
        })

        it('returns undefined values when no environment variables are set', () => {
            global.DW_JSON_PATH = undefined
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: undefined,
                instanceId: undefined,
                clientId: undefined,
                clientSecret: undefined,
                organizationId: undefined,
                shortCode: undefined
            })
        })
    })

    describe('mixed configuration scenarios', () => {
        it('handles partial dw.json with missing environment variables', () => {
            global.DW_JSON_PATH = '/mock/current/directory/dw.json'
            const partialDwConfig = {
                hostname: 'https://partial.dx.commercecloud.salesforce.com',
                'instance-id': 'partial_instance'
                // Missing other fields
            }

            process.env.AM_CLIENT_ID = 'env-client-id'
            process.env.AM_CLIENT_SECRET = 'env-client-secret'

            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(partialDwConfig))

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://partial.dx.commercecloud.salesforce.com',
                instanceId: 'partial_instance',
                clientId: 'env-client-id',
                clientSecret: 'env-client-secret',
                organizationId: undefined,
                shortCode: undefined
            })
        })
    })
})
