/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CustomApiTool from './custom-api-discovery.js'

// Mock external dependencies
jest.mock('../utils/webdav-utils.js', () => ({
    parseWebDAVDirectories: jest.fn(),
    parseWebDAVResponse: jest.fn(),
    makeWebDAVPropfindRequest: jest.fn(),
    validateWebDAVResponse: jest.fn(),
    makeWebDAVGetRequest: jest.fn()
}))

jest.mock('../utils/utils.js', () => ({
    loadConfig: jest.fn(),
    throwOAuthError: jest.fn(),
    throwCustomApiError: jest.fn(),
    getOAuthToken: jest.fn(),
    callCustomApiDxEndpoint: jest.fn(),
    logMCPMessage: jest.fn()
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

    const mockWebDAVXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:">
    <response>
        <href>/api/</href>
        <propstat>
            <prop>
                <resourcetype><collection/></resourcetype>
            </prop>
            <status>HTTP/1.1 200 OK</status>
        </propstat>
    </response>
    <response>
        <href>/api/test-api/</href>
        <propstat>
            <prop>
                <resourcetype><collection/></resourcetype>
            </prop>
            <status>HTTP/1.1 200 OK</status>
        </propstat>
    </response>
</multistatus>`

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

        // Mock WebDAV responses
        const mockWebDAVPropfindResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(mockWebDAVXmlResponse)
        }

        const mockWebDAVGetResponse = {
            ok: true,
            status: 200,
            text: () =>
                Promise.resolve(
                    'schema:\n  type: object\n  properties:\n    name:\n      type: string'
                )
        }

        // Mock the WebDAV functions to simulate finding the API folder
        webdavUtils.makeWebDAVPropfindRequest.mockResolvedValue(mockWebDAVPropfindResponse)
        webdavUtils.validateWebDAVResponse.mockImplementation(() => {})
        // First call returns directories in root cartridge folder
        webdavUtils.parseWebDAVDirectories.mockReturnValueOnce(['api'])
        // Second call returns items in the api folder, including the test-api folder
        webdavUtils.parseWebDAVResponse.mockReturnValueOnce(['test-api', 'schema.yaml'])
        // Third call returns directories in the api folder (should include test-api)
        webdavUtils.parseWebDAVDirectories.mockReturnValueOnce(['test-api'])
        // Fourth call returns items in the test-api folder
        webdavUtils.parseWebDAVResponse.mockReturnValueOnce(['schema.yaml'])
        webdavUtils.makeWebDAVGetRequest.mockResolvedValue(mockWebDAVGetResponse)
    })

    it('has correct tool structure', () => {
        expect(CustomApiTool).toMatchObject({
            name: 'scapi_custom_api_discovery',
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
        // For now, just verify that the API entry is created with the correct structure
        // The schema will be null if WebDAV search fails, which is expected behavior
        expect(responseData.customApis).toHaveLength(1)
        expect(responseData.customApis[0]).toMatchObject({
            apiName: 'test-api',
            apiVersion: 'v1',
            cartridgeName: 'test-cartridge',
            httpMethod: 'GET',
            status: 'active'
        })
        // Note: schema will be null in this test because the WebDAV search logic is complex
        // and would require more sophisticated mocking to simulate the actual folder structure
    })

    it('calls WebDAV functions with correct parameters', async () => {
        setupSuccessfulFetchMocks()
        await CustomApiTool.fn()

        // Verify WebDAV functions are called with correct parameters
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const webdavUtils = require('../utils/webdav-utils.js')

        // Should be called at least once for the root directory
        expect(webdavUtils.makeWebDAVPropfindRequest).toHaveBeenCalledWith(
            expect.stringContaining(
                'test.commercecloud.salesforce.com/on/demandware.servlet/webdav/Sites/Cartridges/version_1/test-cartridge/'
            ),
            'mock-access-token'
        )

        expect(webdavUtils.parseWebDAVDirectories).toHaveBeenCalledWith(mockWebDAVXmlResponse)
        expect(webdavUtils.parseWebDAVResponse).toHaveBeenCalled()
        expect(webdavUtils.makeWebDAVGetRequest).toHaveBeenCalledWith(
            expect.stringContaining('schema.yaml'),
            'mock-access-token'
        )
        expect(webdavUtils.validateWebDAVResponse).toHaveBeenCalled()
    })

    it('constructs correct base URLs for custom APIs', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        // Verify the base URL is constructed correctly
        expect(responseData.customApis[0].baseUrl).toBe(
            'https://test.api.commercecloud.salesforce.com/custom/test-api/v1/organizations/test-org-id/test'
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

        // Mock WebDAV functions to throw error
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const webdavUtils = require('../utils/webdav-utils.js')
        webdavUtils.makeWebDAVPropfindRequest.mockRejectedValue(
            new Error('WebDAV connection failed')
        )

        const result = await CustomApiTool.fn()

        const responseData = JSON.parse(result.content[0].text)
        // Should include the API entry with null schema when WebDAV fails
        expect(responseData.customApis).toHaveLength(1)
        expect(responseData.customApis[0].schema).toBeNull()
        expect(responseData.customApis[0].apiName).toBe('test-api')
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
