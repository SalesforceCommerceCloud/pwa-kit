/**
 * The `errors` module contains any error type classes used by
 * Commerce Integrations.
 * @module @mobify/commerce-integrations/dist/errors
 */

export class ConnectorError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.constructor = ConnectorError
        this.__proto__ = ConnectorError.prototype
        this.message = message
        this.statusCode = statusCode
    }

    toString() {
        return `ConnectorError ${this.statusCode}: ${this.message}`
    }
}

/**
 * The user supplied invalid arguments to a function/method.
 * Usually an error in code.
 */
export class InvalidArgumentError extends ConnectorError {
    constructor(msg) {
        super(400, msg)
        this.constructor = InvalidArgumentError
        this.__proto__ = InvalidArgumentError.prototype
    }
}

/**
 * The server returned an error response.
 */
export class ServerError extends ConnectorError {
    constructor(msg) {
        super(500, msg)
        this.constructor = ServerError
        this.__proto__ = ServerError.prototype
    }
}

/**
 * The server returned a forbidden response.
 */
export class ForbiddenError extends ConnectorError {
    constructor(msg) {
        super(403, msg)
        this.constructor = ForbiddenError
        this.__proto__ = ForbiddenError.prototype
    }
}

/**
 * The server returned a not found response.
 */
export class NotFoundError extends ConnectorError {
    constructor(msg) {
        super(404, msg)
        this.constructor = NotFoundError
        this.__proto__ = NotFoundError.prototype
    }
}

/**
 * The called method is not implemented or supported on a backend.
 */
export class UnsupportedError extends ConnectorError {
    constructor(msg) {
        super(500, msg)
        this.constructor = UnsupportedError
        this.__proto__ = UnsupportedError.prototype
    }
}

/**
 * A request was rejected because the user is not authenticated.
 *
 * In screen-scraping APIs this may be different from a "Forbidden"
 * response - eg. a redirect to a login page might trigger the error.
 */
export class NotAuthenticatedError extends ConnectorError {
    constructor(msg) {
        super(401, msg)
        this.constructor = NotAuthenticatedError
        this.__proto__ = NotAuthenticatedError.prototype
    }
}
