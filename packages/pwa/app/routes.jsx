import React from 'react'
import loadable from '@loadable/component'

// Components
import {Skeleton} from '@chakra-ui/react'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
const Home = loadable(() => import('./pages/home'), {fallback})
const Login = loadable(() => import('./pages/login'), {fallback})
const Registration = loadable(() => import('./pages/registration'), {fallback})
const ResetPassword = loadable(() => import('./pages/reset-password'), {fallback})
const Account = loadable(() => import('./pages/account'), {fallback})
const Cart = loadable(() => import('./pages/cart'), {fallback})
const Checkout = loadable(() => import('./pages/checkout'), {fallback})
const CheckoutConfirmation = loadable(() => import('./pages/checkout/confirmation'), {fallback})
const LoginRedirect = loadable(() => import('./pages/login-redirect'), {fallback})
const ProductDetail = loadable(() => import('./pages/product-detail'), {fallback})
const ProductList = loadable(() => import('./pages/product-list'), {fallback})

const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    {
        path: '/:locale/login',
        component: Login,
        exact: true
    },
    {
        path: '/:locale/registration',
        component: Registration,
        exact: true
    },
    {
        path: '/:locale/reset-password',
        component: ResetPassword,
        exact: true
    },
    {
        path: '/:locale/account',
        component: Account
    },
    {
        path: '/:locale/checkout',
        component: Checkout,
        exact: true
    },
    {
        path: '/:locale/checkout/confirmation',
        component: CheckoutConfirmation,
        exact: true
    },
    {
        path: '/callback',
        component: LoginRedirect,
        exact: true
    },
    {
        path: '/:locale/cart',
        component: Cart,
        exact: true
    },
    {
        path: '/:locale/product/:productId',
        component: ProductDetail
    },
    {
        path: '/:locale/category/:categoryId',
        component: ProductList
    }
]

export default routes
