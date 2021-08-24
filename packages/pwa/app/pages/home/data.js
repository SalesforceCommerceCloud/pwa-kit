/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {useIntl} from 'react-intl'

// TODO: [l10n] localize these hardcoded strings
export const categories = (locale) => {
    const intl = useIntl()

    return [
        {
            title: intl.formatMessage({
                defaultMessage: "Shop Women's Outfits"
            }),
            href: `/${locale}/category/womens-outfits`,
            img: {
                src: getAssetUrl('static/img/women-outfit.png'),
                alt: intl.formatMessage({
                    defaultMessage: "Shop Women's Outfits"
                })
            }
        },
        {
            title: intl.formatMessage({
                defaultMessage: "Shop Men's Suits"
            }),
            href: `/${locale}/category/mens-clothing-suits`,
            img: {
                src: getAssetUrl('static/img/men-suits.png'),
                alt: intl.formatMessage({
                    defaultMessage: "Shop Men's Suits"
                })
            }
        },
        {
            title: intl.formatMessage({
                defaultMessage: "Shop Women's Dresses"
            }),
            href: `/${locale}/category/womens-clothing-dresses`,
            img: {
                src: getAssetUrl('static/img/women-dresses.png'),
                alt: intl.formatMessage({
                    defaultMessage: "Shop Women's Dresses"
                })
            }
        },
        {
            title: intl.formatMessage({
                defaultMessage: "Shop Women's Jackets & Coats"
            }),
            href: `/${locale}/category/womens-clothing-jackets`,
            img: {
                src: getAssetUrl('static/img/women-coats.png'),
                alt: intl.formatMessage({
                    defaultMessage: "Shop Women's Jackets & Coats"
                })
            }
        },
        {
            title: intl.formatMessage({
                defaultMessage: 'Shop Feeling Red'
            }),
            href: `/${locale}/category/womens-clothing-feeling-red`,
            img: {
                src: getAssetUrl('static/img/feeling-red.png'),
                alt: intl.formatMessage({
                    defaultMessage: 'Shop Feeling Red'
                })
            }
        }
    ]
}
