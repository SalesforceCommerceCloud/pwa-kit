/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        container: {
            height: 'full',
            minWidth: 'xs',
            width: 'full',
            boxShadow: 'base',
            backgroundColor: 'white'
        },
        content: {
            maxWidth: 'container.xxxl',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: [4, 4, 6, 8],
            paddingRight: [4, 4, 6, 8],
            paddingTop: [1, 1, 2, 4],
            paddingBottom: [3, 3, 2, 4]
        },
        searchContainer: {
            order: [2, 2, 2, 'inherit'],
            width: ['full', 'full', 'full', 60],
            marginRight: [0, 0, 0, 4],
            marginBottom: [1, 1, 2, 0]
        },
        bodyContainer: {
            flex: '1'
        },
        logo: {
            width: [8, 8, 8, 12],
            height: [6, 6, 6, 8]
        },
        icons: {
            marginBottom: [1, 1, 2, 0]
        },
        accountIcon: {
            height: 11,
            cursor: 'pointer',
            alignSelf: ['self-start', 'self-start', 'self-start', 'auto'],
            _focus: {
                boxShadow: 'outline'
            },
            _focusVisible: {
                outline: 0
            }
        },
        arrowDown: {
            height: 11,
            marginRight: 0,
            alignSelf: ['self-start', 'self-start', 'self-start', 'auto'],
            cursor: 'pointer',
            _focus: {
                boxShadow: 'outline'
            },
            _focusVisible: {
                outline: 0
            },
            display: ['none', 'none', 'none', 'block']
        },
        signout: {
            width: '100%',
            borderRadius: '4px',
            height: 11,
            padding: 4,
            py: 3,
            marginTop: 1,
            _hover: {
                background: 'gray.50'
            }
        },
        signoutText: {
            fontSize: 'sm',
            fontWeight: 'normal'
        },
        signoutIcon: {
            marginRight: 2
        }
    },
    parts: ['container', 'content', 'searchContainer', 'bodyContainer', 'logo', 'icons', 'signout']
}
