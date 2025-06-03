/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'internalButton', 'internalButtonIcon', 'leafButton', 'nestedAccordion'],
    base: {
        container: {},
        internalButton: {},
        internalButtonIcon: {
            color: 'grey',
            marginRight: 2
        },
        leafButton: {
            color: 'black',
            paddingLeft: 8,
            paddingTop: 2,
            paddingBottom: 2
        },
        nestedAccordion: {
            paddingLeft: 4
        }
    }
})
