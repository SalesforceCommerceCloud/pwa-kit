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
            title: {defaultMessage: "Shop Women's Outfits"},
            href: {defaultMessage: '/{activeLocale}/category/womens-outfits'},
            imgSrc: {defaultMessage: 'static/img/women-outfit.png'},
            imgAlt: {defaultMessage: "Shop Women's Outfits"}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Men's Suits"},
            href: {defaultMessage: '/{activeLocale}/category/mens-clothing-suits'},
            imgSrc: {defaultMessage: 'static/img/men-suits.png'},
            imgAlt: {defaultMessage: "Shop Men's Suits"}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Women's Dresses"},
            href: {defaultMessage: '/{activeLocale}/category/womens-clothing-dresses'},
            imgSrc: {defaultMessage: 'static/img/women-dresses.png'},
            imgAlt: {defaultMessage: "Shop Women's Dresses"}
        })
    }
]
export const categoriesTwoColumns = [
    {
        message: defineMessages({
            title: {defaultMessage: "Shop Women's Jackets & Coats"},
            href: {defaultMessage: '/{activeLocale}/category/womens-clothing-jackets'},
            imgSrc: {defaultMessage: 'static/img/women-coats.png'},
            imgAlt: {defaultMessage: "Shop Women's Jackets & Coats"}
        })
    },
    {
        message: defineMessages({
            title: {defaultMessage: 'Shop Feeling Red'},
            href: {defaultMessage: '/{activeLocale}/category/womens-clothing-feeling-red'},
            imgSrc: {defaultMessage: 'static/img/feeling-red.png'},
            imgAlt: {defaultMessage: 'Shop Feeling Red'}
        })
    }
]
