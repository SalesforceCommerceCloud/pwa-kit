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
    findDwJsonPath,
    loadConfig,
    getOAuthToken,
    callCustomApiDxEndpoint
} from './utils'
import fs from 'fs'
import path from 'path'

describe('Utils', () => {
    describe('EmptyJsonSchema', () => {
        it('should be a valid JSON schema', () => {
            expect(EmptyJsonSchema).toEqual({
                $schema: 'https://json-schema.org/draft/2020-12/schema',
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

describe('findDwJsonPath', () => {
    const originalEnv = process.env.PWA_STOREFRONT_APP_PATH
    const originalGlobal = global.DW_JSON_PATH

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset environment variables
        delete process.env.PWA_STOREFRONT_APP_PATH
        delete global.DW_JSON_PATH
        // Mock process.cwd to return a predictable path
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/current/directory')
    })

    afterEach(() => {
        // Restore environment variables
        if (originalEnv) {
            process.env.PWA_STOREFRONT_APP_PATH = originalEnv
        } else {
            delete process.env.PWA_STOREFRONT_APP_PATH
        }
        global.DW_JSON_PATH = originalGlobal
        jest.restoreAllMocks()
    })

    describe('priority order', () => {
        it('returns global DW_JSON_PATH when available', () => {
            global.DW_JSON_PATH = '/mock/global/dw.json'
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === '/mock/global/dw.json'
            })

            const result = findDwJsonPath()

            expect(result).toBe('/mock/global/dw.json')
            expect(fs.existsSync).toHaveBeenCalledWith('/mock/global/dw.json')
        })

        it('returns PWA_STOREFRONT_APP_PATH/dw.json when global path is not available', () => {
            process.env.PWA_STOREFRONT_APP_PATH = '/mock/storefront/path'
            const expectedPath = path.join('/mock/storefront/path', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })

            const result = findDwJsonPath()

            expect(result).toBe(expectedPath)
            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
        })

        it('returns PWA_STOREFRONT_APP_PATH/../dw.json when storefront path is not available', () => {
            process.env.PWA_STOREFRONT_APP_PATH = '/mock/storefront/path'
            const expectedPath = path.join('/mock/storefront/path', '..', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })

            const result = findDwJsonPath()

            expect(result).toBe(expectedPath)
            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
        })

        it('returns PWA_STOREFRONT_APP_PATH/../../dw.json when parent path is not available', () => {
            process.env.PWA_STOREFRONT_APP_PATH = '/mock/storefront/path'
            const expectedPath = path.join('/mock/storefront/path', '..', '..', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })

            const result = findDwJsonPath()

            expect(result).toBe(expectedPath)
            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
        })

        it('returns current working directory dw.json when storefront paths are not available', () => {
            const expectedPath = path.join('/mock/current/directory', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })

            const result = findDwJsonPath()

            expect(result).toBe(expectedPath)
            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
        })

        it('returns null when no dw.json file is found', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = findDwJsonPath()

            expect(result).toBeNull()
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
        SFCC_CLIENT_ID: process.env.SFCC_CLIENT_ID,
        SFCC_CLIENT_SECRET: process.env.SFCC_CLIENT_SECRET,
        SFCC_ORG_ID: process.env.SFCC_ORG_ID,
        SFCC_SHORT_CODE: process.env.SFCC_SHORT_CODE,
        PWA_STOREFRONT_APP_PATH: process.env.PWA_STOREFRONT_APP_PATH
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

        it('loads configuration from dw.json file when file exists in current directory', () => {
            const expectedPath = path.join('/mock/current/directory', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
            expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf-8')
            expect(result).toEqual({
                hostname: 'https://test.dx.commercecloud.salesforce.com',
                instanceId: 'test_instance',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                organizationId: 'test_org_id',
                shortCode: 'test123'
            })
        })

        it('loads configuration from PWA_STOREFRONT_APP_PATH when available', () => {
            process.env.PWA_STOREFRONT_APP_PATH = '/mock/storefront/path'
            const expectedPath = path.join('/mock/storefront/path', 'dw.json')
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === expectedPath
            })
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
            expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf-8')
            expect(result).toEqual({
                hostname: 'https://test.dx.commercecloud.salesforce.com',
                instanceId: 'test_instance',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                organizationId: 'test_org_id',
                shortCode: 'test123'
            })
        })

        it('loads configuration from global DW_JSON_PATH when available', () => {
            global.DW_JSON_PATH = '/mock/global/dw.json'
            jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
                return path === '/mock/global/dw.json'
            })
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            expect(fs.existsSync).toHaveBeenCalledWith('/mock/global/dw.json')
            expect(fs.readFileSync).toHaveBeenCalledWith('/mock/global/dw.json', 'utf-8')
            expect(result).toEqual({
                hostname: 'https://test.dx.commercecloud.salesforce.com',
                instanceId: 'test_instance',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                organizationId: 'test_org_id',
                shortCode: 'test123'
            })
        })

        it('handles malformed JSON gracefully', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json')
            jest.spyOn(console, 'error').mockImplementation()

            const result = loadConfig()

            expect(result).toEqual({
                hostname: undefined,
                instanceId: null,
                clientId: undefined,
                clientSecret: undefined,
                organizationId: null,
                shortCode: undefined
            })
        })

        it('prefers environment variables over dw.json values', () => {
            // Set environment variables
            process.env.SFCC_HOSTNAME = 'env-hostname'
            process.env.SFCC_INSTANCE_ID = 'env-instance'
            process.env.SFCC_CLIENT_ID = 'env-client-id'
            process.env.SFCC_CLIENT_SECRET = 'env-client-secret'
            process.env.SFCC_ORG_ID = 'env-org-id'
            process.env.SFCC_SHORT_CODE = 'env-short-code'

            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockDwConfig))

            const result = loadConfig()

            // Should use environment values, not dw.json values
            expect(result.hostname).toBe('env-hostname')
            expect(result.instanceId).toBe('env-instance')
            expect(result.clientId).toBe('env-client-id')
            expect(result.clientSecret).toBe('env-client-secret')
            expect(result.organizationId).toBe('env-org-id')
            expect(result.shortCode).toBe('env-short-code')
        })
    })

    describe('when dw.json file does not exist', () => {
        it('falls back to environment variables', () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            process.env.SFCC_HOSTNAME = 'env-hostname'
            process.env.SFCC_INSTANCE_ID = 'env-instance'
            process.env.SFCC_CLIENT_ID = 'env-client-id'
            process.env.SFCC_CLIENT_SECRET = 'env-client-secret'
            process.env.SFCC_ORG_ID = 'env-org-id'
            process.env.SFCC_SHORT_CODE = 'env-short-code'

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
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: undefined,
                instanceId: null,
                clientId: undefined,
                clientSecret: undefined,
                organizationId: null,
                shortCode: undefined
            })
        })
    })

    describe('mixed configuration scenarios', () => {
        it('handles partial dw.json with missing environment variables', () => {
            const partialDwConfig = {
                hostname: 'https://partial.dx.commercecloud.salesforce.com',
                'instance-id': 'partial_instance'
                // Missing other fields
            }

            process.env.SFCC_CLIENT_ID = 'env-client-id'
            process.env.SFCC_CLIENT_SECRET = 'env-client-secret'

            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(partialDwConfig))

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://partial.dx.commercecloud.salesforce.com',
                instanceId: 'partial_instance',
                clientId: 'env-client-id',
                clientSecret: 'env-client-secret',
                organizationId: 'f_ecom_partial',
                shortCode: undefined
            })
        })
    })

    describe('hostname derivation', () => {
        it('derives instanceId and organizationId from hostname when not provided', () => {
            process.env.SFCC_HOSTNAME = 'https://zzrf-001.dx.commercecloud.salesforce.com'
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://zzrf-001.dx.commercecloud.salesforce.com',
                instanceId: 'zzrf_001',
                clientId: undefined,
                clientSecret: undefined,
                organizationId: 'f_ecom_zzrf_001',
                shortCode: undefined
            })
        })

        it('derives instanceId and organizationId from dw.json hostname when not provided', () => {
            const dwConfig = {
                hostname: 'https://test-123.dx.commercecloud.salesforce.com'
            }

            jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(dwConfig))

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://test-123.dx.commercecloud.salesforce.com',
                instanceId: 'test_123',
                clientId: undefined,
                clientSecret: undefined,
                organizationId: 'f_ecom_test_123',
                shortCode: undefined
            })
        })

        it('does not derive values from invalid hostname format', () => {
            process.env.SFCC_HOSTNAME = 'https://invalid-hostname.com'
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://invalid-hostname.com',
                instanceId: null,
                clientId: undefined,
                clientSecret: undefined,
                organizationId: null,
                shortCode: undefined
            })
        })

        it('prefers explicit values over derived values', () => {
            process.env.SFCC_HOSTNAME = 'https://zzrf-001.dx.commercecloud.salesforce.com'
            process.env.SFCC_INSTANCE_ID = 'explicit-instance'
            process.env.SFCC_ORG_ID = 'explicit-org'
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            const result = loadConfig()

            expect(result).toEqual({
                hostname: 'https://zzrf-001.dx.commercecloud.salesforce.com',
                instanceId: 'explicit-instance',
                clientId: undefined,
                clientSecret: undefined,
                organizationId: 'explicit-org',
                shortCode: undefined
            })
        })
    })
})

