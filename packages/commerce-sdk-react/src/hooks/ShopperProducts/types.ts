/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../../types'

interface ShopperProductParams extends QueryParams {
    id?: string
    inventoryIds?: string
    allImages?: boolean
    perPricebook?: boolean
}

type ShopperProductsParams = Omit<ShopperProductParams, 'id'> & {
    ids?: string[]
}

interface ShopperCategoryParams extends QueryParams {
    id?: string
    levels?: number
}

type ShopperCategoriesParams = Omit<ShopperProductParams, 'id'> & {
    ids?: string[]
}

export type {
    ShopperProductParams,
    ShopperProductsParams,
    ShopperCategoryParams,
    ShopperCategoriesParams,
}
