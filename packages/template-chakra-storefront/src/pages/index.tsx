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
const Account = loadable(() => import('./account'), {fallback})
const Cart = loadable(() => import('./cart'), {fallback})
const Checkout = loadable(() => import('./checkout'), {
    fallback
})
const CheckoutConfirmation = loadable(() => import('./checkout/confirmation'), {
    fallback
})
const Home = loadable(() => import('./home'), {fallback})
const Login = loadable(() => import('./login'), {fallback})
const Registration = loadable(() => import('./registration'), {
    fallback
})
const ResetPassword = loadable(() => import('./reset-password'), {fallback})
const LoginRedirect = loadable(() => import('./login-redirect'), {fallback})
const ProductDetail = loadable(() => import('./product-detail'), {fallback})
const ProductList = loadable(() => import('./product-list'), {
    fallback
})
const SocialLoginRedirect = loadable(() => import('./social-login-redirect'), {
    fallback
})
const Wishlist = loadable(() => import('./account/wishlist'), {
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
    SocialLoginRedirect
}
