/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {Command} = require('commander')
const dotenv = require('dotenv')

/**
 * Updates an MRT target via the API with only the provided properties
 */
class MRTTargetUpdater {
    constructor(options = {}) {
        this.projectSlug = options.projectSlug
        this.targetSlug = options.targetSlug
        this.cloudOrigin = options.cloudOrigin || 'https://cloud.mobify.com'
        this.mobifyApiKey = options.mobifyApiKey
        this.envFile = options.envFile
    }

    /**
     * Parse .env file and return key-value pairs using dotenv
     * @returns {Object} - Object with environment variables
     */
    _parseEnvFile() {
        const result = dotenv.config({path: this.envFile})

        if (result.error) {
            throw new Error(`Failed to parse .env file: ${result.error.message}`)
        }

        return result.parsed || {}
    }

    /**
     * Build JSON payload with only truthy values from .env file
     * @returns {Object} - Object with only truthy properties
     */
    buildUpdateTargetPayload() {
        const envVars = this._parseEnvFile()
        const payload = {}

        // Map environment variables to API payload properties
        if (envVars.MRT_TARGET_NAME) payload.name = envVars.MRT_TARGET_NAME
        if (envVars.MRT_TARGET_SSR_EXTERNAL_HOSTNAME)
            payload.ssr_external_hostname = envVars.MRT_TARGET_SSR_EXTERNAL_HOSTNAME
        if (envVars.MRT_TARGET_SSR_EXTERNAL_DOMAIN)
            payload.ssr_external_domain = envVars.MRT_TARGET_SSR_EXTERNAL_DOMAIN
        if (envVars.MRT_TARGET_SSR_REGION) payload.ssr_region = envVars.MRT_TARGET_SSR_REGION
        if (envVars.MRT_TARGET_SSR_WHITELISTED_IPS)
            payload.ssr_whitelisted_ips = envVars.MRT_TARGET_SSR_WHITELISTED_IPS
        if (envVars.MRT_TARGET_SSR_PROXY_CONFIGS) {
            try {
                payload.ssr_proxy_configs = JSON.parse(envVars.MRT_TARGET_SSR_PROXY_CONFIGS)
            } catch (error) {
                console.warn(`Warning: Failed to parse proxy configs: ${error.message}`)
            }
        }
        if (envVars.MRT_TARGET_ALLOW_COOKIES !== undefined)
            payload.allow_cookies = envVars.MRT_TARGET_ALLOW_COOKIES === 'true'
        if (envVars.MRT_TARGET_ENABLE_SOURCE_MAPS !== undefined)
            payload.enable_source_maps = envVars.MRT_TARGET_ENABLE_SOURCE_MAPS === 'true'
        if (envVars.MRT_TARGET_LOG_LEVEL) payload.log_level = envVars.MRT_TARGET_LOG_LEVEL

        return payload
    }

    /**
     * Build JSON payload for environment variables in the expected format
     * @returns {Object} - Object with environment variables formatted for API
     */
    buildEnvVarsPayload() {
        const envVars = this._parseEnvFile()
        const payload = {}

        // Convert each environment variable to the expected format
        if (envVars && Object.keys(envVars).length > 0) {
            Object.keys(envVars).forEach((key) => {
                const value = envVars[key]
                payload[key] = {
                    value: value
                }
            })
        }

        return payload
    }

