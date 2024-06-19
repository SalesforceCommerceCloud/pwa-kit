/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {Writable} from 'stream'
import logger from './logger-instance'

/**
 * @private
 * A stream that uses logger to write log lines
 */
class ConsoleLogStream extends Writable {
    write(line) {
        logger.info(line)
    }
}
// create new stream to be used in morgan stream
let morganStream = new ConsoleLogStream()

logger.warn(
    '[DEPRECATION] morganStream is deprecated and will be removed in future versions. Use the logger instance directly.'
)

export {morganStream}
