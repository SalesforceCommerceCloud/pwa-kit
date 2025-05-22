/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

// TODO: How can we import these keys without hardcoding
export default defineRecipe({
    slots: ['title', 'description', 'root', 'indicator', 'content'],
    variants: {
        variant: {
            subtle: {
                root: {
                    borderColor: 'colorPalette.600',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: 'gray.900',
                    borderRadius: 0
                }
            }
        }
    }
})
