/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {randomBytes} from 'crypto'
import {TelemetryReporter} from '@salesforce/telemetry'
import fs from 'fs'
import path from 'path'
import os from 'os'

// NOTE: This is a workaround to import JSON files as ES modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')

const PROJECT = 'pwa-kit-mcp'

const loadConfigValue = (key) => {
    try {
        const cfgPath = path.resolve(__dirname, './config.json')
        if (!fs.existsSync(cfgPath)) return null
        const raw = fs.readFileSync(cfgPath, 'utf8')
        const cfg = JSON.parse(raw)
        const v = cfg?.[key]
        return typeof v === 'string' && v.trim() ? v.trim() : null
    } catch {
        return null
    }
}

const customAppInsightsKey = loadConfigValue('applicationInsightsConnectionString')

const generateRandomId = () => randomBytes(20).toString('hex')

// Our own persistent CLI ID location: ~/.pwa-kit-mcp/cliid
const getOwnCliIdPath = () => {
    const home = os.homedir()
    if (!home) return null
    const dir = path.join(home, '.pwa-kit-mcp')
    const file = path.join(dir, 'cliid')
    return {dir, file}
}

const readOrCreateOwnCliId = () => {
    const loc = getOwnCliIdPath()
    if (!loc) return null
    if (fs.existsSync(loc.file)) {
        const value = fs.readFileSync(loc.file, 'utf8')
        const trimmed = value?.trim()
        if (trimmed) return trimmed
    }
    // Create new
    const newId = generateRandomId()
    try {
        if (!fs.existsSync(loc.dir)) {
            fs.mkdirSync(loc.dir, {recursive: true, mode: 0o700})
        }
        fs.writeFileSync(loc.file, newId, {encoding: 'utf8', mode: 0o600})
    } catch {
        // If we can't persist, still return the generated id
    }
    return newId
}

const readCliIdIfPresent = () => {
    // Use our own persisted cliid under the user's home; if not present, generate one
    const ownId = readOrCreateOwnCliId()
    if (ownId) return ownId
    // Fallback: generate a random id for this session
    return generateRandomId()
}

class McpTelemetryReporter extends TelemetryReporter {
    // Always allow telemetry for this reporter; gating is handled by instantiation site.
    isSfdxTelemetryEnabled() {
        return true
    }
}

export class Telemetry {
    constructor(initialAttributes = {}) {
        this.sessionId = generateRandomId()
        this.cliId = readCliIdIfPresent()
        this.started = false
        this.reporter = undefined
        this.attributes = {...initialAttributes}
    }

    addAttributes(attributes) {
        this.attributes = {...this.attributes, ...attributes}
    }

    sendEvent(eventName, attributes) {
        try {
            this.reporter?.sendTelemetryEvent(eventName, {
                ...this.attributes,
                ...attributes,
                // Identifiers
                sessionId: this.sessionId,
                cliId: this.cliId,
                // System information
                version: packageJson?.version,
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                nodeEnv: process.env.NODE_ENV,
                origin: PROJECT,
                // Timestamps
                date: new Date().toUTCString(),
                timestamp: String(Date.now()),
                processUptime: process.uptime() * 1000
            })
        } catch {
            // ignore send errors
        }
    }

    // Convenience helper for external callers to send custom events
    sendCustomEvent(eventName, properties = {}) {
        this.sendEvent(eventName, properties)
    }

    async start() {
        if (this.started) return
        this.started = true
        try {
            await this.createMcpTelemetryReporter()
        } catch (error) {
            // Best-effort retry after ~1s: first runs can hit transient failures
            // establishing the Application Insights connection (DNS/proxy/VPN warm-up,
            // brief network blips, or backend cold start). One short delay usually fixes it.
            // If the retry still fails, ignore it to avoid impacting the server.
            try {
                await new Promise((r) => setTimeout(r, 1000))
                await this.createMcpTelemetryReporter()
            } catch (retryError) {
                // ignore
            }
        }
    }

    stop() {
        if (!this.started) return
        this.started = false
        this.reporter?.stop()
    }

    /**
     * Creates and initializes the MCP telemetry reporter with App Insights.
     * @returns {Promise<void>}
     */
    async createMcpTelemetryReporter() {
        // TODO: update configs based on approved telemetry approach
        this.reporter = await McpTelemetryReporter.create({
            project: PROJECT,
            key: customAppInsightsKey,
            userId: this.cliId,
            waitForConnection: true
        })
        this.reporter.start()
    }
}
