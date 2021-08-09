/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Validator from 'validator'
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {String} PostalCode
 */
export const PostalCode = makeValidator(
    (x) => Validator.isPostalCode(x, 'any'),
    'Not a valid Postal Code.'
)
