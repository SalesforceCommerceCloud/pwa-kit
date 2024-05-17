/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import pino from 'pino'

const validLogLevels = Object.keys(pino.levels.values)

const logLevel = validLogLevels.includes(process.env.TESTMRT_LOG_LEVEL)
    ? process.env.TESTMRT_LOG_LEVEL
    : 'info'

const logger = pino({
    level: logLevel,
    formatters: {
        level(label) {
            return {level: label}
        }
    }
})

// Override console methods to use Pino logger
console.debug = (msg) => logger.debug(msg)
console.info = (msg) => logger.info(msg)
console.log = (msg) => logger.info(msg)
console.warn = (msg) => logger.warn(msg)
console.error = (msg) => logger.error(msg)

export default logger
