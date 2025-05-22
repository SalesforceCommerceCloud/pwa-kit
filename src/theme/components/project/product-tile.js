/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    base: {
        container: {
            position: 'relative'
        },
        favIcon: {
            position: 'absolute',
            variant: 'unstyled',
            top: 2,
            right: 2
        },
        imageWrapper: {
            position: 'relative',
            marginBottom: 2
        },
        aspectRatio: {
            ratio: 1,
            paddingBottom: 2
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        },
        link: {
            display: 'block'
        },
        price: {},
        title: {
            fontWeight: 600
        },
        rating: {},
        variations: {},
        badgeGroup: {
            position: 'absolute',
            top: 2,
            left: 2
        }
    },
    slots: [
        'container',
        'imageWrapper',
        'aspectRatio',
        'image',
        'price',
        'title',
        'rating',
        'variations',
        'badgeGroup',
        'link',
        'favIcon'
    ]
})
