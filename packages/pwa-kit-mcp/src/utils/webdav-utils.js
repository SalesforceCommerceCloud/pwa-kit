/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export function parseWebDAVResponse(xmlText) {
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
export function isDirectoryInWebDAVResponse(xmlText, href) {
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
export function parseWebDAVResponseAll(xmlText) {
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
