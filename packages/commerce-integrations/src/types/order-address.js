/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {PhoneNumber} from './phone-number'
import {PostalCode} from './postal-code'
import {CountryCode} from './country-code'

export const OrderAddress = {
    id: PropTypes.string,
    titleCode: PropTypes.string,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    phone: PhoneNumber,
    addressLine1: PropTypes.string.isRequired,
    addressLine2: PropTypes.string,
    countryCode: CountryCode.isRequired,
    stateCode: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    postalCode: PostalCode.isRequired
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} OrderAddress
 * @property {String} id The id of the order address.
 * @property {String} titleCode The title code of the customer. (For example, 'Mr.' or 'Mrs.'.)
 * @property {String} firstName The customer's first name.
 * @property {String} lastName The customer's last name.
 * @property {module:@mobify/commerce-integrations/dist/types.PhoneNumber} phone The customer's phone number.
 * @property {String} addressLine1 The customer's street name, street number, and suite/unit.
 * @property {String} addressLine2 Any additional addressing information. (For example, a company name, or "Attn:".)
 * @property {module:@mobify/commerce-integrations/dist/types.CountryCode} countryCode The country code.
 * @property {String} stateCode The state code.
 * @property {String} city The city name.
 * @property {module:@mobify/commerce-integrations/dist/types.PostalCode} postalCode The postal code.
 */
