/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'item', 'icon'],
    base: {
        container: {
            flex: 1,
            marginTop: 4
        },
        icon: {
            width: 5,
            height: 5
        },
        item: {
            textAlign: 'center'
        }
    },
    variants: {
        variant: {
            'flex-start': {
                container: {
                    justifyContent: 'flex-start'
                },
                item: {
                    flex: 0
                }
            },
            'flex-end': {
                container: {
                    justifyContent: 'flex-end'
                },
                item: {
                    flex: 0
                }
            },
            flex: {
                container: {
                    justifyContent: 'center'
                },
                item: {
                    flex: 1
                }
            }
        }
    },
    defaultVariants: {
        variant: 'flex-start'
    }
})
