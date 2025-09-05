/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const SecureS3Client = require('./aws-s3-client')
const {Command} = require('commander')
const fs = require('fs-extra')
const {MRT_TARGET_DETAILS_FILE} = require('../config')
const {
    GITHUB_ACTIONS_E2E_SESSION,
    PWA_KIT_BOT_USER_SESSION,
    CI_AVAILABILITY_AVAILABLE,
    CI_AVAILABILITY_IN_USE,
    AWS_S3_ERR_NO_SUCH_KEY,
    AWS_S3_ERR_PRECONDITION_FAILED,
    ACQUIRE_TARGET_STATUS_SUCCESS,
    ACQUIRE_TARGET_STATUS_FAILED
} = require('./constants')

class MRTTargetManager {
    constructor(options = {}) {
        this.bucket = options.bucket
        this.poolDataFileKey = options.poolDataFileKey
        this.maxRetries = options.maxRetries || 3
        this.retryDelay = options.retryDelay || 10000 // 10 seconds
        this.prNumber = options.prNumber || process.env.GITHUB_PR_NUMBER || null
        this.branch = options.branch || null
        this.runId = options.runId || null
        this.s3Client = new SecureS3Client({
            region: options.region,
            readOnly: !process.env.CI,
            roleArn: process.env.CI ? null : options.roleArn, // Don't use role ARN in CI since AWS credentials action handles it
            roleSessionName: options.roleSessionName || PWA_KIT_BOT_USER_SESSION,
            externalId: options.externalId
        })
    }

    async initialize() {
        await this.s3Client.initialize()
    }

    /**
     * Convert a ReadableStream object returned by the S3 client to a string
     * @param {Stream} stream - The stream to convert
     * @returns {Promise<string>} - The string representation of the stream
     */
    async streamToString(stream) {
        const chunks = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        return Buffer.concat(chunks).toString()
    }

    /**
     * Download the pool file from S3 and return data with ETag
     * @returns {Promise<{body: StreamingBlobPayloadOutputTypes, etag: string, lastModified: Date, contentType: string, contentLength: number, poolData: Object}>} - S3 response properties and pool data
     * @throws {Error} - If the pool file is not found or there is an error (e.g. authentication issues) downloading it.
     */
    async downloadPoolFile() {
        try {
            const downloadResult = await this.s3Client.download(this.bucket, this.poolDataFileKey)
            // Convert stream to string and parse JSON
            const contentString = await this.streamToString(downloadResult.body)
            const poolData = JSON.parse(contentString)

            return {
                ...downloadResult,
                poolData
            }
        } catch (error) {
            if (error.name === AWS_S3_ERR_NO_SUCH_KEY) {
                console.log('❌ Pool file not found.')
            }
            throw error
        }
    }

    /**
     * Find an available environment in the pool data.
     * @param {Object} poolData - The pool data to search in
     * @returns {Object} - The first available environment or null if no available environments are found.
     */
    findAvailableEnvironment(poolData) {
        const availableEnvs = poolData.environments.filter(
            (env) => env.ciAvailability === CI_AVAILABILITY_AVAILABLE
        )

        if (availableEnvs.length === 0) {
            return null
        }

        return availableEnvs[0]
    }

    /**
     * Marks environment as in-use when acquired or available when released by current workflow run.
     * In case of acquiring, it also adds the PR number, branch, and run ID to the environment object.
     * @param {Object} poolData - The pool data array to update.
     * @param {Object} environment - The environment to mark as in-use or available.
     * @param {string} ciAvailability - The availability status of the environment.
     * @returns {Object} - The updated pool data.
     */
    updateMRTTargetStatus(poolData, environment, ciAvailability) {
        const updatedPoolData = {
            ...poolData,
            environments: poolData.environments.map((env) => {
                if (env.slug === environment.slug) {
                    const updatedEnv = {
                        ...env,
                        ciAvailability,
                        ciLastUsed: new Date().toISOString()
                    }

                    if (ciAvailability === CI_AVAILABILITY_IN_USE) {
                        const ciRunInfo = {
                            ciAcquiredAt: new Date().toISOString()
                        }

                        if (this.prNumber) ciRunInfo.prNumber = this.prNumber
                        if (this.branch) ciRunInfo.branch = this.branch
                        if (this.runId) ciRunInfo.runId = this.runId

                        updatedEnv.ciRunInfo = ciRunInfo
                    } else if (ciAvailability === CI_AVAILABILITY_AVAILABLE) {
                        delete updatedEnv.ciRunInfo
                    }

                    return updatedEnv
                }
                return env
            })
        }

        return updatedPoolData
    }

