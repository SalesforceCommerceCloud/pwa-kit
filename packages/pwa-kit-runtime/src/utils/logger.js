/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createLogger, format, transports, config} from 'winston'

const validLogLevels = Object.keys(config.npm.levels)

const logLevel = validLogLevels.includes(process.env.TESTMRT_LOG_LEVEL)
    ? process.env.TESTMRT_LOG_LEVEL
    : 'info'

const logger = createLogger({
    level: logLevel,
    format: format.combine(
        format.colorize(),
        format.printf(({level, message}) => {
            return `[${level}]: ${message}`
        })
    ),
    transports: [new transports.Console()]
})

// Override console methods to use Winston logger
console.debug = (msg) => logger.debug(msg)
console.info = (msg) => logger.verbose(msg)
console.log = (msg) => logger.info(msg)
console.warn = (msg) => logger.warn(msg)
console.error = (msg) => logger.error(msg)
export default logger
