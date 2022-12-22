/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is the data used in by the Retail React App home page.
 * The example static data is created for demonstration purposes.
 * Typically you'd get this information from the API or possibly
 * from content slots.
 */
import React from 'react'
import {defineMessages} from 'react-intl'
import {
    AccountIcon,
    BasketIcon,
    BrandLogo,
    FigmaLogo,
    GithubLogo,
    DashboardIcon,
    HeartIcon,
    LikeIcon,
    PlugIcon,
} from 'retail-react-app/app/components/icons'

export const heroFeatures = [
    {
        //  message: defineMessages({
        //      title: {defaultMessage: 'Download on Github', id: 'home.hero_features.link.on_github'}
        //  }),
        message: {
            title: 'Download on Github',
            text: '',
        },
        icon: <GithubLogo width={12} height={12} />,
        href: 'https://github.com/SalesforceCommerceCloud/pwa-kit',
    },
    {
        // message: defineMessages({
        //     title: {
        //         defaultMessage: 'Deploy on Managed Runtime',
        //         id: 'home.hero_features.link.on_managed_runtime',
        //     },
        // }),
        message: {
            title: 'Deploy on Managed Runtime',
            text: '',
        },
        icon: <BrandLogo width={12} height={8} />,
        href: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html',
    },
    {
        // message: defineMessages({
        //     title: {
        //         defaultMessage: 'Create with the Figma PWA Design Kit',
        //         id: 'home.hero_features.link.design_kit',
        //     },
        // }),
        message: {
            title: 'Create with the Figma PWA Design Kit',
            text: '',
        },
        icon: <FigmaLogo width={12} height={8} />,
        href: 'https://sfdc.co/figma-pwa-design-kit',
    },
]

export const features = [
    {
        // message: defineMessages({
        //     title: {defaultMessage: 'Cart & Checkout', id: 'home.features.heading.cart_checkout'},
        //     text: {
        //         defaultMessage:
        //             "Ecommerce best practice for a shopper's cart and checkout experience.",
        //         id: 'home.features.description.cart_checkout',
        //     },
        // }),
        message: {
            title: 'Cart & Checkout',
            text: `Ecommerce best practice for a shopper's cart and checkout experience.`,
        },
        icon: <BasketIcon />,
    },
    {
        // message: defineMessages({
        //     title: {
        //         defaultMessage: 'Einstein Recommendations',
        //         id: 'home.features.heading.einstein_recommendations',
        //     },
        //     text: {
        //         defaultMessage:
        //             'Deliver the next best product or offer to every shopper through product recommendations.',
        //         id: 'home.features.description.einstein_recommendations',
        //     },
        // }),
        message: {
            title: 'Einstein Recommendations',
            text: 'Deliver the next best product or offer to every shopper through product recommendations.',
        },
        icon: <LikeIcon />,
    },
    {
        // message: defineMessages({
        //     title: {defaultMessage: 'My Account', id: 'home.features.heading.my_account'},
        //     text: {
        //         defaultMessage:
        //             'Shoppers can manage account information such as their profile, addresses, payments and orders.',
        //         id: 'home.features.description.my_account',
        //     },
        // }),
        message: {
            title: 'My Account',
            text: `Shoppers can manage account information such as their profile, addresses, payments and orders.`,
        },
        icon: <AccountIcon />,
    },
    {
        // message: defineMessages({
        //     title: {
        //         defaultMessage: 'Shopper Login and API Access Service',
        //         id: 'home.features.heading.shopper_login',
        //     },
        //     text: {
        //         defaultMessage:
        //             'Enable shoppers to easily log in with a more personalized shopping experience.',
        //         id: 'home.features.description.shopper_login',
        //     },
        // }),
        message: {
            title: `Shopper Login and API Access Service`,
            text: 'Enable shoppers to easily log in with a more personalized shopping experience.',
        },
        icon: <PlugIcon />,
    },
    {
        // message: defineMessages({
        //     title: {
        //         defaultMessage: 'Components & Design Kit',
        //         id: 'home.features.heading.components',
        //     },
        //     text: {
        //         defaultMessage:
        //             'Built using Chakra UI, a simple, modular and accessible React component library.',
        //         id: 'home.features.description.components',
        //     },
        // }),
        message: {
            title: 'Components & Design Kit',
            text: 'Built using Chakra UI, a simple, modular and accessible React component library.',
        },
        icon: <DashboardIcon />,
    },
    {
        // message: defineMessages({
        //     title: {defaultMessage: 'Wishlist', id: 'home.features.heading.wishlist'},
        //     text: {
        //         defaultMessage:
        //             'Registered shoppers can add product items to their wishlist from purchasing later. ',
        //         id: 'home.features.description.wishlist',
        //     },
        // }),
        message: {
            title: 'Wishlist',
            text: 'Registered shoppers can add product items to their wishlist from purchasing later. ',
        },
        icon: <HeartIcon />,
    },
]
