/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const searchStores = [
    'countryCode',
    'distanceUnit',
    'latitude',
    'longitude',
    'maxDistance',
    'postalCode',
    'siteId',
    'locale',
    'offset',
    'limit'
] as const

const getStores = [
    'siteId',
    'locale',
    'ids'
] as const


export default {
    searchStores, getStores
}
