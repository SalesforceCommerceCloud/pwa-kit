/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const DEFAULT_LOG_LEVEL = 'info'

const LOG_LEVEL = process.env.TESTMRT_LOG_LEVEL || DEFAULT_LOG_LEVEL
class PWAKITLogger {
    constructor(logLevel = LOG_LEVEL) {
        this.logLevel = LOG_LEVELS.includes(logLevel) ? logLevel : DEFAULT_LOG_LEVEL
    }

    shouldLog(level) {
        return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.logLevel)
    }

    printLog(level, message, messageDetail = '') {
        if (this.shouldLog(level)) {
            const logMessage = `[PWAKITLOG][${level.toUpperCase()}]${
                messageDetail ? `[${messageDetail}]` : ''
            } - ${message}`

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

    debug(message, messageDetail = '') {
        this.printLog('debug', message, messageDetail)
    }

    log(message, messageDetail = '') {
        this.printLog('info', message, messageDetail)
    }

    info(message, messageDetail = '') {
        this.printLog('info', message, messageDetail)
    }

    warn(message, messageDetail = '') {
        this.printLog('warn', message, messageDetail)
    }

    error(message, messageDetail = '') {
        this.printLog('error', message, messageDetail)
    }
}

const logger = new PWAKITLogger()
module.exports = logger
