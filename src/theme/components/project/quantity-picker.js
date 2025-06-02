/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['root', 'input', 'incrementTrigger', 'decrementTrigger'],

    base: {
        root: {},
        input: {
            borderColor: 'gray.500',
            borderRadius: 'sm',
            borderWidth: '1px',
            height: '11',
            _focus: {
                borderColor: 'blue.500'
            }
        },
        incrementTrigger: {
            _active: {
                bgColor: 'blue.500'
            },
            borderColor: 'blue.500'
        },
        decrementTrigger: {
            _active: {
                bgColor: 'blue.500'
            },
            borderColor: 'blue.500'
        }
    }
})
