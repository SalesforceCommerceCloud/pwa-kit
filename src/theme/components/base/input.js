/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

export default defineRecipe({
    base: {},
    variants: {
        variant: {
            outline: {
                field: {
                    borderColor: 'gray.500'
                }
            },
            // Note: Chakra v3 input has removed filled variant
            // we added it back to preserve the style in the template
            filled: {
                border: '2px solid {colors.gray.600}',
                backgroundColor: 'gray.100',
                focusVisibleRing: 'inside',
                focusRingColor: 'var(--focus-color)',
                _focus: {
                    backgroundColor: 'white'
                },
                _focusVisible: {
                    background: 'transparent',
                    borderColor: 'blue.500',
                    outlineWidth: 0
                },
                _hover: {
                    backgroundColor: 'gray.100',
                    _focus: {
                        backgroundColor: 'white'
                    }
                },
                _placeholder: {
                    color: 'gray.700'
                }
            }
        }
    },
    defaultVariants: {
        size: 'lg'
    }
})
