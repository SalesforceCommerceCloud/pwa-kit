import React from 'react'
import loadable from '@loadable/component'

// Components
import {Skeleton} from '@chakra-ui/react'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
const Home = loadable(() => import('./pages/home'), {fallback})
const Cart = loadable(() => import('./pages/cart'), {fallback})
const Checkout = loadable(() => import('./pages/checkout'), {fallback})
const CheckoutConfirmation = loadable(() => import('./pages/checkout/confirmation'), {fallback})

const LoginRedirect = loadable(() => import('./pages/login-redirect'), {
    fallback
})
const ProductList = loadable(() => import('./pages/product-list'), {
    fallback
})

const routes = [
    {
        path: '/',
        component: Home,
        exact: true
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
        path: '/:locale/category/:categoryId',
        component: ProductList
    }
]

export default routes
