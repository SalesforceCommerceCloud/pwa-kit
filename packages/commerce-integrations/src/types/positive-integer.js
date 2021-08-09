/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {Number} PositiveInteger
 */
export const PositiveInteger = makeValidator(
    (x) => Number.isInteger(x) && x >= 0,
    'Not an Integer.'
)
