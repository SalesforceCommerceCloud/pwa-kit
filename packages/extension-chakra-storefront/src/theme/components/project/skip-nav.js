/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['link', 'content'],
    base: {
        link: {
            position: 'absolute',
            zIndex: 'skipNav',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            _focusVisible: {
                // !important needed to override the default hidden positioning (absolute + left: -10000px)
                position: 'fixed !important',
                top: '6px !important',
                left: '6px !important',
                width: 'auto !important',
                height: 'auto !important',
                overflow: 'visible !important',
                zIndex: 'skipNav',
                padding: '8px',
                backgroundColor: 'white',
                color: 'black',
                textDecoration: 'none',
                border: '2px solid black',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'nowrap'
            },
            _focus: {
                // !important needed to override the default hidden positioning (absolute + left: -10000px)
                position: 'fixed !important',
                top: '6px !important',
                left: '6px !important',
                width: 'auto !important',
                height: 'auto !important',
                overflow: 'visible !important',
                zIndex: 'skipNav',
                padding: '8px',
                backgroundColor: 'white',
                color: 'black',
                textDecoration: 'none',
                border: '2px solid black',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                whiteSpace: 'nowrap'
            }
        },
        content: {}
    }
})
