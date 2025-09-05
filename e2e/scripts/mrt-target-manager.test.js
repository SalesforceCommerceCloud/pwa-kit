/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const MRTTargetManager = require('./mrt-target-manager')
const SecureS3Client = require('./aws-s3-client')
const fs = require('fs-extra')
const {Command} = require('commander')
const {
    PWA_KIT_BOT_USER_SESSION,
    CI_AVAILABILITY_AVAILABLE,
    CI_AVAILABILITY_IN_USE,
    AWS_S3_ERR_NO_SUCH_KEY,
    AWS_S3_ERR_PRECONDITION_FAILED
} = require('./constants')

// Mock dependencies
jest.mock('./aws-s3-client')
jest.mock('fs-extra')
jest.mock('commander')

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('MRTTargetManager', () => {
    let manager
    let mockS3Client
    let mockFs

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Mock console methods
        console.log = jest.fn()
        console.error = jest.fn()

        // Setup mock S3 client
        mockS3Client = {
            initialize: jest.fn(),
            download: jest.fn(),
            upload: jest.fn()
        }
        SecureS3Client.mockImplementation(() => mockS3Client)

        // Setup mock fs
        mockFs = {
            ensureFile: jest.fn(),
            writeJson: jest.fn()
        }
        fs.ensureFile = mockFs.ensureFile
        fs.writeJson = mockFs.writeJson

        // Mock process.env - default to non-CI environment
        process.env.CI = 'false'
        process.env.GITHUB_PR_NUMBER = '123'
    })

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog
        console.error = originalConsoleError

        // Reset process.env
        delete process.env.CI
        delete process.env.GITHUB_PR_NUMBER
    })

    describe('constructor', () => {
        test('should create instance with custom options', () => {
            delete process.env.CI

            const options = {
                bucket: 'test-bucket',
                poolDataFileKey: 'test-key',
                maxRetries: 2,
                retryDelay: 100,
                prNumber: '456',
                branch: 'feature/test',
                runId: 'run-789',
                region: 'us-west-2',
                roleArn: 'arn:aws:iam::123456789012:role/test-role',
                externalId: 'test-external-id'
            }

            manager = new MRTTargetManager(options)

            expect(manager.bucket).toBe(options.bucket)
            expect(manager.poolDataFileKey).toBe(options.poolDataFileKey)
            expect(manager.maxRetries).toBe(options.maxRetries)
            expect(manager.retryDelay).toBe(options.retryDelay)
            expect(manager.prNumber).toBe(options.prNumber)
            expect(manager.branch).toBe(options.branch)
            expect(manager.runId).toBe(options.runId)
        })

        test('should use roleArn when not in CI', () => {
            delete process.env.CI

            const options = {
                roleArn: 'arn:aws:iam::123456789012:role/test-role',
                externalId: 'test-external-id'
            }

            manager = new MRTTargetManager(options)

            expect(SecureS3Client).toHaveBeenCalledWith({
                region: undefined,
                readOnly: true,
                roleArn: options.roleArn,
                roleSessionName: PWA_KIT_BOT_USER_SESSION,
                externalId: options.externalId
            })
        })

        test('should not use roleArn when in CI', () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const options = {
                roleArn: 'arn:aws:iam::123456789012:role/test-role'
            }

            manager = new MRTTargetManager(options)

            expect(SecureS3Client).toHaveBeenCalledWith({
                region: undefined,
                readOnly: false,
                roleArn: null,
                roleSessionName: PWA_KIT_BOT_USER_SESSION,
                externalId: undefined
            })

            // Reset to original value
            process.env.CI = originalCI
        })
    })

    describe('initialize', () => {
        beforeEach(() => {
            manager = new MRTTargetManager()
        })

        test('should initialize S3 client', async () => {
            await manager.initialize()

            expect(mockS3Client.initialize).toHaveBeenCalled()
        })
    })

    describe('streamToString', () => {
        beforeEach(() => {
            manager = new MRTTargetManager()
        })

        test('should convert stream to string', async () => {
            const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                    yield Buffer.from('Hello ')
                    yield Buffer.from('World')
                }
            }

            const result = await manager.streamToString(mockStream)

            expect(result).toBe('Hello World')
        })
    })

    describe('downloadPoolFile', () => {
        beforeEach(() => {
            manager = new MRTTargetManager({
                bucket: 'test-bucket',
                poolDataFileKey: 'test-key'
            })
        })

        test('should successfully download and parse pool file', async () => {
            const mockPoolData = {
                environments: [
                    {slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE},
                    {slug: 'env2', ciAvailability: CI_AVAILABILITY_IN_USE}
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                lastModified: new Date(),
                contentType: 'application/json',
                contentLength: 100
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const result = await manager.downloadPoolFile()

            expect(mockS3Client.download).toHaveBeenCalledWith('test-bucket', 'test-key')
            expect(result).toEqual({
                ...mockDownloadResult,
                poolData: mockPoolData
            })
        })

        test('should throw error when pool file not found', async () => {
            const error = new Error('File not found')
            error.name = AWS_S3_ERR_NO_SUCH_KEY
            mockS3Client.download.mockRejectedValue(error)

            await expect(manager.downloadPoolFile()).rejects.toThrow('File not found')
            expect(console.log).toHaveBeenCalledWith('❌ Pool file not found.')
        })

        test('should throw error for other download failures', async () => {
            const error = new Error('Download failed')
            mockS3Client.download.mockRejectedValue(error)

            await expect(manager.downloadPoolFile()).rejects.toThrow('Download failed')
        })
    })

    describe('findAvailableEnvironment', () => {
        beforeEach(() => {
            manager = new MRTTargetManager()
        })

        test('should find first available environment', () => {
            const poolData = {
                environments: [
                    {slug: 'env1', ciAvailability: CI_AVAILABILITY_IN_USE},
                    {slug: 'env2', ciAvailability: CI_AVAILABILITY_AVAILABLE},
                    {slug: 'env3', ciAvailability: CI_AVAILABILITY_AVAILABLE}
                ]
            }

            const result = manager.findAvailableEnvironment(poolData)

            expect(result).toEqual({slug: 'env2', ciAvailability: CI_AVAILABILITY_AVAILABLE})
        })

        test('should return null when no available environments', () => {
            const poolData = {
                environments: [
                    {slug: 'env1', ciAvailability: CI_AVAILABILITY_IN_USE},
                    {slug: 'env2', ciAvailability: CI_AVAILABILITY_IN_USE}
                ]
            }

            const result = manager.findAvailableEnvironment(poolData)

            expect(result).toBeNull()
        })

        test('should return null when no environments', () => {
            const poolData = {
                environments: []
            }

            const result = manager.findAvailableEnvironment(poolData)

            expect(result).toBeNull()
        })
    })

    describe('updateMRTTargetStatus', () => {
        beforeEach(() => {
            manager = new MRTTargetManager({
                prNumber: '123',
                branch: 'feature/test',
                runId: 'run-456'
            })
        })

        test('should mark environment as in-use', () => {
            const poolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE}]
            }

            const environment = {slug: 'env1'}

            const result = manager.updateMRTTargetStatus(
                poolData,
                environment,
                CI_AVAILABILITY_IN_USE
            )

            expect(result.environments[0]).toEqual({
                slug: 'env1',
                ciAvailability: CI_AVAILABILITY_IN_USE,
                ciLastUsed: expect.any(String),
                ciRunInfo: {
                    ciAcquiredAt: expect.any(String),
                    prNumber: '123',
                    branch: 'feature/test',
                    runId: 'run-456'
                }
            })
        })

        test('should mark environment as available', () => {
            const poolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE,
                        ciRunInfo: {prNumber: '123'}
                    }
                ]
            }

            const environment = {slug: 'env1'}

            const result = manager.updateMRTTargetStatus(
                poolData,
                environment,
                CI_AVAILABILITY_AVAILABLE
            )

            expect(result.environments[0]).toEqual({
                slug: 'env1',
                ciAvailability: CI_AVAILABILITY_AVAILABLE,
                ciLastUsed: expect.any(String)
            })
            expect(result.environments[0].ciRunInfo).toBeUndefined()
        })

        test('should not update other environments', () => {
            const poolData = {
                environments: [
                    {slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE},
                    {slug: 'env2', ciAvailability: CI_AVAILABILITY_IN_USE}
                ]
            }

            const environment = {slug: 'env1'}

            const result = manager.updateMRTTargetStatus(
                poolData,
                environment,
                CI_AVAILABILITY_IN_USE
            )

            expect(result.environments[1]).toEqual({
                slug: 'env2',
                ciAvailability: CI_AVAILABILITY_IN_USE
            })
        })
    })

    describe('getPoolStatus', () => {
        beforeEach(() => {
            manager = new MRTTargetManager({
                bucket: 'test-bucket',
                poolDataFileKey: 'test-key'
            })
        })

        test('should return pool status with counts', async () => {
            const mockPoolData = {
                environments: [
                    {slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE},
                    {slug: 'env2', ciAvailability: CI_AVAILABILITY_IN_USE},
                    {slug: 'env3', ciAvailability: CI_AVAILABILITY_AVAILABLE}
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                lastModified: new Date(),
                contentType: 'application/json',
                contentLength: 100,
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const result = await manager.getPoolStatus()

            expect(result).toEqual({
                total: 3,
                available: 2,
                inUse: 1,
                environments: mockPoolData.environments
            })
        })

        test('should throw error when download fails', async () => {
            const error = new Error('Download failed')
            mockS3Client.download.mockRejectedValue(error)

            await expect(manager.getPoolStatus()).rejects.toThrow('Download failed')
            expect(console.error).toHaveBeenCalledWith('❌ Failed to get pool status:', error)
        })
    })

    describe('acquireEnvironment', () => {
        beforeEach(() => {
            manager = new MRTTargetManager({
                bucket: 'test-bucket',
                poolDataFileKey: 'test-key',
                prNumber: '123'
            })
        })

        test('should throw error when not in CI', async () => {
            delete process.env.CI

            await expect(manager.acquireEnvironment()).rejects.toThrow(
                '❌ Cannot acquire environment in local development - Read only access'
            )
        })

        test('should successfully acquire environment on first attempt', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE}]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)
            mockS3Client.upload.mockResolvedValue({})

            const result = await manager.acquireEnvironment()

            expect(result).toEqual({
                environment: {slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE},
                poolData: expect.any(Object),
                attempt: 1
            })
            expect(console.log).toHaveBeenCalledWith(
                '🎯 Attempting to acquire environment for PR #123'
            )
            expect(console.log).toHaveBeenCalledWith('✅ Successfully acquired environment: env1')

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should retry on ETag mismatch', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'
            manager.maxRetries = 2
            manager.retryDelay = 100 // Set a short delay for testing

            const mockPoolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE}]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            // First attempt fails with ETag mismatch
            const etagError = new Error('Precondition failed')
            etagError.name = AWS_S3_ERR_PRECONDITION_FAILED
            mockS3Client.upload.mockRejectedValueOnce(etagError)

            // Second attempt succeeds
            mockS3Client.upload.mockResolvedValueOnce({})

            const result = await manager.acquireEnvironment()

            expect(result.attempt).toBe(2)
            expect(console.log).toHaveBeenCalledWith('⚠️ ETag mismatch on attempt 1, retrying...')

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw error when no available environments', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_IN_USE}]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            await expect(manager.acquireEnvironment()).rejects.toThrow(
                '❌ No available environments found'
            )

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw error after max retries', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'
            manager.maxRetries = 2
            manager.retryDelay = 100 // Set a short delay for testing

            const mockPoolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE}]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const etagError = new Error('Precondition failed')
            etagError.name = AWS_S3_ERR_PRECONDITION_FAILED
            mockS3Client.upload.mockRejectedValue(etagError)

            await expect(manager.acquireEnvironment()).rejects.toThrow(
                '❌ Failed to acquire environment after 2 attempts due to concurrent modifications'
            )

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw non-retryable errors immediately', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [{slug: 'env1', ciAvailability: CI_AVAILABILITY_AVAILABLE}]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const error = new Error('Upload failed')
            mockS3Client.upload.mockRejectedValue(error)

            await expect(manager.acquireEnvironment()).rejects.toThrow('Upload failed')

            // Reset to original value
            process.env.CI = originalCI
        })
    })

    describe('sleep', () => {
        beforeEach(() => {
            manager = new MRTTargetManager()
        })

        test('should delay for specified milliseconds', async () => {
            const start = Date.now()
            await manager.sleep(100)
            const end = Date.now()

            expect(end - start).toBeGreaterThanOrEqual(100)
        })
    })

    describe('releaseEnvironment', () => {
        beforeEach(() => {
            manager = new MRTTargetManager({
                bucket: 'test-bucket',
                poolDataFileKey: 'test-key'
            })
        })

        test('should throw error when not in CI', async () => {
            delete process.env.CI

            await expect(manager.releaseEnvironment('env1')).rejects.toThrow(
                '❌ Cannot release environment in local development - Read only access'
            )
        })

        test('should successfully release environment on first attempt', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE,
                        ciRunInfo: {prNumber: '123'}
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)
            mockS3Client.upload.mockResolvedValue({})

            const result = await manager.releaseEnvironment('env1')

            expect(result).toBe(true)
            expect(console.log).toHaveBeenCalledWith('🔓 Releasing environment: env1')
            expect(console.log).toHaveBeenCalledWith('✅ Successfully released environment: env1')
            expect(mockS3Client.upload).toHaveBeenCalledWith(
                'test-bucket',
                'test-key',
                expect.any(String),
                '"test-etag"'
            )

            // Verify the uploaded data structure
            const uploadCall = mockS3Client.upload.mock.calls[0]
            const uploadedData = JSON.parse(uploadCall[2])
            expect(uploadedData.environments[0].ciAvailability).toBe(CI_AVAILABILITY_AVAILABLE)

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw error when environment not found', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            await expect(manager.releaseEnvironment('env2')).rejects.toThrow(
                '❌ Environment env2 not found'
            )

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should retry on ETag mismatch', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'
            manager.maxRetries = 2
            manager.retryDelay = 100 // Set a short delay for testing

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            // First attempt fails with ETag mismatch
            const etagError = new Error('Precondition failed')
            etagError.name = AWS_S3_ERR_PRECONDITION_FAILED
            mockS3Client.upload.mockRejectedValueOnce(etagError)

            // Second attempt succeeds
            mockS3Client.upload.mockResolvedValueOnce({})

            const result = await manager.releaseEnvironment('env1')

            expect(result).toBe(true)
            expect(console.log).toHaveBeenCalledWith(
                '⚠️ ETag mismatch on release attempt 1, retrying...'
            )

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw error after max retries', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'
            manager.maxRetries = 2
            manager.retryDelay = 100 // Set a short delay for testing

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const etagError = new Error('Precondition failed')
            etagError.name = AWS_S3_ERR_PRECONDITION_FAILED
            mockS3Client.upload.mockRejectedValue(etagError)

            await expect(manager.releaseEnvironment('env1')).rejects.toThrow(
                '❌ Failed to release environment after 2 attempts'
            )

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should throw non-retryable errors immediately', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)

            const error = new Error('Upload failed')
            mockS3Client.upload.mockRejectedValue(error)

            await expect(manager.releaseEnvironment('env1')).rejects.toThrow('Upload failed')

            // Reset to original value
            process.env.CI = originalCI
        })

        test('should properly update environment status to available', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'

            const mockPoolData = {
                environments: [
                    {
                        slug: 'env1',
                        ciAvailability: CI_AVAILABILITY_IN_USE,
                        ciRunInfo: {
                            prNumber: '123',
                            branch: 'feature/test',
                            runId: 'run-456'
                        }
                    }
                ]
            }

            const mockDownloadResult = {
                body: {
                    [Symbol.asyncIterator]: async function* () {
                        yield Buffer.from(JSON.stringify(mockPoolData))
                    }
                },
                etag: '"test-etag"',
                poolData: mockPoolData
            }

            mockS3Client.download.mockResolvedValue(mockDownloadResult)
            mockS3Client.upload.mockResolvedValue({})

            await manager.releaseEnvironment('env1')

            // Verify the upload was called with the correct updated data
            const uploadCall = mockS3Client.upload.mock.calls[0]
            const uploadedData = JSON.parse(uploadCall[2]) // The JSON string passed to upload

            expect(uploadedData.environments[0]).toEqual({
                slug: 'env1',
                ciAvailability: CI_AVAILABILITY_AVAILABLE,
                ciLastUsed: expect.any(String)
            })
            expect(uploadedData.environments[0].ciRunInfo).toBeUndefined()

            // Reset to original value
            process.env.CI = originalCI
        })
    })

    describe('CLI integration', () => {
        let mockProgram
        let mockCommand

        beforeEach(() => {
            mockCommand = {
                description: jest.fn().mockReturnThis(),
                option: jest.fn().mockReturnThis(),
                argument: jest.fn().mockReturnThis(),
                action: jest.fn().mockReturnThis(),
                opts: jest.fn().mockReturnValue({})
            }

            mockProgram = {
                description: jest.fn().mockReturnThis(),
                option: jest.fn().mockReturnThis(),
                command: jest.fn().mockReturnValue(mockCommand),
                parseAsync: jest.fn().mockResolvedValue()
            }

            Command.mockImplementation(() => mockProgram)
        })

        test('should set up status command', async () => {
            // Mock the main function execution
            const {main} = require('./mrt-target-manager')
            await main()

            expect(mockProgram.command).toHaveBeenCalledWith('status')
            expect(mockCommand.description).toHaveBeenCalledWith('Show pool status')
        })

        test('should set up acquire command', async () => {
            // Mock the main function execution
            const {main} = require('./mrt-target-manager')
            await main()

            expect(mockProgram.command).toHaveBeenCalledWith('acquire')
            expect(mockCommand.description).toHaveBeenCalledWith('Acquire an MRT environment')
        })

        test('should set up release command', async () => {
            // Mock the main function execution
            const {main} = require('./mrt-target-manager')
            await main()

            expect(mockProgram.command).toHaveBeenCalledWith('release')
            expect(mockCommand.description).toHaveBeenCalledWith('Release an MRT environment')
            expect(mockCommand.argument).toHaveBeenCalledWith('<slug>', 'Environment Id to release')
        })
    })
})
