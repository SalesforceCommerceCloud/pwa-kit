/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'

// Configuration constants
const OAUTH_TOKEN_URL = 'https://account.demandware.com/dwsso/oauth2/access_token'
const CUSTOM_API_HOST = `${process.env.SFCC_SHORT_CODE}.api.commercecloud.salesforce.com`
const OAUTH_SCOPE = `SALESFORCE_COMMERCE_API:${process.env.SFCC_ORG_ID} c_reviews_rw sfcc.custom-apis`

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
async function getOAuthToken(clientId, clientSecret) {
    const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: `grant_type=client_credentials&scope=${encodeURIComponent(OAUTH_SCOPE)}`
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
}

/**
 * Calls the custom API endpoint
 */
async function callDxEndpoint(accessToken) {
    const customApiBase = `https://${CUSTOM_API_HOST}/dx/custom-apis/v1/organizations/${process.env.SFCC_ORG_ID}/endpoints`

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

    return {
        data: await response.json(),
        host: CUSTOM_API_HOST,
        endpoint: customApiBase
    }
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

/**
 * Parse WebDAV XML response to extract directory/file names
 */
function parseWebDAVResponse(xmlText) {
    const items = []
    // Look for href elements (without namespace in this case)
    const regex = /<href>([^<]+)<\/href>/g
    let match

    while ((match = regex.exec(xmlText)) !== null) {
        const href = match[1]
        // Remove trailing slash and split by /
        const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href
        const pathParts = cleanHref.split('/')
        const name = pathParts[pathParts.length - 1]

        if (name && name !== '') {
            // Check if this is a directory by looking for <resourcetype><collection/> in the same response block
            const isDirectory = isDirectoryInWebDAVResponse(xmlText, href)
            if (isDirectory) {
                items.push(name)
            }
        }
    }

    return items
}

/**
 * Check if a href corresponds to a directory in WebDAV response
 */
function isDirectoryInWebDAVResponse(xmlText, href) {
    // Find the response block for this href and check for <D:resourcetype><D:collection/>
    const responseRegex = new RegExp(
        // eslint-disable-next-line no-useless-escape
        `<response>.*?<href>${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\/href>.*?<\/response>`,
        's'
    )
    const responseMatch = xmlText.match(responseRegex)

    if (responseMatch) {
        const responseBlock = responseMatch[0]
        // Check if this response contains <resourcetype><collection/>
        return responseBlock.includes('<resourcetype><collection/>')
    }

    return false
}

/**
 * Parse WebDAV XML response to extract all items (both files and directories)
 */
function parseWebDAVResponseAll(xmlText) {
    const items = []
    // Look for href elements (without namespace in this case)
    const regex = /<href>([^<]+)<\/href>/g
    let match

    while ((match = regex.exec(xmlText)) !== null) {
        const href = match[1]
        // Remove trailing slash and split by /
        const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href
        const pathParts = cleanHref.split('/')
        const name = pathParts[pathParts.length - 1]

        if (name && name !== '') {
            items.push(name)
        }
    }

    return items
}

export default {
    name: 'custom_api_tool',
    description:
        'Discovers and retrieves information about custom APIs deployed in Salesforce Commerce Cloud instances. Use this tool when you need to: find available custom APIs, get API schemas/documentation, understand API endpoints and methods, or analyze custom API implementations. This tool searches through SFCC cartridges, retrieves OAuth tokens, and fetches comprehensive API metadata including endpoints, HTTP methods, security schemes, and OpenAPI schemas.',
    inputSchema: {
        message: z.string().describe('A message to process'),
        count: z.number().optional().describe('Optional count parameter')
    },
    fn: async ({message, count = 1}) => {
        // Get configuration from environment variables
        const config = {
            hostname: process.env.SFCC_HOSTNAME,
            siteId: process.env.SFCC_SITE_ID,
            clientId: process.env.AM_CLIENT_ID,
            clientSecret: process.env.AM_CLIENT_SECRET,
            organizationId: process.env.SFCC_ORG_ID,
            shortCode: process.env.SFCC_SHORT_CODE,
            message,
            count
        }

        let result = ''
        let activeCodeVersion = null

        try {
            // Get OAuth token
            const tokenData = await getOAuthToken(config.clientId, config.clientSecret)

            // Call custom API if we have an access token
            if (tokenData.access_token) {
                try {
                    const apiResponse = await callDxEndpoint(tokenData.access_token)
                    // Store activeCodeVersion in variable
                    activeCodeVersion = apiResponse.data.activeCodeVersion

                    // Process each entry and get schema content
                    if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
                        const processedEntries = []

                        for (const entry of apiResponse.data.data) {
                            if (entry.cartridgeName) {
                                try {
                                    const webdavResponse = await searchForEndpointFiles(
                                        config.hostname,
                                        tokenData.access_token,
                                        activeCodeVersion,
                                        entry.cartridgeName,
                                        entry.apiName
                                    )

                                    // Extract schema content from the first successful result
                                    let schemaContent = null
                                    if (
                                        webdavResponse.searchResults &&
                                        webdavResponse.searchResults.length > 0
                                    ) {
                                        const firstResult = webdavResponse.searchResults[0]
                                        schemaContent = firstResult.schemaContent
                                    }

                                    // Create the processed entry with only the requested fields
                                    const processedEntry = {
                                        apiName: entry.apiName,
                                        apiVersion: entry.apiVersion,
                                        cartridgeName: entry.cartridgeName,
                                        endpointPath: entry.endpointPath,
                                        httpMethod: entry.httpMethod,
                                        status: entry.status,
                                        securityScheme: entry.securityScheme,
                                        siteId: entry.siteId,
                                        baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/custom/${entry.apiName}/${entry.apiVersion}/organizations/${config.organizationId}/${entry.endpointPath}`,
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

                        // Format the final result
                        result += `Processed API Entries:\n${JSON.stringify(
                            processedEntries,
                            null,
                            2
                        )}\n\n`
                    }
                } catch (customApiError) {
                    result += formatError('Custom API Error', customApiError)
                }
            }
        } catch (error) {
            result += formatError('OAuth Token Error', error)
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
