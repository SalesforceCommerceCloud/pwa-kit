/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// A standard FIFO queue implementation
export default class Queue {
    constructor() {
        this._queue = []
    }

    get length() {
        return this._queue.length
    }

    get isEmpty() {
        return this._queue.length === 0
    }

    enqueue(item) {
        this._queue.push(item)
    }

    dequeue() {
        return this._queue.shift()
    }

    async process(callback) {
        while (!this.isEmpty) {
            const item = this.dequeue()
            await callback(item)
        }
    }
}
