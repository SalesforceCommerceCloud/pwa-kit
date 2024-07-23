/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const productSearch = [
    'organizationId',
    'siteId',
    'q',
    'refine',
    'sort',
    'currency',
    'locale',
    'expand',
    'offset',
    'limit',
    'select',
    'allImages',
    'allVariationProperties',
    'perPricebook'
] as const

const getSearchSuggestions = [
    'organizationId',
    'siteId',
    'q',
    'limit',
    'currency',
    'locale'
] as const

export default {
    productSearch,
    getSearchSuggestions
}
