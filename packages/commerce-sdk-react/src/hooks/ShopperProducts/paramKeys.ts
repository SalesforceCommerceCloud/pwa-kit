/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ShopperProducts} from 'commerce-sdk-isomorphic'

export default {
    getProducts: ShopperProducts.getProductsParamKeys,
    getProductsRequired: ShopperProducts.getProductsParamKeysRequired,

    getProduct: ShopperProducts.getProductParamKeys,
    getProductRequired: ShopperProducts.getProductParamKeysRequired,

    getCategories: ShopperProducts.getCategoriesParamKeys,
    getCategoriesRequired: ShopperProducts.getCategoriesParamKeysRequired,

    getCategory: ShopperProducts.getCategoryParamKeys,
    getCategoryRequired: ShopperProducts.getCategoryParamKeysRequired
}
