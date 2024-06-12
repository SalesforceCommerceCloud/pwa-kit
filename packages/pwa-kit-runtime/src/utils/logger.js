/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_LOG_FORMAT = 'JSON'

const isServerSide = typeof window === 'undefined'

const LOG_LEVEL = isServerSide
    ? process.env.PWAKIT_LOG_LEVEL || DEFAULT_LOG_LEVEL
    : DEFAULT_LOG_LEVEL

const LOG_FORMAT = isServerSide
    ? process.env.PWAKIT_LOG_FORMAT || DEFAULT_LOG_FORMAT
    : DEFAULT_LOG_FORMAT

/**
 * The PWAKITLogger provides structured logging with different log levels.
 *
 */
export class PWAKITLogger {
    /**
     * Creates an instance of PWAKITLogger.
     * @param {string} logLevel - The log level to set for the logger.
     * @param {string} [format=DEFAULT_LOG_FORMAT] - The format in which to print log messages. Can be 'JSON' or 'TEXT'.
     * @param {string} packageName - The name of the package where the logger is used.
     */
    constructor(logLevel = LOG_LEVEL, format = DEFAULT_LOG_FORMAT, packageName = '') {
        this.logLevel = LOG_LEVELS.includes(logLevel) ? logLevel : DEFAULT_LOG_LEVEL
        this.format = format.toUpperCase()
        this.packageName = packageName
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
     * Formats the log message based on the provided context and format.
     *
     * @param {string} message - The log message.
     * @param {Object} details - The context for the log message.
     * @param {string} details.namespace - The namespace 'packageName.component.action' of the log message.
     * @param {Object} details.additionalProperties - Additional properties to include in the log message.
     * @returns {Object|string} - The formatted log message, either as a JSON object or a string.
     */
    formatLogMessage(message, {namespace, additionalProperties}) {
        const logMessage = {
            namespace: `${this.packageName}.${namespace}`,
            message: message.trim(),
            ...(additionalProperties && {additionalProperties})
        }

        if (this.format === 'TEXT') {
            return JSON.stringify(logMessage)
        }

        return logMessage
    }

    /**
     * Prints a log message with the namespace using the console object method set in the message log level.
     * @param {string} message - The log message.
     * @param {LogOptions} [options={}] - Optional message details.
     */
    printLog(message, options = {}) {
        const {level, ...messageDetails} = options

        if (!this.shouldLog(level)) {
            return
        }

        const formattedMessage = this.formatLogMessage(message, messageDetails)

        switch (level) {
            case 'error':
                console.error(formattedMessage)
                break
            case 'warn':
                console.warn(formattedMessage)
                break
            default:
                console.log(formattedMessage)
                break
        }
    }

    /**
     * Logs a debug message.
     * @param {string} message - The debug message.
     * @param {LogDetails} [details={}] - Optional message details.
     */
    debug(message, details = {}) {
        this.printLog(message, {level: 'debug', ...details})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {LogDetails} [details={}] - Optional message details.
     */
    log(message, details = {}) {
        this.printLog(message, {level: 'info', ...details})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {LogDetails} [details={}] - Optional message details.
     */
    info(message, details = {}) {
        this.printLog(message, {level: 'info', ...details})
    }

    /**
     * Logs a warning message.
     * @param {string} message - The warning message.
     * @param {LogDetails} [details={}] - Optional message details.
     */
    warn(message, details = {}) {
        this.printLog(message, {level: 'warn', ...details})
    }

    /**
     * Logs an error message.
     * @param {string} message - The error message.
     * @param {LogDetails} [details={}] - Optional message details.
     */
    error(message, details = {}) {
        this.printLog(message, {level: 'error', ...details})
    }
}

/**
 * Create a logger instances for each package
 * @param {string} packageName - The name of the package where the logger is used.
 */
export const createLogger = (packageName) => new PWAKITLogger(LOG_LEVEL, LOG_FORMAT, packageName)

export default createLogger
