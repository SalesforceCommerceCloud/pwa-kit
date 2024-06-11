/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const DEFAULT_LOG_LEVEL = 'info'

const isServerSide = typeof window === 'undefined'

const LOG_LEVEL = isServerSide
    ? process.env.PWAKIT_LOG_LEVEL || DEFAULT_LOG_LEVEL
    : DEFAULT_LOG_LEVEL

export class PWAKITLogger {
    constructor(logLevel = LOG_LEVEL) {
        this.logLevel = LOG_LEVELS.includes(logLevel) ? logLevel : DEFAULT_LOG_LEVEL
    }

    shouldLog(level) {
        return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.logLevel)
    }

    printLog(level, message, {details, key} = {}) {
        if (this.shouldLog(level)) {
            const detailsStr = details ? `[${details.join('][')}]` : ''
            const logMessage = `[PWAKITLOG][${level.toUpperCase()}]${
                key ? `[${key}]` : ''
            }${detailsStr} - ${message}`

            switch (level) {
                case 'error':
                    console.error(logMessage)
                    break
                case 'warn':
                    console.warn(logMessage)
                    break
                default:
                    console.log(logMessage)
                    break
            }
        }
    }

    debug(message, options = {}) {
        this.printLog('debug', message, options)
    }

    log(message, options = {}) {
        this.printLog('info', message, options)
    }

    info(message, options = {}) {
        this.printLog('info', message, options)
    }

    warn(message, options = {}) {
        this.printLog('warn', message, options)
    }

    error(message, options = {}) {
        this.printLog('error', message, options)
    }
}

const logger = new PWAKITLogger()

export default logger
