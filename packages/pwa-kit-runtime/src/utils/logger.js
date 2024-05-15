/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createLogger, format, transports} from 'winston'

const logLevel = process.env.TESTMRT_LOG_LEVEL || 'info'

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

// Override console methods
console.log = (msg) => logger.info(msg)
console.warn = (msg) => logger.warn(msg)
console.error = (msg) => logger.error(msg)

export default logger
