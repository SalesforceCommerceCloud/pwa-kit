/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const ProductViewLayout = {
    parts: [
        'container',
        'leftColumn',
        'rightColumn',
        'headerMobile',
        'headerDesktop',
        'swatchGroup',
        'quantityPicker',
        'actionButtonsMobile',
        'actionsButtonsDesktop'
    ],
    baseStyle: {
        container: {
            flexDirection: 'column'
        },
        body: {
            flexDirection: ['column', 'column', 'column', 'row']
        },
        gallery: {
            flex: 1,
            mr: [0, 0, 0, 6, 6]
        },
        buySection: {
            align: 'stretch',
            spacing: 8,
            flex: 1,
            marginBottom: [16, 16, 16, 0, 0]
        },
        headerMobile: {
            background: 'red.400'
        },
        headerDesktop: {},
        swatchGroupContainer: {
            align: 'stretch',
            spacing: 4
        },
        actionButtonsMobile: {
            position: 'fixed',
            bg: 'white',
            width: '100%',
            p: [4, 4, 6],
            left: 0,
            bottom: 0,
            zIndex: 2
        }
    }
    // sizes: {},
    // variants: {},
    // defaultProps: {}
}

export default ProductViewLayout
