/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        price: {
            fontWeight: 'bold'
        },
        strikethroughPrice: {
            textDecoration: 'line-through',
            marginLeft: 2
        },
        startingAt: {
            fontWeight: 'bold',
            fontSize: 'md',
            marginRight: 1
        }
    },
    variants: {
        pdp: {},
        tile: {
            price: {
                fontWeight: 'normal'
            },
            startingAt: {
                fontWeight: 'normal'
            }
        },
        addToCartModal: {
            discountPrice: {
                fontWeight: 'normal'
            }
        }
    },
    defaultProps: {
        variant: 'pdp'
    }
}
