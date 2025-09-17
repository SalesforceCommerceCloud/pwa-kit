/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os'
import path from 'path'
import {TelemetryReporter} from '@salesforce/telemetry'
import {Telemetry as McpTelemetry} from '@salesforce/mcp/lib/telemetry.js'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')

let telemetryInstance = null
const customAppInsightsKey =
    'InstrumentationKey=71d27171-35a8-4e40-84eb-3475c21e3b0d;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=d94f8e29-c0fa-414b-b0b8-4c6c05411114'

const computeCacheDir = () => {
    // Try to mirror oclif's cache location shape so @salesforce/mcp can find CLIID if present.
    // The Telemetry implementation replaces 'sf-mcp-server' with 'sf' to look for CLIID.txt.
    const baseName = 'sf-mcp-server'
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Caches', baseName)
    }
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
        return path.join(localAppData, baseName)
    }
    return path.join(os.homedir(), '.cache', baseName)
}

export const startTelemetry = async (attributes = {}) => {
    if (telemetryInstance) return telemetryInstance

    const config = {
        // Minimal subset used by the Telemetry implementation
        version: packageJson?.version || '0.0.0',
        platform: process.platform,
        arch: process.arch,
        userAgent: 'pwa-kit-mcp',
        cacheDir: computeCacheDir(),
        dataDir: path.join(os.homedir(), '.pwa-kit-mcp')
    }

    telemetryInstance = new McpTelemetry(config, attributes)
    await telemetryInstance.start()

    if (customAppInsightsKey) {
        try {
            // Replace the internal reporter with one that uses our custom key
            class ForcedTelemetryReporter extends TelemetryReporter {
                isSfdxTelemetryEnabled() {
                    return true
                }
            }

            // stop any existing reporter created by the library
            try {
                telemetryInstance.reporter?.stop?.()
            } catch {
                // ignore
            }

            // Normalize key: accept either full connection string or bare GUID
            const looksLikeConnString = /InstrumentationKey=/i.test(customAppInsightsKey)
            const looksLikeGuid =
                /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                    customAppInsightsKey
                )
            const normalizedKey = looksLikeConnString
                ? customAppInsightsKey
                : looksLikeGuid
                ? `InstrumentationKey=${customAppInsightsKey}`
                : customAppInsightsKey

            if (!looksLikeConnString && !looksLikeGuid) {
                console.error(
                    'Telemetry key format not recognized. Expect a connection string or instrumentation GUID.'
                )
            }

            telemetryInstance.reporter = await ForcedTelemetryReporter.create({
                project: 'pwa-kit-mcp',
                key: normalizedKey,
                userId: telemetryInstance.cliId,
                waitForConnection: true
            })
            telemetryInstance.reporter.start()
            console.error('Telemetry reporter created with custom key')
        } catch (e) {
            // ignore override failures, continue with default reporter
            console.error('Telemetry reporter creation failed:', e?.message || e)
        }
    }
    try {
        telemetryInstance.sendEvent('SERVER_STARTED', {
            project: 'pwa-kit-mcp'
        })
    } catch {
        // ignore
    }
    return telemetryInstance
}

export const stopTelemetry = () => {
    if (!telemetryInstance) return
    try {
        telemetryInstance.sendEvent('SERVER_STOPPED_SUCCESS')
    } catch {
        // ignore
    }
    telemetryInstance.stop()
    telemetryInstance = null
}

export const getTelemetry = () => telemetryInstance
