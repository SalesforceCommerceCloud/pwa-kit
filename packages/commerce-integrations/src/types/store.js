/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import PropTypes from 'prop-types'
import {Image} from './image'
import {PhoneNumber} from './phone-number'
import {Email} from './email'
import {PostalCode} from './postal-code'

/**
 * @memberOf module:types
 * @typedef {Object} Store
 * @property {String} addressLine1 The store address.
 * @property {String} addressLine2 A secondary store address.
 * @property {String} city The city where the store is located.
 * @property {String} country The country where the store is located.
 * @property {String} description The store description.
 * @property {String} features The various features of a store.
 * @property {String} email The store email.
 * @property {String} id The store unique identifier.
 * @property {String} name The store name.
 * @property {String} phone The store phone number.
 * @property {String} postalCode The store postal code.
 * @property {String} hours The store hours.
 * @property {String} images The store logo.
 */
export const Store = {
    addressLine1: PropTypes.string.isRequired,
    addressLine2: PropTypes.string,
    city: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    description: PropTypes.string,
    features: PropTypes.array,
    email: Email,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    phone: PhoneNumber,
    postalCode: PostalCode,
    hours: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.objectOf(
            PropTypes.shape({
                openingTime: PropTypes.string,
                closingTime: PropTypes.string
            })
        )
    ]),
    images: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.shape(Image)), PropTypes.shape(Image)])
}
