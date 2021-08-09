/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file
/**
 * The `errors` module contains any error classes used by Analytics Integrations.
 * @module progressive-web-sdk/dist/analytics-integrations/errors
 */
/**
 * The user did not supply the required field.
 *
 * @param {String} field
 */
export class ValidationError extends Error {
    constructor(field) {
        super(`Missing required field ${field || ''}.`)
    }
}
