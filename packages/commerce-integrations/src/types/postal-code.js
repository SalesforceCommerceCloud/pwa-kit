/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Validator from 'validator'
import {makeValidator} from './validators'

export const PostalCode = makeValidator(
    (x) => Validator.isPostalCode(x, 'any'),
    'Not a valid Postal Code.'
)

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {String} PostalCode
 */
