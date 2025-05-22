/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: [
        'container',
        'content',
        'subscribe',
        'subscribeField',
        'subscribeButtonContainer',
        'subscribeHeading',
        'subscribeMessage',
        'localeSelectorWrapper',
        'localeSelectorRoot',
        'localeSelectorField',
        'localeDropdownOption',
        'legalSection',
        'horizontalRule',
        'copyright',
        'socialIcons'
    ],
    base: {
        container: {
            width: 'full',
            background: 'gray.900'
        },
        content: {
            maxWidth: 'container.xxl',
            marginLeft: 'auto',
            marginRight: 'auto',
            color: 'white',
            paddingTop: {base: 8, lg: 10},
            paddingBottom: 8,
            paddingLeft: [4, 4, 6, 8],
            paddingRight: [4, 4, 6, 8]
        },
        subscribe: {
            maxWidth: {base: '21.5rem', lg: 'none'}
        },
        subscribeField: {
            background: 'white',
            color: 'gray.900'
        },
        subscribeButtonContainer: {
            width: 'auto'
        },
        subscribeHeading: {
            fontSize: 'md',
            marginBottom: 2
        },
        subscribeMessage: {
            fontSize: 'sm',
            marginBottom: 4
        },
        localeSelectorWrapper: {
            display: 'inline-block',
            marginTop: 8
        },
        localeSelectorRoot: {},
        localeSelectorField: {
            fontSize: 'md',
            background: 'gray.800',
            _hover: {
                background: 'whiteAlpha.500'
            }
        },
        localeDropdownOption: {
            color: 'black'
        },
        legalSection: {
            maxWidth: {base: '34.5rem', lg: '100%'}
        },
        horizontalRule: {
            marginTop: 4,
            marginBottom: 4
        },
        copyright: {
            fontSize: 'sm',
            marginBottom: 6,
            color: 'gray.50'
        }
    }
})
