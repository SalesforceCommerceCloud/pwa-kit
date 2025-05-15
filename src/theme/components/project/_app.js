/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'headerWrapper'],
    base: {
        container: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            minWidth: '375px'
        },
        headerWrapper: {
            position: 'sticky',
            top: 0,
            // can't import theme object in Chakra V3, Let's use a hardcode value for now.
            // Will circle back when we start working on fixing component styling
            zIndex: 1100
        }
    }
})
