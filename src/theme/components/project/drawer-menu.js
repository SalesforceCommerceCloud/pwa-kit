/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: [
        'actions',
        'actionsItem',
        'backdrop',
        'body',
        'content',
        'footer',
        'header',
        'localeSelector',
        'logo',
        'signout',
        'socialsItem'
    ],
    base: {
        actions: {
            paddingLeft: 4,
            paddingRight: 4
        },
        actionsItem: {
            paddingTop: 3,
            paddingBottom: 3
        },
        body: {
            flex: 1,
            overflowY: 'auto',
            padding: 4
        },
        content: {
            borderRadius: '0px',
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            maxWidth: '320px',
            bg: 'white',
            display: 'flex',
            flexDirection: 'column'
        },
        footer: {
            paddingTop: 6,
            paddingBottom: 11,
            paddingLeft: 4,
            paddingRight: 4
        },
        header: {
            boxShadow: 'sm',
            paddingTop: 1,
            paddingBottom: 1,
            paddingLeft: 4,
            paddingRight: 4
        },
        localeSelector: {
            paddingTop: 1,
            paddingBottom: 1
        },
        logo: {
            width: 12,
            height: 8
        },
        signout: {
            width: '100%'
        },
        socialsItem: {}
    }
})
