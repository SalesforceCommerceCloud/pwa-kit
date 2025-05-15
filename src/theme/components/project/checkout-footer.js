/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Footer from './footer'
import {defineSlotRecipe} from '@chakra-ui/react'

const {base: baseStyle} = Footer

export default defineSlotRecipe({
    slots: [
        'container',
        'content',
        'horizontalRule',
        'legalSection',
        'copyright',
        'creditCardIcon',
        'customerService'
    ],
    base: {
        container: baseStyle.container,
        content: baseStyle.content,
        horizontalRule: baseStyle.horizontalRule,
        legalSection: baseStyle.legalSection,
        copyright: baseStyle.copyright,
        creditCardIcon: {
            width: '38px',
            height: '22px'
        },
        customerService: {
            marginBottom: 6
        }
    }
})
