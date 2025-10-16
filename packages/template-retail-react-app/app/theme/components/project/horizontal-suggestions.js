/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        container: {
            // Main container for horizontal suggestions
        },
        flexContainer: {
            gap: 4,
            overflowX: 'auto',
            pb: 2
        },
        suggestionItem: {
            width: {
                base: '50vw',
                md: '50vw',
                lg: '10vw'
            },
            flex: '0 0 auto'
        },
        imageContainer: {
            mb: 2
        },
        aspectRatio: {
            ratio: 1
        },
        dynamicImage: {
            height: '100%',
            width: '100%',
            '& picture': {
                display: 'block',
                height: '100%',
                width: '100%'
            },
            '& img': {
                display: 'block',
                height: '100%',
                width: '100%',
                objectFit: 'cover'
            }
        },
        productName: {
            fontSize: 'sm',
            fontWeight: 'medium',
            color: 'gray.900',
            mb: 1,
            noOfLines: 2
        },
        productPrice: {
            fontSize: 'sm',
            color: 'gray.900',
            fontWeight: 'medium'
        }
    }
}
