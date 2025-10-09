/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createClient} from 'webdav'
import {logMCPMessage} from './utils.js'

/**
 * Create WebDAV client with authentication
 */
export function createWebDAVClient(hostname, accessToken) {
    try {
        return createClient(hostname, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
    } catch (error) {
        throw new Error('Error creating WebDAV client: ' + error.message)
    }
}

/**
 * Get directory contents using WebDAV client
 */
export async function getDirectoryContents(client, path) {
    try {
        const contents = await client.getDirectoryContents(path)
        return contents.map((item) => ({
            filename: item.filename,
            basename: item.basename,
            isDirectory: item.type === 'directory'
        }))
    } catch (error) {
        logMCPMessage('Error getting directory contents: ' + error.message)
        return []
    }
}

/**
 * Recursively search for a specific folder in WebDAV
 */
export async function findFolderRecursively(client, basePath, targetFolderName) {
    const results = []

    try {
        const contents = await getDirectoryContents(client, basePath)

        for (const item of contents) {
            if (item.isDirectory) {
                // Check if this directory matches our target
                if (item.basename.toLowerCase() === targetFolderName.toLowerCase()) {
                    results.push({
                        path: item.filename,
                        basename: item.basename
                    })
                }

                // Recursively search subdirectories
                const subResults = await findFolderRecursively(
                    client,
                    item.filename,
                    targetFolderName
                )
                results.push(...subResults)
            }
        }
    } catch (error) {
        logMCPMessage('Error searching in ' + basePath + ': ' + error.message)
    }

    return results
}

/**
 * Get file content from WebDAV
 */
export async function getFileContent(client, filePath) {
    try {
        const content = await client.getFileContents(filePath, {format: 'text'})
        return content
    } catch (error) {
        logMCPMessage('Error getting file content from ' + filePath + ': ' + error.message)
        return null
    }
}

/**
 * Check if a path exists in WebDAV
 */
export async function pathExists(client, path) {
    try {
        return await client.exists(path)
    } catch (error) {
        logMCPMessage('Error checking if path exists ' + path + ': ' + error.message)
        return false
    }
}
