/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {logMCPMessage} from './utils.js'

/**
 * Create WebDAV client with authentication
 */
function isDirectoryInWebDAVResponse(xmlText, href) {
    // Find the response block for this href and check for <D:resourcetype><D:collection/>
    const responseRegex = new RegExp(
        `<response>[\\s\\S]*?<href>${href.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
            // eslint-disable-next-line no-useless-escape
        )}<\/href>[\\s\\S]*?<\/response>`,
        'g'
    )
    const responseMatch = xmlText.match(responseRegex)

    if (responseMatch) {
        const responseBlock = responseMatch[0]
        // Check if this response contains <resourcetype><collection/> (self-closing tag)
        return responseBlock.includes('<resourcetype><collection/>')
    }
    return false
}

/**
 * Parse WebDAV XML response to extract directory names only
 * @param {string} xmlText - The XML response text from WebDAV PROPFIND request
 * @returns {string[]} Array of directory names found in the WebDAV response
 */
export function parseWebDAVDirectories(xmlText) {
    const items = []
    const regex = /<href>([^<]+)<\/href>/g
    let match

    try {
        while ((match = regex.exec(xmlText)) !== null) {
            const href = match[1]
            const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href
            const pathParts = cleanHref.split('/')

            if (pathParts.length > 0) {
                const name = pathParts[pathParts.length - 1]
                if (name && name !== '') {
                    const isDirectory = isDirectoryInWebDAVResponse(xmlText, href)
                    if (isDirectory) {
                        items.push(name)
                    }
                }
            }
        }
    } catch (error) {
        logMCPMessage(`Error parsing WebDAV directories: ${error}`)
        return []
    }
    return items
}

/**
 * Parse WebDAV XML response to extract all items (both files and directories)
 * @param {string} xmlText - The XML response text from WebDAV PROPFIND request
 * @returns {string[]} Array of all item names (files and directories) found in the WebDAV response
 */
export function parseWebDAVResponse(xmlText) {
    const items = []
    const regex = /<href>([^<]+)<\/href>/g
    let match

    try {
        while ((match = regex.exec(xmlText)) !== null) {
            const href = match[1]
            const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href
            const pathParts = cleanHref.split('/')

            if (pathParts.length > 0) {
                const name = pathParts[pathParts.length - 1]
                if (name && name !== '') {
                    items.push(name)
                }
            }
        }
    } catch (error) {
        logMCPMessage(`Error parsing WebDAV response: ${error}`)
        return []
    }
    return items
}

/**
 * Validates WebDAV response and throws error if not successful
 * @param {Response} response - The fetch response object from WebDAV request
 * @throws {Error} If response status is not successful
 */
export function validateWebDAVResponse(response) {
    if (!response.ok) {
        throw new Error(
            `WebDAV HTTP error. Status: ${response.status}. Description: ${response.statusText}.`
        )
    }
}

/**
 * Makes a WebDAV PROPFIND request to list directory contents
 * @param {string} url - The WebDAV URL to perform PROPFIND on
 * @param {string} accessToken - The OAuth access token for authentication
 * @returns {Promise<Response>} The fetch response object
 */
export async function makeWebDAVPropfindRequest(url, accessToken) {
    const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
            'Content-Type': 'application/xml',
            Authorization: `Bearer ${accessToken}`,
            Depth: '1'
        }
    })
    return response
}

/**
 * Makes a WebDAV GET request to retrieve file contents
 * @param {string} url - The WebDAV URL to retrieve content from
 * @param {string} accessToken - The OAuth access token for authentication
 * @returns {Promise<Response>} The fetch response object
 */
export async function makeWebDAVGetRequest(url, accessToken) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/xml'
        }
    })
    return response
}
