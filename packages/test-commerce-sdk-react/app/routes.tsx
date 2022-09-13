/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import loadable from '@loadable/component'
import UseSearchSuggestions from './pages/use-search-suggestion'

const Home = loadable(() => import('./pages/home'))
const UseProducts = loadable(() => import('./pages/use-shopper-products'))
const UseProduct = loadable(() => import('./pages/use-shopper-product'))
const UseCategories = loadable(() => import('./pages/use-shopper-categories'))
const UseCategory = loadable(() => import('./pages/use-shopper-category'))
const UseProductSearch = loadable(() => import('./pages/use-product-search'))
const UseShopperLoginHelper = loadable(() => import('./pages/use-shopper-login-helper'))

const routes = [
    {
        path: '/',
        exact: true,
        component: Home
    },
    {
        path: '/products/:productId',
        component: UseProduct
    },
    {
        path: '/products',
        component: UseProducts
    },
    {
        path: '/categories/:categoryId',
        component: UseCategory
    },
    {
        path: '/categories',
        component: UseCategories
    },
    {
        path: '/search',
        component: UseProductSearch
    },
    {
        path: '/search-suggestions',
        component: UseSearchSuggestions
    },
    {
        path: '/slas-helpers',
        component: UseShopperLoginHelper
    }
]

export default routes
