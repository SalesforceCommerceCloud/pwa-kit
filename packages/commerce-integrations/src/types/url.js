/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Validator from 'validator'
import {makeValidator} from './validators'

export const URL = makeValidator(Validator.isURL, 'Not a valid URL.')

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {String} URL
 */
