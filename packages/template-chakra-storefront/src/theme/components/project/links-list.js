/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'list', 'listItem', 'listItemSx', 'heading', 'link'],
    base: {
        container: {
            color: 'white'
        },
        list: {
            fontSize: 'sm'
        },
        headingLink: {
            display: 'inline-flex'
        },
        heading: {
            lineHeight: 1.2,
            fontSize: 'md',
            paddingTop: 3,
            paddingBottom: 3
        },
        link: {
            color: 'inherit'
        }
    },
    variants: {
        variant: {
            vertical: {
                list: {
                    gap: 5
                }
            },
            horizontal: {
                list: {
                    flexDirection: 'row',
                    gap: 2
                },
                listItem: {
                    borderLeft: '1px solid',
                    paddingLeft: 2,
                    '&:first-of-type': {
                        borderLeft: 0,
                        paddingLeft: 0
                    }
                }
            }
        }
    },
    defaultVariants: {
        variant: 'vertical'
    }
})
