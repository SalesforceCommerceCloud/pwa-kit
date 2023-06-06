/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        container: {},
        socialsContainer: {
            flex: 1,
            justifyContent: 'flex-start'
        },
        icon: {
            color: 'gray.900',
            width: 5,
            height: 5
        },
        logo: {
            width: 12,
            height: 8
        },
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
            width: '100%',
            paddingLeft: 8,
            paddingTop: 2,
            paddingBottom: 2,
            _focus: {
                borderRadius: 0,
                boxShadow: 'outline'
            }
        },
        signoutText: {
            marginLeft: 2,
            fontSize: 14,
            fontWeight: 'normal'
        }
    },
    parts: [
        'actions',
        'actionsItem',
        'container',
        'icon',
        'localeSelector',
        'socials',
        'socialsItem',
        'signout'
    ]
}
