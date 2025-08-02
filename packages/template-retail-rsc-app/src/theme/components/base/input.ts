/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

export default defineRecipe({
    base: {
        _focusVisible: {
            background: 'transparent',
            borderColor: 'blue.500',
            focusRingColor: 'blue.500'
        }
    },
    variants: {
        variant: {
            outline: {
                borderColor: 'gray.500'
            },
            // Note: Chakra v3 input has removed filled variant
            // we added it back to preserve the style in the template
            filled: {
                border: '1px solid {colors.gray.600}',
                backgroundColor: 'gray.100'
            }
        }
    },
    defaultVariants: {
        size: 'lg'
    }
})