    /**
     * Downloads the pool file and returns the json contents.
     * Also returns the total number of environments, number of available environments, and number of in-use environments.
     * @returns {Promise<Object>} - The pool status.
     * @throws {Error} - If the pool file is not found or there is an error (e.g. authentication issues) downloading it.
     */
    async getPoolStatus() {
        try {
            // Step 1: Download pool file and get ETag
            const downloadResponse = await this.downloadPoolFile()

            const status = {
                total: downloadResponse.poolData.environments.length,
                available: downloadResponse.poolData.environments.filter(
                    (env) => env.ciAvailability === CI_AVAILABILITY_AVAILABLE
                ).length,
                inUse: downloadResponse.poolData.environments.filter(
                    (env) => env.ciAvailability === CI_AVAILABILITY_IN_USE
                ).length,
                environments: downloadResponse.poolData.environments
            }

            return status
        } catch (error) {
            console.error('❌ Failed to get pool status:', error)
            throw error
        }
    }

    /**
     * Acquires an MRT environment with optimistic locking.
     * @returns {Promise<Object>} - Acquired environment details.
     * @throws {Error} - If the environment is not found or there is an error (e.g. authentication issues) acquiring it.
     */
    async acquireEnvironment() {
        if (!process.env.CI) {
            throw new Error(`❌ Cannot acquire environment in local development - Read only access`)
        }
        const prInfo = this.prNumber ? ` for PR #${this.prNumber}` : ` for "${this.branch}" branch`
        console.log(`🎯 Attempting to acquire environment${prInfo}`)

        let retryCount = 0

        while (retryCount < this.maxRetries) {
            try {
                console.log(`\n🔄 Attempt ${retryCount + 1}/${this.maxRetries}`)

                // Step 1: Download pool file and get ETag
                const downloadResponse = await this.downloadPoolFile()

                // Step 2: Find available environment
                const availableEnv = this.findAvailableEnvironment(downloadResponse.poolData)

                if (!availableEnv) {
                    throw new Error(`❌ No available environments found`)
                }

                // Step 3: Mark environment as in-use
                const updatedPoolData = this.updateMRTTargetStatus(
                    downloadResponse.poolData,
                    availableEnv,
                    CI_AVAILABILITY_IN_USE
                )

                // Step 4: Try to upload with ETag precondition
                await this.s3Client.upload(
                    this.bucket,
                    this.poolDataFileKey,
                    JSON.stringify(updatedPoolData, null, 2),
                    downloadResponse.etag
                )

                // Step 5: Success! Return acquired environment
                console.log(`✅ Successfully acquired environment: ${availableEnv.slug}`)
                return {
                    environment: availableEnv,
                    poolData: updatedPoolData,
                    attempt: retryCount + 1
                }
            } catch (error) {
                retryCount++

                if (error.name === AWS_S3_ERR_PRECONDITION_FAILED) {
                    console.log(`⚠️ ETag mismatch on attempt ${retryCount}, retrying...`)

                    if (retryCount < this.maxRetries) {
                        await this.sleep(this.retryDelay)
                        continue
                    } else {
                        throw new Error(
                            `❌ Failed to acquire environment after ${this.maxRetries} attempts due to concurrent modifications`
                        )
                    }
                } else {
                    // Non-retryable error
                    throw error
                }
            }
        }

        throw new Error(`❌ Failed to acquire environment after ${this.maxRetries} attempts`)
    }