describe('getOAuthToken', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('should successfully obtain OAuth token', async () => {
        const mockTokenResponse = {
            access_token: 'mock_access_token',
            token_type: 'Bearer',
            expires_in: 3600
        }

        const mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockTokenResponse)
        }

        global.fetch.mockResolvedValueOnce(mockResponse)

        const result = await getOAuthToken('test_client_id', 'test_client_secret', 'test_scope')

        expect(global.fetch).toHaveBeenCalledWith(
            'https://account.demandware.com/dwsso/oauth2/access_token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:
                        'Basic ' +
                        Buffer.from('test_client_id:test_client_secret').toString('base64')
                },
                body: 'grant_type=client_credentials&scope=test_scope'
            }
        )
        expect(result).toEqual(mockResponse)
    })
})

describe('callCustomApiDxEndpoint', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('should successfully call custom API DX endpoint', async () => {
        const mockApiResponse = {
            endpoints: [
                {
                    id: 'endpoint1',
                    name: 'Test Endpoint',
                    url: '/api/test'
                }
            ]
        }

        const mockResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockApiResponse)
        }

        global.fetch.mockResolvedValueOnce(mockResponse)

        const result = await callCustomApiDxEndpoint(
            'mock_access_token',
            'test.dx.commercecloud.salesforce.com',
            'test_org_id'
        )

        expect(global.fetch).toHaveBeenCalledWith(
            'https://test.dx.commercecloud.salesforce.com/dx/custom-apis/v1/organizations/test_org_id/endpoints',
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer mock_access_token',
                    'Content-Type': 'application/json'
                }
            }
        )
        expect(result).toEqual(mockResponse)
    })
})

