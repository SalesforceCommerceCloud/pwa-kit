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

/**
 * The PWAKITLogger provides structured logging with different log levels.
 */
export class PWAKITLogger {
    /**
     * Creates an instance of PWAKITLogger.
     * @param {string} logLevel - The log level to set for the logger.
     */
    constructor(logLevel = LOG_LEVEL) {
        this.logLevel = LOG_LEVELS.includes(logLevel) ? logLevel : DEFAULT_LOG_LEVEL
    }

    /**
     * Determines if the message should be logged based on the PWAKIT_LOG_LEVEL value.
     * @param {string} level - The log level of the message.
     * @returns {boolean} - Returns true if the message should be logged, otherwise false.
     */
    shouldLog(level) {
        return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.logLevel)
    }

    /**
     * Prints a log message with the namespace using the console object method set in the message log level.
     * @param {string} message - The log message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace following  the pattern module..
     */
    printLog(message, {key, level, details}) {
        if (!this.shouldLog(level)) {
            return
        }

        const detailsStr = details ? `[${details.join('][')}]` : ''
        const logMessage = `[PWAKITLOG][${level.toUpperCase()}]${
            key ? `[${key}]` : ''
        }${detailsStr} - ${message.trim()}`

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

    /**
     * Logs a debug message.
     * @param {string} message - The debug message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace.
     */
    debug(message, options = {}) {
        this.printLog(message, {...options, level: 'debug'})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace.
     */
    log(message, options = {}) {
        this.printLog(message, {...options, level: 'info'})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace.
     */
    info(message, options = {}) {
        this.printLog(message, {...options, level: 'info'})
    }

    /**
     * Logs a warning message.
     * @param {string} message - The warning message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace.
     */
    warn(message, options = {}) {
        this.printLog(message, {...options, level: 'warn'})
    }

    /**
     * Logs an error message.
     * @param {string} message - The error message.
     * @param {Object} [options={}] - Optional message parameters.
     * @param {string} [options.key] - A key associated to the log message package name.
     * @param {string} level - The log level of the message.
     * @param {string[]} [options.details] - Additional details to generate the log message namespace.
     */
    error(message, options = {}) {
        this.printLog(message, {...options, level: 'error'})
    }
}

/**
 * The default logger instance.
 * @type {PWAKITLogger}
 */
const logger = new PWAKITLogger()

export default logger
