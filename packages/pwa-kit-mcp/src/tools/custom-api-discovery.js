/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {loadConfig, getOAuthToken, callCustomApiDxEndpoint, logMCPMessage} from '../utils/utils.js'
import {
    parseWebDAVDirectories,
    parseWebDAVResponse,
    makeWebDAVPropfindRequest,
    validateWebDAVResponse,
    makeWebDAVGetRequest
} from '../utils/webdav-utils.js'

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
 * Recursively searches for files related to an endpoint within a cartridge
 */
async function searchForEndpointFiles(
    hostname,
    accessToken,
    activeCodeVersion,
    cartridgeName,
    apiName
) {
    const searchResults = []
    const baseUrl = `${hostname}/on/demandware.servlet/webdav/Sites/Cartridges/${activeCodeVersion}/${cartridgeName}/`
    try {
        // First, get the root cartridge directory structure
        const response = await makeWebDAVPropfindRequest(baseUrl, accessToken)
        validateWebDAVResponse(response)

        // Parse the XML response to find directories to search for the API name folder
        const responseText = await response.text()
        const directories = parseWebDAVDirectories(responseText)

        // Search recursively in each subdirectory for the API name folder
        for (const dir of directories) {
            const foundInDir = await searchRecursivelyForApiName(
                baseUrl,
                dir,
                accessToken,
                apiName,
                '',
                0
            )
            if (foundInDir.searchResults && foundInDir.searchResults.length > 0) {
                searchResults.push(...foundInDir.searchResults)
            }
        }
    } catch (error) {
        logMCPMessage(`Error searching for endpoint files: ${error}`)
    }

    return {searchResults}
}

/**
 * Recursively search for API name folder in a directory and its subdirectories
 */
async function searchRecursivelyForApiName(
    baseUrl,
    currentDir,
    accessToken,
    apiName,
    currentPath,
    depth = 0
) {
    const searchResults = []
    // Normalize path building to avoid double slashes
    const dirUrl = `${baseUrl.replace(/\/$/, '')}/${currentDir.replace(/^\//, '')}/`
    const fullPath = currentPath ? `${currentPath}/${currentDir}` : currentDir

    try {
        const dirResponse = await makeWebDAVPropfindRequest(dirUrl, accessToken)
        validateWebDAVResponse(dirResponse)

        const dirText = await dirResponse.text()
        const items = parseWebDAVResponse(dirText)

        // Check if the API name folder is in this directory
        const apiNameFolder = items.find((item) => item.toLowerCase() === apiName.toLowerCase())

        // Only try to fetch schema if folder exists
        if (apiNameFolder) {
            let schemaContent = null
            const schemaUrl = `${dirUrl}${apiNameFolder}/schema.yaml`
            const schemaResponse = await makeWebDAVGetRequest(schemaUrl, accessToken)
            validateWebDAVResponse(schemaResponse)

            schemaContent = await schemaResponse.text()
            searchResults.push({
                directory: fullPath,
                apiNameFolder: apiNameFolder,
                fullPath: `${fullPath}/${apiNameFolder}`,
                schemaContent: schemaContent
            })
        }

        // Get subdirectories using proper directory detection
        const subdirs = parseWebDAVDirectories(dirText)
        for (const subdir of subdirs) {
            const subResults = await searchRecursivelyForApiName(
                baseUrl,
                `${currentDir}/${subdir}`,
                accessToken,
                apiName,
                fullPath,
                depth + 1
            )
            searchResults.push(...subResults.searchResults)
        }
    } catch (error) {
        logMCPMessage(`Error searching recursively for API name: ${error}`)
    }

    return {searchResults}
}

export default {
    name: 'scapi_custom_api_discovery',
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

            // Process each custom API and attempt to get the schema content from WebDAV
            // If the schema content is not found, still create the entry with content from DX response
            const processedEntries = []
            for (const entry of dxEndpointResponse.data) {
                if (entry.cartridgeName) {
                    const endpointPath = entry.endpointPath.startsWith('/')
                        ? entry.endpointPath.substring(1)
                        : entry.endpointPath
                    let customApiBaseUrl = null
                    let schemaContent = null
                    try {
                        // Construct the custom API base URL
                        customApiBaseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/custom/${entry.apiName}/${entry.apiVersion}/organizations/${organizationId}/${endpointPath}`

                        const webdavResponse = await searchForEndpointFiles(
                            hostname,
                            tokenData.access_token,
                            activeCodeVersion,
                            entry.cartridgeName,
                            entry.apiName
                        )

                        // Extract schema content from the first successful result
                        schemaContent = webdavResponse?.searchResults?.[0]?.schemaContent || null
                    } catch (webdavError) {
                        logMCPMessage(`Error fetching custom API schema: ${webdavError}`)
                    }
                    // Create the processed entry with necessary fields
                    const processedEntry = {
                        apiName: entry.apiName,
                        apiVersion: entry.apiVersion,
                        cartridgeName: entry.cartridgeName,
                        endpointPath: endpointPath,
                        httpMethod: entry.httpMethod,
                        status: entry.status,
                        securityScheme: entry.securityScheme,
                        siteId: entry.siteId,
                        baseUrl: customApiBaseUrl,
                        schema: schemaContent
                    }

                    processedEntries.push(processedEntry)
                }
            }

            return toJsonResponse(processedEntries, activeCodeVersion)
        } catch (error) {
            return toErrorResponse(error, dxEndpointResponse?.data || [])
        }
    }
}
