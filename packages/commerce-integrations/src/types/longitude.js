/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

/**
 * @memberOf module:types
 * @typedef {Number} Longitude
 */
export const Longitude = makeValidator(
    (x) => typeof x === 'number' && x <= 180.0 && x >= -180.0,
    'Not a Longitude.'
)
