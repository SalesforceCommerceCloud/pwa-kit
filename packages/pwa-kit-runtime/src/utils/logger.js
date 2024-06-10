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

    log(level, moduleName, fileName, action, message) {
        if (this.shouldLog(level)) {
            const logMessage = `[${moduleName}][${fileName}][${action}] - ${message}`

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

    debug(moduleName, fileName, action, message) {
        this.log('debug', moduleName, fileName, action, message)
    }

    info(moduleName, fileName, action, message) {
        this.log('info', moduleName, fileName, action, message)
    }

    warn(moduleName, fileName, action, message) {
        this.log('warn', moduleName, fileName, action, message)
    }

    error(moduleName, fileName, action, message) {
        this.log('error', moduleName, fileName, action, message)
    }
}

const logger = new PWAKITLogger(LOG_LEVEL)

export default logger
