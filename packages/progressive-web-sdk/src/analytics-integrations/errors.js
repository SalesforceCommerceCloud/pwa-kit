/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file
/** @module */
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
