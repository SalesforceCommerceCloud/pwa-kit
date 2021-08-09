/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