    /**
     * Make the API call to update the MRT target
     * @param {Object} payload - The JSON payload to send
     * @returns {Promise<Object>} - The API response
     */
    async updateTarget(payload) {
        const url = `${this.cloudOrigin}/api/projects/${this.projectSlug}/target/${this.targetSlug}/`

        console.log('🎯 Updating MRT Target...')
        console.log(`URL: ${url}`)
        console.log(`Payload: ${JSON.stringify(payload, null, 2)}`)

        try {
            // Use node-fetch or make a curl call
            const fetch = await import('node-fetch').then((mod) => mod.default)

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.mobifyApiKey}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `API call failed: ${response.status} ${response.statusText}\n${errorText}`
                )
            }

            const result = await response.json()
            console.log('✅ Successfully updated MRT target')
            return result
        } catch (error) {
            console.error('❌ Error updating target:', error.message)
            throw error
        }
    }

    /**
     * Make the API call to update environment variables for the MRT target
     * @param {Object} envVarsPayload - The environment variables payload
     * @returns {Promise<Object>} - The API response
     */
    async updateEnvironmentVariables(envVarsPayload) {
        const url = `${this.cloudOrigin}/api/projects/${this.projectSlug}/target/${this.targetSlug}/env-var/`

        console.log('🔧 Updating Environment Variables...')
        console.log(`URL: ${url}`)
        console.log(`Payload: ${JSON.stringify(envVarsPayload, null, 2)}`)

        try {
            const fetch = await import('node-fetch').then((mod) => mod.default)
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.mobifyApiKey}`
                },
                body: JSON.stringify(envVarsPayload)
            })

            if (response.status !== 204) {
                const errorText = await response.text()
                throw new Error(
                    `Failed to update environment variables: ${response.status} ${response.statusText}\n${errorText}`
                )
            }

            console.log('✅ Successfully updated environment variables')
        } catch (error) {
            console.error('❌ Error updating environment variables:', error.message)
            throw error
        }
    }
}

async function main() {
    const program = new Command()

    // Global options
    program
        .requiredOption('--project-slug <slug>', 'MRT Project slug')
        .requiredOption('--target-slug <slug>', 'MRT Target slug')
        .requiredOption('--mobify-api-key <key>', 'Mobify API key')
        .option('--cloud-origin <hostname>', 'MRT Cloud origin', 'https://cloud.mobify.com')

    // Command for updating target properties
    program
        .command('target')
        .description('Update MRT target settings')
        .requiredOption('--env-file <path>', 'Path to .env file containing MRT target settings')
        .action(async (options) => {
            const globalOpts = program.opts()

            const updater = new MRTTargetUpdater({
                projectSlug: globalOpts.projectSlug,
                targetSlug: globalOpts.targetSlug,
                cloudOrigin: globalOpts.cloudOrigin,
                mobifyApiKey: globalOpts.mobifyApiKey,
                envFile: options.envFile
            })

            const payload = updater.buildUpdateTargetPayload()

            // Check if payload is empty
            if (Object.keys(payload).length === 0) {
                console.log('⚠️ No properties provided to update')
                return
            }

            try {
                await updater.updateTarget(payload)
            } catch (error) {
                console.error('❌ Error updating target:', error.message)
                process.exit(1)
            }
        })

    // Command for updating environment variables
    program
        .command('env-var')
        .description('Update environment variables for MRT target')
        .requiredOption('--env-file <path>', 'Path to .env file containing environment variables')
        .action(async (options) => {
            const globalOpts = program.opts()

            const updater = new MRTTargetUpdater({
                projectSlug: globalOpts.projectSlug,
                targetSlug: globalOpts.targetSlug,
                cloudOrigin: globalOpts.cloudOrigin,
                mobifyApiKey: globalOpts.mobifyApiKey,
                envFile: options.envFile
            })

            const payload = updater.buildEnvVarsPayload()

            // Check if payload is empty
            if (Object.keys(payload).length === 0) {
                console.log('⚠️ No environment variables provided to update')
                return
            }

            try {
                await updater.updateEnvironmentVariables(payload)
            } catch (error) {
                console.error('❌ Error updating environment variables:', error.message)
                process.exit(1)
            }
        })

    program.parse()

    // If no command is provided, show help
    if (!process.argv.slice(2).length) {
        program.outputHelp()
    }
}

// Export for use as module
module.exports = MRTTargetUpdater

// Run CLI if called directly
if (require.main === module) {
    main()
}
