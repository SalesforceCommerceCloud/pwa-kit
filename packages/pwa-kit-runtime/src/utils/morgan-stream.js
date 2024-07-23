/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {Writable} from 'stream'
/**
 * @private
 * A stream that uses console.log to write log lines
 */
class ConsoleLogStream extends Writable {
    write(line) {
        console.log(line)
    }
}
// create new stream to be used in morgan stream
let morganStream = new ConsoleLogStream()
export {morganStream}
