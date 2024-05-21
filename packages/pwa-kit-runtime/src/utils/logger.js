/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

class PWAKITLogger {
    constructor(logLevel = 'info') {
        this.levels = ['debug', 'info', 'warn', 'error']
        this.logLevel = this.levels.includes(logLevel) ? logLevel : 'info'
    }

    shouldLog(level) {
        return this.levels.indexOf(level) >= this.levels.indexOf(this.logLevel)
    }

    log(level, message) {
        if (this.shouldLog(level)) {
            const logMessage = `[${level.toUpperCase()}]: ${message}`

            if (level === 'error') {
                originalConsole.error(logMessage)
            } else if (level === 'warn') {
                originalConsole.warn(logMessage)
            } else {
                originalConsole.log(logMessage)
            }
        }
    }

    debug(message) {
        this.log('debug', message)
    }

    info(message) {
        this.log('info', message)
    }

    warn(message) {
        this.log('warn', message)
    }

    error(message) {
        this.log('error', message)
    }
}

const logLevel = process.env.TESTMRT_LOG_LEVEL || 'info'
const logger = new PWAKITLogger(logLevel)

// Store the original console methods
const originalConsole = {
    debug: console.debug,
    info: console.info,
    log: console.log,
    warn: console.warn,
    error: console.error
}

// Override console methods to use the PWAKITLogger
console.debug = (msg) => logger.debug(msg)
console.info = (msg) => logger.info(msg)
console.log = (msg) => logger.info(msg)
console.warn = (msg) => logger.warn(msg)
console.error = (msg) => logger.error(msg)

// Override stdout and stderr to use the PWAKITLogger
process.stdout.write = (msg) => logger.info(msg)
process.stderr.write = (msg) => logger.error(msg)

export default logger