describe('detectWorkspacePaths', () => {
    const originalEnv = process.env.PWA_STOREFRONT_APP_PATH
    const tempApp = path.join(__dirname, 'temp-app')

    function setupAppDir(appDir) {
        fs.mkdirSync(path.join(appDir, 'pages'), {recursive: true})
        fs.mkdirSync(path.join(appDir, 'components'), {recursive: true})
        fs.writeFileSync(path.join(appDir, 'routes.jsx'), 'export const routes = []')
    }

    beforeEach(() => {
        fs.rmSync(tempApp, {recursive: true, force: true})
        fs.mkdirSync(tempApp, {recursive: true})
        setupAppDir(tempApp)
    })

    afterEach(() => {
        if (originalEnv) {
            process.env.PWA_STOREFRONT_APP_PATH = originalEnv
        } else {
            delete process.env.PWA_STOREFRONT_APP_PATH
        }
        fs.rmSync(tempApp, {recursive: true, force: true})
    })

    it('detects app dir via env variable', async () => {
        process.env.PWA_STOREFRONT_APP_PATH = tempApp
        const utils = await import('./utils')
        const result = await utils.detectWorkspacePaths()
        expect(result.pagesPath).toBe(path.join(tempApp, 'pages'))
    })

    it('prompts user if env variable is not set', async () => {
        delete process.env.PWA_STOREFRONT_APP_PATH
        const utils = await import('./utils')
        await expect(utils.detectWorkspacePaths()).rejects.toThrow(
            'Could not detect PWA Kit project directory. Please either:'
        )
    })

    it('throws error when pages directory is missing', async () => {
        fs.rmSync(path.join(tempApp, 'pages'), {recursive: true, force: true})
        process.env.PWA_STOREFRONT_APP_PATH = tempApp
        const utils = await import('./utils')
        await expect(utils.detectWorkspacePaths()).rejects.toThrow('Pages directory not found at:')
    })
    it('throws error when components directory is missing', async () => {
        fs.rmSync(path.join(tempApp, 'components'), {recursive: true, force: true})
        process.env.PWA_STOREFRONT_APP_PATH = tempApp
        const utils = await import('./utils')
        await expect(utils.detectWorkspacePaths()).rejects.toThrow(
            'Components directory not found at:'
        )
    })
    it('throws error when routes.jsx is missing', async () => {
        fs.rmSync(path.join(tempApp, 'routes.jsx'), {force: true})
        process.env.PWA_STOREFRONT_APP_PATH = tempApp
        const utils = await import('./utils')
        await expect(utils.detectWorkspacePaths()).rejects.toThrow('Routes file not found at:')
    })
})
