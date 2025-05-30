/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: [
        'container',
        'heroImageGroup',
        'heroImage',
        'heroImageSkeleton',
        'thumbnailImageGroup',
        'thumbnailImageItem',
        'thumbnailImageSkeleton'
    ],

    base: {
        container: {},
        heroImage: {},
        heroImageGroup: {
            marginBottom: 2
        },
        heroImageSkeleton: {
            marginBottom: 2
        },
        thumbnailImageGroup: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            listStyleType: 'none'
        },
        thumbnailImageItem: {
            flexShrink: 0,
            cursor: 'pointer',
            flexBasis: [20, 20, 24],
            borderStyle: 'solid',
            marginBottom: [1, 1, 2, 2],
            marginRight: [1, 1, 2, 2],
            _focus: {
                boxShadow: 'outline'
            },
            _focusVisible: {
                outline: 0
            }
        },
        thumbnailImageSkeleton: {
            marginRight: 2,
            width: [20, 20, 24, 24]
        }
    },

    variants: {
        size: {
            sm: {
                heroImageSkeleton: {
                    maxWidth: ['none', 'none', 'none', '500px']
                },
                heroImage: {
                    maxWidth: ['none', 'none', 'none', '500px']
                }
            },
            md: {
                heroImageSkeleton: {
                    maxWidth: ['none', 'none', 'none', '680px']
                },
                heroImage: {
                    maxWidth: ['none', 'none', 'none', '680px']
                }
            }
        }
    },

    defaultProps: {
        size: 'md'
    }
})