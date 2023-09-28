/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: () => ({
        container: {
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        },
        favIcon: {
            position: 'absolute',
            variant: 'unstyled',
            top: 2,
            right: 2
        },
        imageWrapper: {
            height: '100%',
            position: 'relative'
            //marginBottom: 2
        },
        image: {
            ratio: 1,
            height: '100%',
            //paddingBottom: 2,
            filter: 'grayscale(0%)',
            transition: 'all 0.8s ease'
        },
        ptileHoverPane: {
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            margin: '0 9px 9px',
            borderRadius: '4px',
            display: 'inline-block',
            padding: '6px 10px',
            transition: 'all 0.8s ease',
            background: 'rgba(255, 255, 255, 0.5)'
        },
        price: {},
        title: {
            fontWeight: 600
        },
        rating: {},
        variations: {}
    }),
    parts: [
        'container',
        'imageWrapper',
        'image',
        'ptileHoverPane',
        'price',
        'title',
        'rating',
        'variations'
    ]
}
