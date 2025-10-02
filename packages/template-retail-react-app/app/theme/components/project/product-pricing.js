/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        price: {},
        originalPrice: {
            textDecoration: 'line-through',
            color: '#999'
        },
        promotionCallOut: {
            color: 'green',
            mt: 2
        }
    },
    variants: {
        pdp: {
            price: {
                fontWeight: 'bold',
                fontSize: 'md'
            }
        },
        tile: {}
    },
    defaultProps: {
        variant: 'Tile'
    }
}

