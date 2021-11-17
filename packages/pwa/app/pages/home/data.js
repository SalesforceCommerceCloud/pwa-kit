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
    PlugIcon
} from '../../components/icons'

export const heroFeatures = [
    {
        message: defineMessages({
            title: {defaultMessage: 'Download on Github'}
        }),
        icon: <GithubLogo width={12} height={12} />,
        href: 'https://github.com/SalesforceCommerceCloud/pwa-kit'
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Deploy on Managed Runtime'}
        }),
        icon: <BrandLogo width={12} height={8} />,
        href: 'https://sfdc.co/deploy-on-managed-runtime'
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Create with the Figma PWA Design Kit'}
        }),
        icon: <FigmaLogo width={12} height={8} />,
        href: 'https://sfdc.co/figma-pwa-design-kit'
    }
]

export const features = [
    {
        message: defineMessages({
            title: {defaultMessage: 'Cart & Checkout'},
            text: {
                defaultMessage:
                    "Ecommerce best practice for a shopper's cart and checkout experience."
            }
        }),
        icon: <BasketIcon />
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Einstein Recommendations'},
            text: {
                defaultMessage:
                    'Deliver the next best product or offer to every shopper through product recommendations.'
            }
        }),
        icon: <LikeIcon />
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'My Account'},
            text: {
                defaultMessage:
                    "Shopper's can manage account information such as their profile, addresses, payments and orders."
            }
        }),
        icon: <AccountIcon />
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Shopper Login and API Access Service'},
            text: {
                defaultMessage:
                    'Enable shoppers to easily log in with a more personalized shopping experience.'
            }
        }),
        icon: <PlugIcon />
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Components & Design kit'},
            text: {
                defaultMessage:
                    'Built using Chakra UI, a simple, modular and accessible React component library.'
            }
        }),
        icon: <DashboardIcon />
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Wishlist'},
            text: {
                defaultMessage:
                    "Registered shopper's can add product items to their wishlist from purchasing later. "
            }
        }),
        icon: <HeartIcon />
    }
]
