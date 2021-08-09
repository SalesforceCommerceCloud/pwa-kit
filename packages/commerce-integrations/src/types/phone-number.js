/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

export const PhoneNumber = makeValidator(
    (x) => new RegExp('^\\+?[1-9]\\d{1,14}$').test(x),
    'Not a valid Phone Number.'
)

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {String} PhoneNumber
 */
