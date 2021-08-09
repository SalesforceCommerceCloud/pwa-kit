/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {String} PhoneNumber
 */
export const PhoneNumber = makeValidator(
    (x) => new RegExp('^\\+?[1-9]\\d{1,14}$').test(x),
    'Not a valid Phone Number.'
)
