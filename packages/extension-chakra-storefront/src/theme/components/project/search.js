/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

export default defineRecipe({
    slots: ['cancelButton', 'clearIcon', 'searchContainer', 'searchIcon', 'searchInput'],
    base: {
        cancelButton: {},
        clearIcon: {
            me: '-2'
        },
        searchContainer: {},
        searchIcon: {},
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
