/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import loadable from '@loadable/component'

// Components
import {Skeleton} from '@chakra-ui/react'

// Page fallback
const fallback = <Skeleton height="75vh" width="100%" />

// Page Loadables
const Account = loadable(() => import('$/pages/account'), {fallback})
const Cart = loadable(() => import('$/pages/cart'), {fallback})
const Checkout = loadable(() => import('$/pages/checkout'), {
    fallback
})
const CheckoutConfirmation = loadable(() => import('$/pages/checkout/confirmation'), {fallback})
const Home = loadable(() => import('$/pages/home'), {fallback})
const Login = loadable(() => import('$/pages/login'), {fallback})
const Registration = loadable(() => import('$/pages/registration'), {
    fallback
})
const ResetPassword = loadable(() => import('$/pages/reset-password'), {fallback})
const LoginRedirect = loadable(() => import('$/pages/login-redirect'), {fallback})
const ProductDetail = loadable(() => import('$/pages/product-detail'), {fallback})
const ProductList = loadable(() => import('$/pages/product-list'), {
    fallback
})
const Wishlist = loadable(() => import('$/pages/account/wishlist'), {
    fallback
})

// NOTE: Apply "displayName" for easy filtering. This is a widely use pattern to allow filtering without
// triggering the loadable logic. Please note that we want to keep these in aligned with name in the
// component itself.
Account.displayName = 'Account'
Cart.displayName = 'Cart'
Checkout.displayName = 'Checkout'
CheckoutConfirmation.displayName = 'CheckoutConfirmation'
Home.displayName = 'Home'
Login.displayName = 'Login'
Registration.displayName = 'Registration'
ResetPassword.displayName = 'ResetPassword'
LoginRedirect.displayName = 'LoginRedirect'
ProductDetail.displayName = 'ProductDetail'
ProductList.displayName = 'ProductList'
Wishlist.displayName = 'Wishlist'

export {
    Account,
    Cart,
    Checkout,
    CheckoutConfirmation,
    Home,
    Login,
    Registration,
    ResetPassword,
    LoginRedirect,
    ProductDetail,
    ProductList,
    Wishlist
}
