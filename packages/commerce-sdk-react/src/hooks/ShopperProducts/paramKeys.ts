/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getProducts = [
    'organizationId',
    'ids',
    'inventoryIds',
    'select',
    'currency',
    'expand',
    'locale',
    'allImages',
    'perPricebook',
    'siteId'
] as const

const getProduct = [
    'organizationId',
    'id',
    'inventoryIds',
    'currency',
    'expand',
    'locale',
    'allImages',
    'perPricebook',
    'siteId'
] as const

const getCategories = ['organizationId', 'ids', 'levels', 'locale', 'siteId'] as const
const getCategory = ['organizationId', 'id', 'levels', 'locale', 'siteId'] as const

export default {
    getProducts,
    getProduct,
    getCategories,
    getCategory
}
