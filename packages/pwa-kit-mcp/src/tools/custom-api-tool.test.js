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
    loadConfig: jest.fn()
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
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOAuthResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockDxResponse)
            })
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
                    text: expect.stringContaining('Processed API Entries')
                }
            ],
            activeCodeVersion: 'version_1'
        })

        // Verify the result contains expected API information
        expect(result.content[0].text).toContain('test-api')
        expect(result.content[0].text).toContain('v1')
        expect(result.content[0].text).toContain('test-cartridge')
        expect(result.content[0].text).toContain('GET')
        expect(result.content[0].text).toContain('active')
    })

    it('includes schema content when WebDAV search is successful', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        expect(result.content[0].text).toContain('schema:')
        expect(result.content[0].text).toContain('type: object')
        expect(result.content[0].text).toContain('properties:')
    })

    it('constructs correct base URLs for custom APIs', async () => {
        setupSuccessfulFetchMocks()
        const result = await CustomApiTool.fn()

        // Verify the base URL is constructed correctly
        expect(result.content[0].text).toContain(
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

        // Override the default fetch mock for this specific test
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOAuthResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(multipleApisResponse)
            })

        const result = await CustomApiTool.fn()

        expect(result.content[0].text).toContain('api-1')
        expect(result.content[0].text).toContain('api-2')
        expect(result.content[0].text).toContain('cartridge-1')
        expect(result.content[0].text).toContain('cartridge-2')
        expect(result.content[0].text).toContain('GET')
        expect(result.content[0].text).toContain('POST')
    })

    it('handles OAuth token failure', async () => {
        // Override the default fetch mock to simulate OAuth failure
        global.fetch.mockRejectedValueOnce(new Error('Network error'))

        const result = await CustomApiTool.fn()

        expect(result.content[0].text).toContain('API Processing Error')
        expect(result.content[0].text).toContain('Network error')
    })

    it('handles Custom API DX endpoint failure', async () => {
        // Override the default fetch mock to simulate API endpoint failure
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockOAuthResponse)
            })
            .mockRejectedValueOnce(new Error('API endpoint error'))

        const result = await CustomApiTool.fn()

        expect(result.content[0].text).toContain('API Processing Error')
        expect(result.content[0].text).toContain('API endpoint error')
    })
})
