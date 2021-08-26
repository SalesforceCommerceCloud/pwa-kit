/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: (props) => ({
        container: {
            position: 'relative'
        },
        iconButton: {
            position: 'absolute',
            top: 2,
            right: 2,
            opacity: `${props.isLoading ? 0.5 : 1}`
        },
        imageWrapper: {
            marginBottom: 2
        },
        image: {
            paddingBottom: 2
        },
        price: {},
        title: {
            fontWeight: 600
        },
        rating: {},
        variations: {}
    }),
    parts: ['container', 'imageWrapper', 'image', 'price', 'title', 'rating', 'variations']
}
