/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const {S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3')
const {STSClient, AssumeRoleCommand} = require('@aws-sdk/client-sts')

const {
    PWA_KIT_BOT_USER_SESSION,
    AWS_ACCESS_READ_ONLY,
    AWS_ACCESS_READ_WRITE,
    AWS_DEFAULT_REGION
} = require('./constants')

class SecureS3Client {
    constructor(options = {}) {
        this.roleArn = options.roleArn
        this.roleSessionName = options.roleSessionName || PWA_KIT_BOT_USER_SESSION
        this.region = options.region || AWS_DEFAULT_REGION
        this.readOnly = options.readOnly
        this.externalId = options.externalId
        this.credentials = null
    }

    /**
     * Initializes the S3 client with credentials. If running the script locally, you must provide credentials and roleArn for cc-pwa-kit-bot user.
     * If running the script in Github Actions, AWS credentials action automatically authenticates using OIDC and handles the role assumption.
     */
    async initialize() {
        if (this.roleArn) {
            await this._assumeRole()
        }

        // Create S3 client after role assumption
        this.s3 = new S3Client({
            region: this.region,
            credentials: this.credentials
        })

        console.log(
            `🔐 Using ${this.readOnly ? AWS_ACCESS_READ_ONLY : AWS_ACCESS_READ_WRITE} access`
        )
    }

    /**
     * Assumes the role for the cc-pwa-kit-bot user based on the roleArn provided.
     * @throws {Error} - If the role assumption fails.
     */
    async _assumeRole() {
        try {
            const sts = new STSClient({region: this.region})

            /**
             * Authentication for GithubActions user is handled via OIDC and does not require an external ID.
             */
            const command = new AssumeRoleCommand({
                RoleArn: this.roleArn,
                RoleSessionName: this.roleSessionName,
                DurationSeconds: 3600,
                ...(!process.env.CI && {ExternalId: this.externalId})
            })

            const data = await sts.send(command)

            this.credentials = {
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            }

            console.log('✅ Successfully assumed role')
        } catch (error) {
            console.error('❌ Failed to assume role:', error)
            throw error
        }
    }

    /**
     * Uploads a file to S3 with the ETag precondition to ensure the file is not modified by another process.
     * If the file is modified by another process,
     * the upload will fail with an ETag mismatch error.
     *
     * @param {string} bucket - The name of the bucket to upload to.
     * @param {string} key - The key to upload the file to.
     * @param {Buffer|Stream} body - The file to upload.
     * @param {string} expectedETag - The ETag of the file to upload.
     * @returns {Promise<Object>} - The result of the upload.
     * @throws {Error} - If the upload fails.
     */
    async upload(bucket, key, body, expectedETag = null) {
        if (this.readOnly) {
            throw new Error('❌ Upload not allowed - read-only access')
        }

        try {
            console.log(
                `📤 Uploading to s3://${bucket}/${key}${
                    expectedETag ? ` with expected ETag: ${expectedETag}` : ''
                }`
            )

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ...(expectedETag && {IfMatch: expectedETag}) // Only include IfMatch if expectedETag is provided
            })

            const result = await this.s3.send(command)

            console.log('✅ Upload successful')
            return result
        } catch (error) {
            if (error.name === 'PreconditionFailedException') {
                console.error(
                    '❌ Upload failed: ETag mismatch - file was modified by another process'
                )
            }
            console.error('❌ Upload failed:', error)
            throw error
        }
    }

    /**
     * Downloads a file from S3 with its ETag.
     * @param {string} bucket - The name of the bucket to download from.
     * @param {string} key - The key of the file to download.
     * @returns {Promise<Object>} - The result of the download.
     * @throws {Error} - If the download fails.
     */
    async download(bucket, key) {
        try {
            console.log(`📥 Downloading from s3://${bucket}/${key}`)

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            })

            const result = await this.s3.send(command)

            console.log('✅ Download successful')
            return {
                body: result.Body,
                etag: result.ETag,
                lastModified: result.LastModified,
                contentType: result.ContentType,
                contentLength: result.ContentLength
            }
        } catch (error) {
            console.error('❌ Download failed:', error)
            throw error
        }
    }
}

module.exports = SecureS3Client
