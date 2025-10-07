/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {loadConfig} from '../utils/utils.js'
import {OAUTH_TOKEN_URL} from '../utils/constants.js'
import {parseWebDAVResponse, parseWebDAVResponseAll} from '../utils/webdav-utils.js'

/**
 * Formats error messages for display
 */
function formatError(type, error) {
    return `${type}:
- Error: ${error.message}
- Status: Failed to ${type.toLowerCase().replace(' ', ' ').replace('Error', '')}

`
}

/**
 * Obtains OAuth access token
 */
async function getOAuthToken(clientId, clientSecret, oauthScope) {
    const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: `grant_type=client_credentials&scope=${encodeURIComponent(oauthScope)}`
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
}

/**
 * Calls the custom API endpoint
 */
async function callCustomApiDxEndpoint(accessToken, customApiHost, organizationId) {
    const customApiBase = `https://${customApiHost}/dx/custom-apis/v1/organizations/${organizationId}/endpoints`

    const response = await fetch(customApiBase, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error(`Custom API HTTP error! status: ${response.status}`)
    }

    return await response.json()
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
    const baseUrl = `${hostname}/on/demandware.servlet/webdav/Sites/Cartridges/${activeCodeVersion}/${cartridgeName}/`

    // First, get the root cartridge directory structure
    const response = await fetch(baseUrl, {
        method: 'PROPFIND',
        headers: {
            'Content-Type': 'application/xml',
            Authorization: `Bearer ${accessToken}`,
            Depth: '1'
        }
    })

    if (!response.ok) {
        throw new Error(`WebDAV HTTP error! status: ${response.status}`)
    }

    const responseText = await response.text()

    // Parse the XML response to find directories to search
    const directories = parseWebDAVResponse(responseText)
    let searchResults = []

    // Search recursively in each subdirectory for the API name folder
    for (const dir of directories) {
        try {
            const foundInDir = await searchRecursivelyForApiName(
                baseUrl,
                dir,
                accessToken,
                apiName,
                '',
                0
            )
            if (foundInDir.results && foundInDir.results.length > 0) {
                searchResults.push(...foundInDir.results)
            }
        } catch (error) {
            // Continue searching other directories even if one fails
        }
    }

    return {
        searchResults: searchResults
    }
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
    const results = []
    // Normalize path building to avoid double slashes
    const dirUrl = `${baseUrl.replace(/\/$/, '')}/${currentDir.replace(/^\//, '')}/`
    const fullPath = currentPath ? `${currentPath}/${currentDir}` : currentDir

    try {
        const dirResponse = await fetch(dirUrl, {
            method: 'PROPFIND',
            headers: {
                'Content-Type': 'application/xml',
                Authorization: `Bearer ${accessToken}`,
                Depth: '1'
            }
        })

        if (dirResponse.ok) {
            const dirText = await dirResponse.text()
            const items = parseWebDAVResponseAll(dirText)

            // Check if the API name folder is in this directory
            const apiNameFolder = items.find((item) => item.toLowerCase() === apiName.toLowerCase())

            if (apiNameFolder) {
                // Try to fetch the schema.yaml file from the API folder
                let schemaContent = null
                try {
                    const schemaUrl = `${dirUrl}${apiNameFolder}/schema.yaml`
                    const schemaResponse = await fetch(schemaUrl, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/xml'
                        }
                    })

                    if (schemaResponse.ok) {
                        schemaContent = await schemaResponse.text()
                    }
                } catch (error) {
                    // Continue on error
                }

                results.push({
                    directory: fullPath,
                    apiNameFolder: apiNameFolder,
                    fullPath: `${fullPath}/${apiNameFolder}`,
                    schemaContent: schemaContent
                })
            }

            // Get subdirectories using proper directory detection
            const subdirs = parseWebDAVResponse(dirText)
            for (const subdir of subdirs) {
                const subResults = await searchRecursivelyForApiName(
                    baseUrl,
                    `${currentDir}/${subdir}`,
                    accessToken,
                    apiName,
                    fullPath,
                    depth + 1
                )
                results.push(...subResults.results)
            }
        }
    } catch (error) {
        // Continue on error
    }

    return {results}
}

export default {
    name: 'custom_api_tool',
    description:
        'Discovers and retrieves information about custom APIs deployed in Salesforce Commerce Cloud instances. Use this tool when you need to: find available custom APIs, get API schemas/documentation, understand API endpoints and methods, or analyze custom API implementations. This tool searches through SFCC cartridges, retrieves OAuth tokens, and fetches comprehensive API metadata including endpoints, HTTP methods, security schemes, and OpenAPI schemas.',
    inputSchema: {},
    fn: async () => {
        let result = ''
        let activeCodeVersion = null

        // Load configuration from dw.json or environment variables
        const config = loadConfig()
        const {clientId, clientSecret, organizationId, instanceId, shortCode, hostname} = config
        console.error('config', config)

        const customApiHost = `${shortCode}.api.commercecloud.salesforce.com`
        const oauthScope = `SALESFORCE_COMMERCE_API:${instanceId} sfcc.custom-apis`

        try {
            // Get OAuth token
            const tokenData = await getOAuthToken(clientId, clientSecret, oauthScope)
            if (!tokenData?.access_token) {
                throw new Error('Invalid OAuth response.')
            }

            // Call custom API DX endpoint and retrieve custom APIs on the instance
            const dxResponse = await callCustomApiDxEndpoint(
                tokenData.access_token,
                customApiHost,
                organizationId
            )
            if (!dxResponse.data) {
                throw new Error('Invalid Custom API DX response.')
            }

            // Process each custom API and get the schema content
            const processedEntries = []
            activeCodeVersion = dxResponse.activeCodeVersion

            for (const entry of dxResponse.data) {
                if (entry.cartridgeName) {
                    try {
                        const webdavResponse = await searchForEndpointFiles(
                            hostname,
                            tokenData.access_token,
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

            result += `Processed API Entries:\n${JSON.stringify(processedEntries, null, 2)}\n\n`
        } catch (error) {
            result += formatError('API Processing Error', error)
        }

        console.error(result)
        return {
            content: [
                {
                    type: 'text',
                    text: result
                }
            ],
            activeCodeVersion: activeCodeVersion
        }
    }
}
