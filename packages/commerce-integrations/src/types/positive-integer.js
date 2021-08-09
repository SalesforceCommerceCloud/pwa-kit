/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

export const PositiveInteger = makeValidator(
    (x) => Number.isInteger(x) && x >= 0,
    'Not an Integer.'
)

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Number} PositiveInteger
 */
