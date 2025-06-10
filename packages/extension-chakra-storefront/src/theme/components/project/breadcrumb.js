/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'icon', 'link'],
    base: {
        container: {
            minHeight: 4,
            fontSize: 'sm'
        },
        icon: {
            display: 'flex',
            boxSize: 4,
            color: 'grey'
        },
        link: {
            pt: 3,
            pb: 3,
            textDecoration: 'none'
        }
    }
})
