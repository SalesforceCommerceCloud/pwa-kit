/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: [
        'root',
        'backdrop',
        'content',
        'header',
        'body',
        'footer',
        'socialsItem',
        'actions',
        'actionsItem',
        'localeSelector',
        'signout'
    ],
    base: {
        root: {},
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
        header: {
            boxShadow: 'sm',
            paddingTop: 1,
            paddingBottom: 1,
            paddingLeft: 4,
            paddingRight: 4
        },
        body: {
            flex: 1,
            overflowY: 'auto',
            padding: 4
        },
        footer: {},
        socialsItem: {
            textAlign: 'center',
            paddingLeft: 2,
            paddingRight: 2
        },
        actions: {
            paddingLeft: 4,
            paddingRight: 4
        },
        actionsItem: {
            paddingTop: 3,
            paddingBottom: 3
        },
        localeSelector: {
            paddingTop: 1,
            paddingBottom: 1
        },
        signout: {
            width: '100%'
        }
    }
})
