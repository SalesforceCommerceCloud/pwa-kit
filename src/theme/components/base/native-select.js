/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

// Note: Chakra v3 Native Select component is Chakra v2 Select Component.
// Native Select no longer has "filled" variant for select
// we re-created it here so it will be used app-wise for all the select component in the storefront
export default defineSlotRecipe({
    variants: {
        variant: {
            filled: {
                field: {
                    border: '2px solid',
                    borderColor: 'transparent',
                    background: 'red.200',
                    _hover: {
                        background: 'gray.200'
                    },
                    _readOnly: {
                        boxShadow: 'none !important',
                        userSelect: 'all'
                    },
                    _focusVisible: {
                        background: 'transparent',
                        borderColor: 'blue.500'
                    }
                },
                indicator: {
                    color: 'white'
                }
            }
        }
    },
    defaultVariants: {
        variant: 'filled'
    }
})
