/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {makeValidator} from './validators'

export const Latitude = makeValidator(
    (x) => typeof x === 'number' && x <= 90.0 && x >= -90.0,
    'Not a Latitude.'
)

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Number} Latitude
 */
