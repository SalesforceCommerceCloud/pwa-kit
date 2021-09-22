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

import {defineMessages} from 'react-intl'

export const categoriesThreeColumns = [
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Women's Outfits", description: 'tile.title'},
            // this line does not need translation
            href: {defaultMessage: '/{activeLocale}/category/womens-outfits', description: 'link'},
            // this line does not need translation
            imgSrc: {defaultMessage: 'static/img/women-outfit.png', description: 'link'},
            imgAlt: {defaultMessage: "Shop Women's Outfits", description: 'image.info'}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Men's Suits", description: 'tile.title'},
            // this line does not need translation
            href: {
                defaultMessage: '/{activeLocale}/category/mens-clothing-suits',
                description: 'link'
            },
            // this line does not need translation
            imgSrc: {defaultMessage: 'static/img/men-suits.png', description: 'link'},
            imgAlt: {defaultMessage: "Shop Men's Suits", description: 'image.info'}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Women's Dresses", description: 'tile.title'},
            // this line does not need translation
            href: {
                defaultMessage: '/{activeLocale}/category/womens-clothing-dresses',
                description: 'link'
            },
            // this line does not need translation
            imgSrc: {defaultMessage: 'static/img/women-dresses.png', description: 'link'},
            imgAlt: {defaultMessage: "Shop Women's Dresses", description: 'image.info'}
        })
    }
]
export const categoriesTwoColumns = [
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Women's Jackets & Coats", description: 'tile.title'},
            // this line does not need translation
            href: {
                defaultMessage: '/{activeLocale}/category/womens-clothing-jackets',
                description: 'link'
            },
            // this line does not need translation
            imgSrc: {defaultMessage: 'static/img/women-coats.png', description: 'link'},
            imgAlt: {defaultMessage: "Shop Women's Jackets & Coats", description: 'image.info'}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Shop Feeling Red', description: 'tile.title'},
            // this line does not need translation
            href: {
                defaultMessage: '/{activeLocale}/category/womens-clothing-feeling-red',
                description: 'link'
            },
            // this line does not need translation
            imgSrc: {defaultMessage: 'static/img/feeling-red.png', description: 'link'},
            imgAlt: {defaultMessage: 'Shop Feeling Red', description: 'image.info'}
        })
    }
]
