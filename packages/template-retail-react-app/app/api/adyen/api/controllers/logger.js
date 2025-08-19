/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {APPLICATION_VERSION} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'

const ADYEN_PREFIX = 'ADYEN'

class Logger {
    static info(step, message) {
        console.info(composeLog('INFO', step, message))
    }

    static warn(step, message) {
        console.warn(composeLog('WARN', step, message))
    }

    static error(step, message) {
        console.error(composeLog('ERROR', step, message))
    }

    static debug(step, message) {
        console.debug(composeLog('DEBUG', step, message))
    }
}

const composeLog = (type, step, message) => {
    const logMessage = message instanceof Object ? JSON.stringify(message) : message
    const stepPart = step || ''
    const messagePart = logMessage || ''
    return `${ADYEN_PREFIX}_${type} ${APPLICATION_VERSION} ${stepPart} ${messagePart}`
        .trim()
        .replace(/\s\s+/g, ' ')
}

export default Logger
