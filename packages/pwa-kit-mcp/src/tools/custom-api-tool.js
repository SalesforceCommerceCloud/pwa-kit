/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {loadConfig, getOAuthToken, callCustomApiDxEndpoint} from '../utils/utils.js'
import {createWebDAVClient, findFolderRecursively, getFileContent} from '../utils/webdav-utils.js'
import {logMCPMessage} from '../utils/utils.js'

/**
 * Creates a structured JSON response object
 */
function toJsonResponse(data, activeCodeVersion = null) {
    const response = {
        metadata: {
            activeCodeVersion: activeCodeVersion,
            timestamp: new Date().toISOString(),
            totalApis: data?.length || 0
        },
        customApis: data || []
    }

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(response, null, 2)
            }
        ]
    }
}

/**
 * Creates an error response object
 */
function toErrorResponse(error, customApis = []) {
    const errorResponse = {
        error: error.message,
        customApis: customApis
    }

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2)
            }
        ]
    }
}

/**
 * Fetches and validates OAuth token
 */
async function fetchAndValidateOAuthToken(clientId, clientSecret, oauthScope) {
    const response = await getOAuthToken(clientId, clientSecret, oauthScope)
    const responseData = await response.json()

    if (!response.ok) {
        const errorMessage = `Invalid OAuth response. Status: ${response.status}. Error: ${response.statusText}. Description: ${responseData.error_description}`
        throw new Error(errorMessage)
    }
    return responseData
}

/**
 * Fetches and validates Custom API DX response
 */
async function fetchAndValidateCustomApiDxResponse(accessToken, customApiHost, organizationId) {
    const response = await callCustomApiDxEndpoint(accessToken, customApiHost, organizationId)
    const responseData = await response.json()

    if (!response.ok) {
        const errorMessage = `Invalid Custom API DX response. Status: ${response.status}. Error: ${response.statusText}. Description: ${responseData.detail}`
        throw new Error(errorMessage)
    }
    return responseData
}

/**
 * Fetches and validates configuration from dw.json or environment variables
 */
function fetchAndValidateConfigs() {
    // Load configuration from dw.json or environment variables
    const config = loadConfig()
    const {clientId, clientSecret, organizationId, instanceId, shortCode, hostname} = config

    // Validate configuration fields
    const nullConfigFields = Object.entries(config)
        .filter(([, value]) => value === null || value === undefined)
        .map(([key]) => key)

    if (nullConfigFields.length > 0) {
        throw new Error(`Required configuration fields are null: ${nullConfigFields.join(', ')}`)
    }

    return {clientId, clientSecret, organizationId, instanceId, shortCode, hostname}
}

/**
 * Search for API schema files using WebDAV client
 */
async function searchForApiSchema(webdavClient, activeCodeVersion, cartridgeName, apiName) {
    const basePath = `/on/demandware.servlet/webdav/Sites/Cartridges/${activeCodeVersion}/${cartridgeName}/`

    try {
        // Search recursively for the API folder
        const foundFolders = await findFolderRecursively(webdavClient, basePath, apiName)

        const results = []
        for (const folder of foundFolders) {
            // Try to get schema.yaml from each found folder
            const schemaPath = `${folder.path}/schema.yaml`
            const schemaContent = await getFileContent(webdavClient, schemaPath)

            results.push({
                directory: folder.path,
                apiNameFolder: folder.basename,
                fullPath: folder.path,
                schemaContent: schemaContent
            })
        }

        return {searchResults: results}
    } catch (error) {
        logMCPMessage('Error searching for API schema: ' + error.message)
        return {searchResults: []}
    }
}

export default {
    name: 'custom_api_tool',
    description:
        'Discovers and retrieves information about custom APIs deployed in Salesforce Commerce Cloud instances. Use this tool when you need to: find available custom APIs, get API schemas/documentation, understand API endpoints and methods, or analyze custom API implementations. This tool searches through SFCC cartridges, retrieves OAuth tokens, and fetches comprehensive API metadata including endpoints, HTTP methods, security schemes, and OpenAPI schemas.',
    inputSchema: {},
    fn: async () => {
        let dxEndpointResponse = null
        let activeCodeVersion = null
        const {clientId, clientSecret, organizationId, instanceId, shortCode, hostname} =
            fetchAndValidateConfigs()
        const customApiHost = `${shortCode}.api.commercecloud.salesforce.com`
        const oauthScope = `SALESFORCE_COMMERCE_API:${instanceId} sfcc.custom-apis`

        try {
            // Get OAuth token
            const tokenData = await fetchAndValidateOAuthToken(clientId, clientSecret, oauthScope)

            // Call custom API DX endpoint and retrieve custom APIs on the instance
            dxEndpointResponse = await fetchAndValidateCustomApiDxResponse(
                tokenData.access_token,
                customApiHost,
                organizationId
            )
            activeCodeVersion = dxEndpointResponse.activeCodeVersion

            if (!dxEndpointResponse.data) {
                return toJsonResponse([], activeCodeVersion)
            }

            // Create WebDAV client once and reuse it
            const webdavClient = createWebDAVClient(hostname, tokenData.access_token)

            // Process each custom API and attempt to get the schema content from WebDAV
            // If the schema content is not found, still create the entry with content from DX response
            const processedEntries = []
            for (const entry of dxEndpointResponse.data) {
                if (entry.cartridgeName) {
                    try {
                        const webdavResponse = await searchForApiSchema(
                            webdavClient,
                            activeCodeVersion,
                            entry.cartridgeName,
                            entry.apiName
                        )

                        // Extract schema content from the first successful result
                        const schemaContent =
                            webdavResponse?.searchResults?.[0]?.schemaContent || null

                        // Construct the custom API base URL
                        const customApiBaseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/custom/${entry.apiName}/${entry.apiVersion}/organizations/${organizationId}/${entry.endpointPath}`

                        // Create the processed entry with necessary fields
                        const processedEntry = {
                            apiName: entry.apiName,
                            apiVersion: entry.apiVersion,
                            cartridgeName: entry.cartridgeName,
                            endpointPath: entry.endpointPath,
                            httpMethod: entry.httpMethod,
                            status: entry.status,
                            securityScheme: entry.securityScheme,
                            siteId: entry.siteId,
                            baseUrl: customApiBaseUrl,
                            schema: schemaContent
                        }

                        processedEntries.push(processedEntry)
                    } catch (webdavError) {
                        // Create entry with null schema if WebDAV fails
                        const processedEntry = {
                            apiName: entry.apiName,
                            apiVersion: entry.apiVersion,
                            cartridgeName: entry.cartridgeName,
                            endpointPath: entry.endpointPath,
                            httpMethod: entry.httpMethod,
                            status: entry.status,
                            securityScheme: entry.securityScheme,
                            schema: null
                        }

                        processedEntries.push(processedEntry)
                    }
                }
            }

            return toJsonResponse(processedEntries, activeCodeVersion)
        } catch (error) {
            return toErrorResponse(error, dxEndpointResponse?.data || [])
        }
    }
}
