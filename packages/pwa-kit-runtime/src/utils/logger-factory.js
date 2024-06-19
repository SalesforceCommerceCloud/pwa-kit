/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * The PWAKitLogger provides structured logging with different log levels.
 * @private
 */
export class PWAKitLogger {
    /**
     * Creates an instance of PWAKitLogger.
     * @param {Object} options - Configuration options for the logger.
     * @param {string} options.packageName - The name of the package where the logger is used.
     */
    constructor(options = {}) {
        this.packageName = options.packageName || ''
    }

    /**
     * Formats the log message.
     *
     * @param {string} message - The log message.
     * @param {Object} details - The context for the log message.
     * @param {string} details.level - The log level of the message.
     * @param {string} details.namespace - The namespace 'packageName.component.action' of the log message.
     * @param {Object} details.additionalProperties - Additional properties to include in the log message.
     * @returns {string} - The formatted log message as a string.
     */
    #formatLogMessage(message, {level, namespace, additionalProperties}) {
        let finalNamespace = this.packageName
        if (namespace && this.packageName) {
            finalNamespace += `.${namespace}`
        } else if (namespace) {
            finalNamespace = namespace
        }

        return `${finalNamespace} ${level.toUpperCase()} ${message}${
            additionalProperties ? ` ${JSON.stringify(additionalProperties)}` : ''
        }`
    }

    /**
     * Prints a log message with the namespace using the console object method set in the message log level.
     * @param {string} message - The log message.
     * @param {Object} options - Optional message details.
     * @param {string} options.level - The log level of the message.
     */
    #printLog(message, options = {}) {
        const {level} = options

        const formattedMessage = this.#formatLogMessage(message, options)

        switch (level) {
            case 'error':
                console.error(formattedMessage)
                break
            case 'warn':
                console.warn(formattedMessage)
                break
            case 'info':
                console.info(formattedMessage)
                break
            case 'debug':
                console.debug(formattedMessage)
                break
            default:
                console.log(formattedMessage)
                break
        }
    }

    /**
     * Logs a debug message.
     * @param {string} message - The debug message.
     * @param {Object} [details={}] - Optional message details.
     */
    debug(message, details = {}) {
        this.#printLog(message, {level: 'debug', ...details})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {Object} [details={}] - Optional message details.
     */
    log(message, details = {}) {
        this.#printLog(message, {level: 'info', ...details})
    }

    /**
     * Logs an info message.
     * @param {string} message - The info message.
     * @param {Object} [details={}] - Optional message details.
     */
    info(message, details = {}) {
        this.#printLog(message, {level: 'info', ...details})
    }

    /**
     * Logs a warning message.
     * @param {string} message - The warning message.
     * @param {Object} [details={}] - Optional message details.
     */
    warn(message, details = {}) {
        this.#printLog(message, {level: 'warn', ...details})
    }

    /**
     * Logs an error message.
     * @param {string} message - The error message.
     * @param {Object} [details={}] - Optional message details.
     */
    error(message, details = {}) {
        this.#printLog(message, {level: 'error', ...details})
    }
}

/**
 * Create a logger instance for each package.
 *
 * @param {Object} config - Configuration object for the logger.
 * @param {string} config.packageName - The name of the package where the logger is used.
 * @returns {PWAKitLogger} - An instance of PWAKitLogger configured for the specified package.
 */
const createLogger = (config = {}) => {
    return new PWAKitLogger(config)
}

export default createLogger
