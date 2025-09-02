/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const {S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3')
const {STSClient, AssumeRoleCommand} = require('@aws-sdk/client-sts')
const SecureS3Client = require('./aws-s3-client')
const {PWA_KIT_BOT_USER_SESSION, AWS_ACCESS_READ_WRITE, AWS_DEFAULT_REGION} = require('./constants')

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-s3')
jest.mock('@aws-sdk/client-sts')

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('SecureS3Client', () => {
    let client
    let mockS3Client
    let mockSTSClient

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Mock console methods
        console.log = jest.fn()
        console.error = jest.fn()

        // Setup mock S3 client
        mockS3Client = {
            send: jest.fn()
        }
        S3Client.mockImplementation(() => mockS3Client)

        // Setup mock STS client
        mockSTSClient = {
            send: jest.fn()
        }
        STSClient.mockImplementation(() => mockSTSClient)
    })

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog
        console.error = originalConsoleError
    })

    describe('constructor', () => {
        test('should create instance with default options', () => {
            client = new SecureS3Client()

            expect(client.roleArn).toBeUndefined()
            expect(client.roleSessionName).toBe(PWA_KIT_BOT_USER_SESSION)
            expect(client.region).toBe(AWS_DEFAULT_REGION)
            expect(client.readOnly).toBeUndefined()
            expect(client.externalId).toBeUndefined()
            expect(client.credentials).toBeNull()
        })

        test('should create instance with custom options', () => {
            const options = {
                roleArn: 'arn:aws:iam::123456789012:role/test-role',
                roleSessionName: 'test-session',
                region: 'us-west-2',
                readOnly: true,
                externalId: 'test-external-id'
            }

            client = new SecureS3Client(options)

            expect(client.roleArn).toBe(options.roleArn)
            expect(client.roleSessionName).toBe(options.roleSessionName)
            expect(client.region).toBe(options.region)
            expect(client.readOnly).toBe(options.readOnly)
            expect(client.externalId).toBe(options.externalId)
        })
    })

    describe('initialize', () => {
        beforeEach(() => {
            client = new SecureS3Client()
        })

        test('should initialize without role assumption when roleArn is not provided', async () => {
            const mockAssumeRole = jest.spyOn(client, '_assumeRole')

            await client.initialize()

            expect(mockAssumeRole).not.toHaveBeenCalled()
            expect(S3Client).toHaveBeenCalledWith({
                region: AWS_DEFAULT_REGION,
                credentials: null
            })
            expect(console.log).toHaveBeenCalledWith(`🔐 Using ${AWS_ACCESS_READ_WRITE} access`)
        })

        test('should initialize with role assumption when roleArn is provided', async () => {
            client.roleArn = 'arn:aws:iam::123456789012:role/test-role'
            const mockAssumeRole = jest.spyOn(client, '_assumeRole').mockResolvedValue()

            await client.initialize()

            expect(mockAssumeRole).toHaveBeenCalled()
            expect(S3Client).toHaveBeenCalledWith({
                region: AWS_DEFAULT_REGION,
                credentials: null
            })
        })
    })

    describe('_assumeRole', () => {
        beforeEach(() => {
            client = new SecureS3Client({
                roleArn: 'arn:aws:iam::123456789012:role/test-role',
                region: 'us-west-2'
            })
        })

        test('should successfully assume role', async () => {
            const mockCredentials = {
                AccessKeyId: 'test-access-key',
                SecretAccessKey: 'test-secret-key',
                SessionToken: 'test-session-token'
            }

            mockSTSClient.send.mockResolvedValue({
                Credentials: mockCredentials
            })

            await client._assumeRole()

            expect(STSClient).toHaveBeenCalledWith({region: 'us-west-2'})
            expect(AssumeRoleCommand).toHaveBeenCalledWith({
                RoleArn: 'arn:aws:iam::123456789012:role/test-role',
                RoleSessionName: PWA_KIT_BOT_USER_SESSION,
                DurationSeconds: 3600
            })
            expect(mockSTSClient.send).toHaveBeenCalled()
            expect(client.credentials).toEqual({
                accessKeyId: mockCredentials.AccessKeyId,
                secretAccessKey: mockCredentials.SecretAccessKey,
                sessionToken: mockCredentials.SessionToken
            })
            expect(console.log).toHaveBeenCalledWith('✅ Successfully assumed role')
        })

        // TODO: Remove skip before merging when we flip process.env.CI to false locally.
        test('should not include ExternalId when running in CI', async () => {
            const originalCI = process.env.CI
            process.env.CI = 'true'
            client.externalId = 'test-external-id'

            mockSTSClient.send.mockResolvedValue({
                Credentials: {
                    AccessKeyId: 'test-access-key',
                    SecretAccessKey: 'test-secret-key',
                    SessionToken: 'test-session-token'
                }
            })

            await client._assumeRole()

            expect(AssumeRoleCommand).toHaveBeenCalledWith({
                RoleArn: 'arn:aws:iam::123456789012:role/test-role',
                RoleSessionName: PWA_KIT_BOT_USER_SESSION,
                DurationSeconds: 3600
            })

            process.env.CI = originalCI
        })

        test('should throw error when role assumption fails', async () => {
            const error = new Error('Role assumption failed')
            mockSTSClient.send.mockRejectedValue(error)

            await expect(client._assumeRole()).rejects.toThrow('Role assumption failed')
            expect(console.error).toHaveBeenCalledWith('❌ Failed to assume role:', error)
        })
    })

    describe('upload', () => {
        beforeEach(async () => {
            client = new SecureS3Client()
            await client.initialize()
        })

        test('should successfully upload file with ETag', async () => {
            const mockResult = {ETag: '"test-etag"'}
            mockS3Client.send.mockResolvedValue(mockResult)

            const result = await client.upload('test-bucket', 'test-key', 'test-body', 'test-etag')

            expect(PutObjectCommand).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-key',
                Body: 'test-body',
                IfMatch: 'test-etag'
            })
            expect(result).toBe(mockResult)
            expect(console.log).toHaveBeenCalledWith(
                '📤 Uploading to s3://test-bucket/test-key with expected ETag: test-etag'
            )
        })

        test('should throw error when upload fails', async () => {
            const error = new Error('Upload failed')
            mockS3Client.send.mockRejectedValue(error)

            await expect(client.upload('test-bucket', 'test-key', 'test-body')).rejects.toThrow(
                'Upload failed'
            )
            expect(console.error).toHaveBeenCalledWith('❌ Upload failed:', error)
        })

        test('should handle PreconditionFailedException specifically', async () => {
            const error = new Error('Precondition failed')
            error.name = 'PreconditionFailedException'
            mockS3Client.send.mockRejectedValue(error)

            await expect(client.upload('test-bucket', 'test-key', 'test-body')).rejects.toThrow(
                'Precondition failed'
            )
            expect(console.error).toHaveBeenCalledWith(
                '❌ Upload failed: ETag mismatch - file was modified by another process'
            )
            expect(console.error).toHaveBeenCalledWith('❌ Upload failed:', error)
        })
    })

    describe('download', () => {
        beforeEach(async () => {
            client = new SecureS3Client()
            await client.initialize()
        })

        test('should successfully download file', async () => {
            const mockResult = {
                Body: 'test-body',
                ETag: '"test-etag"',
                LastModified: new Date('2023-01-01'),
                ContentType: 'application/json',
                ContentLength: 100
            }
            mockS3Client.send.mockResolvedValue(mockResult)

            const result = await client.download('test-bucket', 'test-key')

            expect(GetObjectCommand).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-key'
            })
            expect(mockS3Client.send).toHaveBeenCalled()
            expect(result).toEqual({
                body: mockResult.Body,
                etag: mockResult.ETag,
                lastModified: mockResult.LastModified,
                contentType: mockResult.ContentType,
                contentLength: mockResult.ContentLength
            })
            expect(console.log).toHaveBeenCalledWith(
                '📥 Downloading from s3://test-bucket/test-key'
            )
            expect(console.log).toHaveBeenCalledWith('✅ Download successful')
        })

        test('should throw error when download fails', async () => {
            const error = new Error('Download failed')
            mockS3Client.send.mockRejectedValue(error)

            await expect(client.download('test-bucket', 'test-key')).rejects.toThrow(
                'Download failed'
            )
            expect(console.error).toHaveBeenCalledWith('❌ Download failed:', error)
        })
    })

    describe('integration scenarios', () => {
        test('should handle full workflow with role assumption and upload', async () => {
            client = new SecureS3Client({
                roleArn: 'arn:aws:iam::123456789012:role/test-role',
                readOnly: false
            })

            // Mock role assumption
            const mockCredentials = {
                AccessKeyId: 'test-access-key',
                SecretAccessKey: 'test-secret-key',
                SessionToken: 'test-session-token'
            }
            mockSTSClient.send.mockResolvedValue({
                Credentials: mockCredentials
            })

            // Mock upload
            const mockUploadResult = {ETag: '"upload-etag"'}
            mockS3Client.send.mockResolvedValue(mockUploadResult)

            await client.initialize()
            const result = await client.upload('test-bucket', 'test-key', 'test-body')

            expect(client.credentials).toEqual({
                accessKeyId: mockCredentials.AccessKeyId,
                secretAccessKey: mockCredentials.SecretAccessKey,
                sessionToken: mockCredentials.SessionToken
            })
            expect(result).toBe(mockUploadResult)
        })

        test('should handle read-only client correctly', async () => {
            client = new SecureS3Client({readOnly: true})
            await client.initialize()

            // Should allow download
            const mockDownloadResult = {
                Body: 'test-body',
                ETag: '"test-etag"',
                LastModified: new Date(),
                ContentType: 'text/plain',
                ContentLength: 50
            }
            mockS3Client.send.mockResolvedValue(mockDownloadResult)

            const downloadResult = await client.download('test-bucket', 'test-key')
            expect(downloadResult.body).toBe(mockDownloadResult.Body)

            // Should reject upload
            await expect(client.upload('test-bucket', 'test-key', 'test-body')).rejects.toThrow(
                '❌ Upload not allowed - read-only access'
            )
        })
    })
})
