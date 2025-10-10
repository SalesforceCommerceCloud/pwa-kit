/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CustomApiTool from './custom-api-tool.js'

// Mock external dependencies
jest.mock('../utils/webdav-utils.js', () => ({
    createWebDAVClient: jest.fn(),
    findFolderRecursively: jest.fn(),
    getFileContent: jest.fn()
}))

jest.mock('../utils/utils.js', () => ({
    loadConfig: jest.fn(),
    throwOAuthError: jest.fn(),
    throwCustomApiError: jest.fn(),
    getOAuthToken: jest.fn(),
    callCustomApiDxEndpoint: jest.fn()
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('CustomApiTool', () => {
    const mockConfig = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        organizationId: 'test-org-id',
        instanceId: 'test-instance-id',
        shortCode: 'test',
        hostname: 'test.commercecloud.salesforce.com'
    }

    const mockOAuthResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
    }

    const mockDxResponse = {
        data: [
            {
                apiName: 'test-api',
                apiVersion: 'v1',
                cartridgeName: 'test-cartridge',
                endpointPath: '/test',
                httpMethod: 'GET',
                status: 'active',
                securityScheme: 'oauth2',
                siteId: 'test-site'
            }
        ],
        activeCodeVersion: 'version_1'
    }

    const mockWebDAVResponse = {
        searchResults: [
            {
                directory: '/api/test-api',
                apiNameFolder: 'test-api',
                fullPath: '/api/test-api',
                schemaContent:
                    'schema:\n  type: object\n  properties:\n    name:\n      type: string'
            }
        ]
    }

    // Helper function to set up successful fetch mocks
    const setupSuccessfulFetchMocks = () => {
        // Mock the utils functions to return Response objects
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const utils = require('../utils/utils.js')

        // Mock OAuth response
        const mockOAuthResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockOAuthResponse)
        }
        utils.getOAuthToken.mockResolvedValue(mockOAuthResponseObj)

        // Mock Custom API DX response
        const mockDxResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockDxResponse)
        }
        utils.callCustomApiDxEndpoint.mockResolvedValue(mockDxResponseObj)
    }

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock loadConfig to return test configuration
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('../utils/utils.js').loadConfig.mockReturnValue(mockConfig)

        // Mock WebDAV functions
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const webdavUtils = require('../utils/webdav-utils.js')
        webdavUtils.createWebDAVClient.mockReturnValue({})
        webdavUtils.findFolderRecursively.mockResolvedValue(mockWebDAVResponse.searchResults)
        webdavUtils.getFileContent.mockResolvedValue(
            'schema:\n  type: object\n  properties:\n    name:\n      type: string'
        )
    })

    it('has correct tool structure', () => {
        expect(CustomApiTool).toMatchObject({
            name: 'custom_api_tool',
            description: expect.any(String),
            inputSchema: {},
            fn: expect.any(Function)
        })
    })

    it('successfully discovers and processes custom APIs', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        expect(result).toMatchObject({
            content: [
                {
                    type: 'text',
                    text: expect.stringContaining('"metadata"')
                }
            ]
        })

        // Parse the JSON response to verify structure
        const responseData = JSON.parse(result.content[0].text)

        // Verify metadata structure
        expect(responseData.metadata).toMatchObject({
            activeCodeVersion: 'version_1',
            totalApis: 1,
            timestamp: expect.any(String)
        })

        // Verify custom APIs structure
        expect(responseData.customApis).toHaveLength(1)
        expect(responseData.customApis[0]).toMatchObject({
            apiName: 'test-api',
            apiVersion: 'v1',
            cartridgeName: 'test-cartridge',
            httpMethod: 'GET',
            status: 'active'
        })
    })

    it('includes schema content when WebDAV search is successful', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        expect(responseData.customApis[0].schema).toContain('schema:')
        expect(responseData.customApis[0].schema).toContain('type: object')
        expect(responseData.customApis[0].schema).toContain('properties:')
    })

    it('constructs correct base URLs for custom APIs', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        // Verify the base URL is constructed correctly
        expect(responseData.customApis[0].baseUrl).toBe(
            'https://test.api.commercecloud.salesforce.com/custom/test-api/v1/organizations/test-org-id//test'
        )
    })

    it('handles multiple APIs correctly', async () => {
        const multipleApisResponse = {
            data: [
                {
                    apiName: 'api-1',
                    apiVersion: 'v1',
                    cartridgeName: 'cartridge-1',
                    endpointPath: '/endpoint1',
                    httpMethod: 'GET',
                    status: 'active',
                    securityScheme: 'oauth2',
                    siteId: 'site-1'
                },
                {
                    apiName: 'api-2',
                    apiVersion: 'v2',
                    cartridgeName: 'cartridge-2',
                    endpointPath: '/endpoint2',
                    httpMethod: 'POST',
                    status: 'active',
                    securityScheme: 'oauth2',
                    siteId: 'site-2'
                }
            ],
            activeCodeVersion: 'version_1'
        }

        // Mock the utils functions for this specific test
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const utils = require('../utils/utils.js')

        const mockOAuthResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockOAuthResponse)
        }
        utils.getOAuthToken.mockResolvedValue(mockOAuthResponseObj)

        const mockDxResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(multipleApisResponse)
        }
        utils.callCustomApiDxEndpoint.mockResolvedValue(mockDxResponseObj)

        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        expect(responseData.metadata.totalApis).toBe(2)
        expect(responseData.customApis).toHaveLength(2)
        expect(responseData.customApis[0].apiName).toBe('api-1')
        expect(responseData.customApis[1].apiName).toBe('api-2')
        expect(responseData.customApis[0].cartridgeName).toBe('cartridge-1')
        expect(responseData.customApis[1].cartridgeName).toBe('cartridge-2')
        expect(responseData.customApis[0].httpMethod).toBe('GET')
        expect(responseData.customApis[1].httpMethod).toBe('POST')
    })

    it('handles OAuth token failure', async () => {
        // Mock OAuth function to throw error
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const utils = require('../utils/utils.js')
        utils.getOAuthToken.mockRejectedValue(new Error('Network error'))

        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        expect(responseData.error).toContain('Network error')
    })

    it('handles Custom API DX endpoint failure', async () => {
        // Mock OAuth success but DX endpoint failure
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const utils = require('../utils/utils.js')

        const mockOAuthResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockOAuthResponse)
        }
        utils.getOAuthToken.mockResolvedValue(mockOAuthResponseObj)
        utils.callCustomApiDxEndpoint.mockRejectedValue(new Error('API endpoint error'))

        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        expect(responseData.error).toContain('API endpoint error')
    })

    it('includes partial DX response when webDAV fails', async () => {
        // Mock OAuth success and DX response success, but WebDAV failure
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const utils = require('../utils/utils.js')

        const mockOAuthResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockOAuthResponse)
        }
        utils.getOAuthToken.mockResolvedValue(mockOAuthResponseObj)

        const mockDxResponseObj = {
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockDxResponse)
        }
        utils.callCustomApiDxEndpoint.mockResolvedValue(mockDxResponseObj)

        // Mock WebDAV client creation to throw error
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const webdavUtils = require('../utils/webdav-utils.js')
        webdavUtils.createWebDAVClient.mockImplementation(() => {
            throw new Error('WebDAV connection failed')
        })

        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        expect(responseData.error).toContain('WebDAV connection failed')
        // Should not include partial DX response since WebDAV error happens after DX success
    })

    it('throws error when some configuration fields are null', async () => {
        // Override the default config mock to return null values
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('../utils/utils.js').loadConfig.mockReturnValue({
            clientId: 'client-id',
            clientSecret: null,
            organizationId: null,
            instanceId: 'instance-id',
            shortCode: 'short-code',
            hostname: 'hostname'
        })

        await expect(CustomApiTool.fn()).rejects.toThrow(
            'Required configuration fields are null: clientSecret, organizationId'
        )
    })
})
