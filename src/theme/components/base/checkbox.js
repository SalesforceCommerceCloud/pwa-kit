/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

export default defineRecipe({
    base: {
        container: {style: {alignItems: 'baseline'}},
        label: {
            width: 'full'
        },
        control: {
            marginTop: '2px',
            borderColor: 'gray.500',
            _checked: {
                backgroundColor: 'blue.600',
                borderColor: 'blue.600',
                _hover: {
                    bg: 'blue.700',
                    borderColor: 'blue.700'
                }
            }
        }
    },
    variants: {
        sizes: {
            md: {
                label: {fontSize: 'sm'}
            }
        }
    }
})
