/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import Validator from 'validator'
import {makeValidator} from './validators'

export const Email = makeValidator(Validator.isEmail, 'Not a valid Email Address.')

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {String} Email
 */
