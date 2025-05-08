/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

export default defineRecipe({
    slots: ['container', 'icon', 'message'],
    base: {
        container: {
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: [4, 4, 6, 6, 8],
            paddingRight: [4, 4, 6, 6, 8]
        },
        icon: {
            height: 5,
            width: 5
        },
        message: {
            paddingLeft: 2,
            fontWeight: 700
        }
    }
})
