/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

//Chakra v3 has remove the input
export default defineRecipe({
    slots: ['searchContainer', 'searchInput', 'searchIcon', 'clearIcon', 'cancelButton'],
    base: {
        searchContainer: {},
        searchIcon: {},
        clearIcon: {
            me: '-2'
        },
        searchInput: {
            borderColor: 'gray.600',
            border: '2px solid',
            backgroundColor: 'gray.100',
            _focusVisible: {
                background: 'transparent',
                borderColor: 'blue.500'
            }
        }
    }
})
