/*
 * Copyright (c) 2021, salesforce.com, inc.
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
                    borderColor: 'blue.500'
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
