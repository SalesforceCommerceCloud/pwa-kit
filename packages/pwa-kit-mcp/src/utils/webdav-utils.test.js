/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {jest} from '@jest/globals'

import {
    getDirectoryContents,
    findFolderRecursively,
    getFileContent,
    pathExists
} from './webdav-utils'

jest.mock('webdav', () => {}, {virtual: true})

// Create mock functions outside the factory
const mockGetDirectoryContents = jest.fn()
const mockGetFileContents = jest.fn()
const mockExists = jest.fn()

describe('WebDAV Utils', () => {
    let mockClient

    // Common mock data used across multiple tests
    const mockDirectoryContents = [
        {
            filename: '/test/path/file1.txt',
            basename: 'file1.txt',
            type: 'file'
        },
        {
            filename: '/test/path/folder1',
            basename: 'folder1',
            type: 'directory'
        },
        {
            filename: '/test/path/script.js',
            basename: 'script.js',
            type: 'file'
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()

        mockClient = {
            getDirectoryContents: mockGetDirectoryContents,
            getFileContents: mockGetFileContents,
            exists: mockExists
        }
    })

    describe('getDirectoryContents', () => {
        it('should return formatted directory contents successfully', async () => {
            const path = '/test/path'

            mockClient.getDirectoryContents.mockResolvedValue(mockDirectoryContents)

            const result = await getDirectoryContents(mockClient, path)

            expect(mockClient.getDirectoryContents).toHaveBeenCalledWith(path)
            expect(result).toEqual(
                mockDirectoryContents.map((item) => ({
                    filename: item.filename,
                    basename: item.basename,
                    isDirectory: item.type === 'directory'
                }))
            )
        })

        it('should return empty array when getDirectoryContents fails', async () => {
            const path = '/invalid/path'
            const error = new Error('Directory not found')

            mockClient.getDirectoryContents.mockRejectedValue(error)

            const result = await getDirectoryContents(mockClient, path)

            expect(result).toEqual([])
        })
    })

    describe('findFolderRecursively', () => {
        it('should find target folder recursively', async () => {
            const basePath = '/test'
            const targetFolderName = 'target'
            const mockContents = [
                {
                    filename: '/test/other',
                    basename: 'other',
                    type: 'directory'
                },
                {
                    filename: '/test/target',
                    basename: 'target',
                    type: 'directory'
                },
                {
                    filename: '/test/file.txt',
                    basename: 'file.txt',
                    type: 'file'
                }
            ]

            mockClient.getDirectoryContents
                .mockResolvedValueOnce(mockContents) // First call for base path
                .mockResolvedValueOnce([]) // Call for 'other' directory
                .mockResolvedValueOnce([]) // Call for 'target' directory

            const result = await findFolderRecursively(mockClient, basePath, targetFolderName)

            expect(result).toEqual([
                {
                    path: '/test/target',
                    basename: 'target'
                }
            ])
        })

        it('should return empty array when search fails', async () => {
            const basePath = '/invalid'
            const targetFolderName = 'target'
            const error = new Error('Access denied')

            mockClient.getDirectoryContents.mockRejectedValue(error)

            const result = await findFolderRecursively(mockClient, basePath, targetFolderName)

            expect(result).toEqual([])
        })
    })

    describe('getFileContent', () => {
        it('should return file content successfully', async () => {
            const filePath = '/test/file.txt'
            const mockContent = 'Hello, World!\nThis is a test file.'

            mockClient.getFileContents.mockResolvedValue(mockContent)

            const result = await getFileContent(mockClient, filePath)

            expect(mockClient.getFileContents).toHaveBeenCalledWith(filePath, {format: 'text'})
            expect(result).toBe(mockContent)
        })

        it('should return null when file content retrieval fails', async () => {
            const filePath = '/test/nonexistent.txt'
            const error = new Error('File not found')

            mockClient.getFileContents.mockRejectedValue(error)

            const result = await getFileContent(mockClient, filePath)

            expect(result).toBeNull()
        })
    })

    describe('pathExists', () => {
        it('should return true when path exists', async () => {
            const path = '/test/existing-path'

            mockClient.exists.mockResolvedValue(true)

            const result = await pathExists(mockClient, path)

            expect(mockClient.exists).toHaveBeenCalledWith(path)
            expect(result).toBe(true)
        })

        it('should return false when path does not exist or check fails', async () => {
            const path = '/test/nonexistent-path'
            const error = new Error('Path check failed')

            mockClient.exists.mockRejectedValue(error)

            const result = await pathExists(mockClient, path)

            expect(result).toBe(false)
        })
    })
})