    /**
     * Releases an MRT environment back into MRT target pool with optimistic locking.
     * @param {string} slug - The slug of the environment to release.
     * @returns {Promise<boolean>} - True if the environment was released successfully, false otherwise.
     * @throws {Error} - If the environment is not found or there is an error (e.g. authentication issues) releasing it.
     */
    async releaseEnvironment(slug) {
        if (!process.env.CI) {
            throw new Error(`❌ Cannot release environment in local development - Read only access`)
        }

        console.log(`🔓 Releasing environment: ${slug}`)

        let retryCount = 0
        while (retryCount < this.maxRetries) {
            try {
                const downloadResponse = await this.downloadPoolFile()
                const poolData = downloadResponse.poolData
                const envToRelease = poolData.environments.find((env) => env.slug === slug)

                if (!envToRelease) {
                    throw new Error(`❌ Environment ${slug} not found`)
                }

                const updatedPoolData = this.updateMRTTargetStatus(
                    downloadResponse.poolData,
                    envToRelease,
                    CI_AVAILABILITY_AVAILABLE
                )

                await this.s3Client.upload(
                    this.bucket,
                    this.poolDataFileKey,
                    JSON.stringify(updatedPoolData, null, 2),
                    downloadResponse.etag
                )

                console.log(`✅ Successfully released environment: ${slug}`)
                return true
            } catch (error) {
                retryCount++

                if (error.name === AWS_S3_ERR_PRECONDITION_FAILED) {
                    console.log(`⚠️ ETag mismatch on release attempt ${retryCount}, retrying...`)
                    if (retryCount < this.maxRetries) {
                        await this.sleep(this.retryDelay)
                        continue
                    } else {
                        throw new Error(
                            `❌ Failed to release environment after ${this.maxRetries} attempts`
                        )
                    }
                } else {
                    throw error
                }
            }
        }

        throw new Error(
            `❌ Failed to release environment ${slug} after ${this.maxRetries} attempts`
        )
    }

    /**
     * Utility function for delays
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}

async function main() {
    const program = new Command()

    program
        .description('Acquire and manage MRT environments with optimistic locking')
        .option('--max-retries <number>', 'Maximum retry attempts', '3')
        .option('--retry-delay <ms>', 'Delay between retries in milliseconds', '10000')

    program
        .command('status')
        .description('Show pool status')
        .action(async () => {
            /**
             * roleArn: [ARN - Amazon Resource Name] unique identifier for the 'Role' resource
             * that the currently authenticated AWS user assumes to get permissions defined by policies attached to the role.
             *
             * roleSessionName: Arbitrary identifier used to point out which session did certain actions originate from.
             * Typically used in logs [AWS Cloudwatch logs] like:
             * - [github-actions-e2e-session] Created new resource pwa-kit-ci/demo.json in S3.
             * or
             * - [pwa-kit-bot-user-session] Downloaded resource pwa-kit-ci/demo.json from S3.
             */
            const mrtTargetManager = new MRTTargetManager({
                bucket: process.env.AWS_S3_BUCKET,
                poolDataFileKey: process.env.AWS_S3_POOL_DATA_FILE_KEY,
                roleArn: process.env.AWS_ROLE_ARN,
                region: process.env.AWS_REGION,
                externalId: process.env.AWS_EXTERNAL_ID,
                roleSessionName: process.env.CI
                    ? GITHUB_ACTIONS_E2E_SESSION
                    : PWA_KIT_BOT_USER_SESSION
            })

            await mrtTargetManager.initialize()

