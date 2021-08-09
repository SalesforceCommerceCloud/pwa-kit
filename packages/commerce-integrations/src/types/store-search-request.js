/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import PropTypes from 'prop-types'
import {Integer, Latitude, Longitude} from './index'

export const StoreSearchRequest = {
    count: Integer.isRequired,
    start: Integer.isRequired,
    latlon: PropTypes.objectOf(
        PropTypes.shape({
            latitude: Latitude.isRequired,
            longitude: Longitude.isRequired
        })
    ).isRequired
}

/**
 * @memberOf module:@mobify/commerce-integrations/dist/types
 * @typedef {Object} StoreSearchRequest
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} count The number of stores to return. Default is 20.
 * @property {module:@mobify/commerce-integrations/dist/types.Integer} start The zero-based index page number. Default is 0.
 * @property {Object} latlon The geographic coordinates informing the store search location.
 * @property {module:@mobify/commerce-integrations/dist/types.Latitude} latlon.latitude
 * @property {module:@mobify/commerce-integrations/dist/types.Longitude} latlon.Longitude
 */
