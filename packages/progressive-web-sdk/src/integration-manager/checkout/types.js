/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as Runtypes from 'runtypes'
import {Identifier, Text, Money, Nullable} from '../types'

const CountryID = Identifier

const Country = Runtypes.Record({
    id: CountryID,
    label: Text,
    regionRequired: Runtypes.Boolean,
    postcodeRequired: Runtypes.Boolean
})

const Region = Runtypes.Record({
    countryId: CountryID,
    id: Identifier,
    label: Text
})

export const LocationList = Runtypes.Record({
    countries: Runtypes.Array(Country),
    regions: Runtypes.Array(Region)
})

const ShippingMethod = Runtypes.Record({
    label: Text,
    cost: Money,
    id: Identifier
})

export const ShippingMethods = Runtypes.Array(ShippingMethod)

export const Address = Runtypes.Record({
    firstname: Text,
    lastname: Text,
    addressLine1: Text,
    city: Text,
    countryId: CountryID,
    postcode: Text,
    telephone: Text
}).And(
    Runtypes.Partial({
        addressLine2: Nullable(Text), // eslint-disable-line new-cap
        // We expect one of these two "region" fields to be non-null
        regionId: Nullable(Identifier), // eslint-disable-line new-cap
        region: Nullable(Text) // eslint-disable-line new-cap
    })
)
