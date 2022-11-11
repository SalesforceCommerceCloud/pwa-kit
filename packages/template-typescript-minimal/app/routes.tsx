/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
//@ts-ignore
import loadable from '@loadable/component'
//@ts-ignore
const Home = loadable(() => import('./pages/home'))
//@ts-ignore
const ProductDetail = loadable(() => import('./pages/product-detail'))
//@ts-ignore
const Cart = loadable(() => import('./pages/cart'))
//@ts-ignore
const Checkout = loadable(() => import('./pages/checkout'))

const routes = [
    {
        path: '/',
        exact: true,
        component: Home
    },
    {
        path: '/products/:productId',
        exact: true,
        component: ProductDetail
    },
    {
        path: '/cart',
        exact: true,
        component: Cart
    },
    {
        path: '/checkout',
        exact: true,
        component: Checkout
    }
]

export default routes
