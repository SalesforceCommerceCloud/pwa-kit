/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {loadConfig} from '../utils/utils.js'
import {OAUTH_TOKEN_URL} from '../utils/constants.js'
import {createWebDAVClient, findFolderRecursively, getFileContent} from '../utils/webdav-utils.js'
import {logMCPMessage} from '../utils/utils.js'

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
 * Helper function to throw formatted OAuth error messages
 */
function throwOAuthError(message, tokenData) {
    const errorMessage = tokenData.error_description
        ? `${message}. Error: ${tokenData.error}. Description: ${tokenData.error_description}`
        : `${message}. Error: ${tokenData.error}`
    throw new Error(errorMessage)
}

/**
 * Helper function to handle custom API DX endpoint errors
 */
function throwDxEndpointError(message, response) {
    const errorMessage = response.title
        ? `${message}. Title: ${response.title}. Detail: ${response.detail}`
        : `${message}. Response: ${JSON.stringify(response)}`
    throw new Error(errorMessage)
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

    return await response.json()
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
        let result = ''
        let dxEndpointResponse = null
        let activeCodeVersion = null
        const {clientId, clientSecret, organizationId, instanceId, shortCode, hostname} =
            fetchAndValidateConfigs()
        const customApiHost = `${shortCode}.api.commercecloud.salesforce.com`
        const oauthScope = `SALESFORCE_COMMERCE_API:${instanceId} sfcc.custom-apis`

        try {
            // Get OAuth token
            const tokenData = await getOAuthToken(clientId, clientSecret, oauthScope)
            if (!tokenData?.access_token || tokenData.error) {
                throwOAuthError('Invalid OAuth response', tokenData)
            }

            // Call custom API DX endpoint and retrieve custom APIs on the instance
            dxEndpointResponse = await callCustomApiDxEndpoint(
                tokenData.access_token,
                customApiHost,
                organizationId
            )
            if (!dxEndpointResponse.data || dxEndpointResponse.error) {
                throwDxEndpointError('Invalid Custom API DX response', dxEndpointResponse)
            }

            // Create WebDAV client once and reuse it
            const webdavClient = createWebDAVClient(hostname, tokenData.access_token)

            const processedEntries = []
            activeCodeVersion = dxEndpointResponse.activeCodeVersion

            // Process each custom API and attempt to get the schema content from WebDAV
            // If the schema content is not found, still create the entry with content from DX response
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

            result += `Custom APIs Discovered:\n${JSON.stringify(processedEntries, null, 2)}\n\n`
        } catch (error) {
            result += error.message
            // If DX endpoint response is available and contains actual API data, include it
            if (dxEndpointResponse?.data) {
                result +=
                    '\n\nCustom APIs Discovered:\n' +
                    JSON.stringify(dxEndpointResponse.data, null, 2)
            }
        }

        console.error('result', result)
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
