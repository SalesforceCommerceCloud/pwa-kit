/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['container', 'button', 'text', 'select', 'selectField', 'selectIndicator'],
    base: {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
        },
        button: {
            color: 'black',
            fontSize: 'sm',
            fontWeight: 'normal',
            gap: 1,
            px: 2,
            py: 1,
            minW: 'auto',
            h: 'auto',
            _hover: {
                textDecoration: 'none'
            },
            _disabled: {
                opacity: 0.4,
                cursor: 'not-allowed'
            }
        },
        text: {
            whiteSpace: 'nowrap',
            fontSize: 'sm',
            fontWeight: 'normal',
            color: 'black'
        },
        select: {
            fontSize: 'sm',
            fontWeight: 'normal',
            mx: 2
        },
        selectField: {
            bg: 'white',
            border: '1px solid',
            borderColor: 'gray.300',
            borderRadius: 'sm',
            fontSize: 'sm',
            fontWeight: 'normal',
            px: 3,
            py: 2,
            minH: 'auto',
            h: '40px',
            minW: '60px'
        },
        selectIndicator: {
            color: 'black',
        }
    }
})
