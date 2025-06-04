/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'button', 'text'],
    base: {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
        },
        button: {
            color: 'black',
            _hover: {
                textDecoration: 'none'
            },
            _disabled: {
                opacity: 0.5,
                cursor: 'not-allowed'
            }
        },
        text: {
            whiteSpace: 'nowrap',
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
            fontSize: 'sm',
            fontWeight: 'normal'
        }
    }
})
