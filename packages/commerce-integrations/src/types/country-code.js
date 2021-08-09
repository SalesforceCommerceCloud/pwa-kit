/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import IsoCountries from 'i18n-iso-countries'
import {makeValidator} from './validators'

export const CountryCode = makeValidator(IsoCountries.isValid, 'Not a valid Country Code.')

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {String} CountryCode
 */
