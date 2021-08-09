/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Validator from 'validator'
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {String} URL
 */
export const URL = makeValidator(Validator.isURL, 'Not a valid URL.')
