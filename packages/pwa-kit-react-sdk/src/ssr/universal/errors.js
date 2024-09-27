/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export class HTTPError extends Error {
    constructor(status, message) {
        super(message)
        this.constructor = HTTPError
        this.__proto__ = HTTPError.prototype
        this.message = message
        this.status = status
    }

    toString() {
        return `HTTPError ${this.status}: ${this.message}`
    }
}

export class HTTPNotFound extends HTTPError {
    constructor(message) {
        super(404, message)
        this.constructor = HTTPNotFound
        this.__proto__ = HTTPNotFound.prototype
    }
}
