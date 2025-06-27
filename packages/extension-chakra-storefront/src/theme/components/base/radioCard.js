/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['root', 'item'],
    base: {
        root: {
            display: 'flex',
            flexDirection: 'column',
            gap: 4
        },
        item: {
            position: 'relative',
            cursor: 'pointer',
            border: '10px solid',
            borderColor: 'gray.200',
            borderRadius: 'l2',
            height: 'full',
            _focus: {
                boxShadow: 'outline',
                bg: 'transparent',
            },
        },
    },
})
