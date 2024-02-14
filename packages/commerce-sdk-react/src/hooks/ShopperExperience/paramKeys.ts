/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getPages = [
    'organizationId',
    'categoryId',
    'productId',
    'aspectTypeId',
    'aspectAttributes',
    'parameters',
    'siteId',
    'locale'
] as const
const getPage = [
    'organizationId',
    'pageId',
    'aspectAttributes',
    'parameters',
    'siteId',
    'locale'
] as const

export default {
    getPages,
    getPage
}
