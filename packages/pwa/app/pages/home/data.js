/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'

// TODO: [l10n] localize these hardcoded strings
export const categories = [
    {
        title: "Shop Women's Outfits",
        href: '/en/category/womens-outfits',
        img: {
            src: getAssetUrl('static/img/women-outfit.png'),
            alt: "Shop Women's Outfits"
        }
    },
    {
        title: "Shop Men's Suits",
        href: '/en/category/mens-clothing-suits',
        img: {
            src: getAssetUrl('static/img/men-suits.png'),
            alt: "Shop Men's Suits"
        }
    },
    {
        title: "Shop Women's Dresses",
        href: '/en/category/womens-clothing-dresses',
        img: {
            src: getAssetUrl('static/img/women-dresses.png'),
            alt: "Shop Women's Dresses"
        }
    },
    {
        title: "Shop Women's Jackets & Coats",
        href: '/en/category/womens-clothing-jackets',
        img: {
            src: getAssetUrl('static/img/women-coats.png'),
            alt: "Shop Women's Jackets & Coats"
        }
    },
    {
        title: 'Shop Feeling Red',
        href: '/en/category/womens-clothing-feeling-red',
        img: {
            src: getAssetUrl('static/img/feeling-red.png'),
            alt: 'Shop Feeling Red'
        }
    }
]