            try {
                const status = await mrtTargetManager.getPoolStatus()

                console.log('Pool status:', JSON.stringify(status, null, 2))
            } catch (error) {
                console.error('❌ Error:', error.message)
                process.exit(1)
            }
        })

    program
        .command('acquire')
        .description('Acquire an MRT environment')
        .option('--pr-number <prNumber>', 'PR number')
        .option('--branch <branch>', 'Branch name')
        .option('--run-id <runId>', 'Run ID')
        .action(async ({prNumber, branch, runId}) => {
            const globalOpts = program.opts()

            const mrtTargetManager = new MRTTargetManager({
                bucket: process.env.AWS_S3_BUCKET,
                poolDataFileKey: process.env.AWS_S3_POOL_DATA_FILE_KEY,
                roleArn: process.env.AWS_ROLE_ARN,
                region: process.env.AWS_REGION,
                externalId: process.env.AWS_EXTERNAL_ID,
                prNumber,
                branch,
                runId,
                maxRetries: parseInt(globalOpts.maxRetries),
                retryDelay: parseInt(globalOpts.retryDelay),
                roleSessionName: process.env.CI
                    ? GITHUB_ACTIONS_E2E_SESSION
                    : PWA_KIT_BOT_USER_SESSION
            })

            await mrtTargetManager.initialize()

            await fs.ensureFile(MRT_TARGET_DETAILS_FILE)

            try {
                const result = await mrtTargetManager.acquireEnvironment()

                console.log(`Environment: ${result.environment.slug}`)
                console.log(`URL: ${result.environment.ssrExternalHostname}`)

                /**
                 * We need to write the environment details and status to a file so that the workflow can use it.
                 * Propagating outputs from node to composite actions to workflow is not robust enough.
                 * The file is used by the workflow to determine if the environment was acquired successfully and will be deleted when the MRT target is released back to the pool.
                 * Also, since each workflow run spins up a new container/server instance, the file is deleted when the workflow ends.
                 */
                const mrtTargetDetails = {
                    ...result.environment,
                    status: ACQUIRE_TARGET_STATUS_SUCCESS
                }

                await fs.writeJson(MRT_TARGET_DETAILS_FILE, mrtTargetDetails)
            } catch (error) {
                console.error('❌ Error:', error.message)
                await fs.writeJson(MRT_TARGET_DETAILS_FILE, {
                    status: ACQUIRE_TARGET_STATUS_FAILED,
                    error: error.message
                })
                process.exit(1)
            }
        })

    program
        .command('release')
        .description('Release an MRT environment')
        .argument('<slug>', 'Environment Id to release')
        .action(async (slug) => {
            const globalOpts = program.opts()

            const mrtTargetManager = new MRTTargetManager({
                bucket: process.env.AWS_S3_BUCKET,
                poolDataFileKey: process.env.AWS_S3_POOL_DATA_FILE_KEY,
                roleArn: process.env.AWS_ROLE_ARN,
                region: process.env.AWS_REGION,
                externalId: process.env.AWS_EXTERNAL_ID,
                maxRetries: parseInt(globalOpts.maxRetries),
                retryDelay: parseInt(globalOpts.retryDelay),
                roleSessionName: process.env.CI
                    ? GITHUB_ACTIONS_E2E_SESSION
                    : PWA_KIT_BOT_USER_SESSION
            })

            await mrtTargetManager.initialize()

            try {
                await mrtTargetManager.releaseEnvironment(slug)
                // Delete the target details file on successful release

                await fs.remove(MRT_TARGET_DETAILS_FILE)
                console.log(`✅ Deleted target details file: ${MRT_TARGET_DETAILS_FILE}`)
            } catch (error) {
                // Check if it's a file deletion error
                if (error.code === 'ENOENT' || error.message.includes('target details file')) {
                    console.warn(
                        `⚠️ Warning: Could not delete target details file: ${error.message}`
                    )
                } else {
                    console.error('❌ Error:', error.message)
                    process.exit(1)
                }
            }
        })

    await program.parseAsync()
}

// Export for use as module
module.exports = MRTTargetManager

// Export main function for testing
module.exports.main = main

// Run CLI if called directly
if (require.main === module) {
    main()
}
