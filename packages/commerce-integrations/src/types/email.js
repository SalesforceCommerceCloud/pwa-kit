/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import Validator from 'validator'
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {String} Email
 */
export const Email = makeValidator(Validator.isEmail, 'Not a valid Email Address.')
