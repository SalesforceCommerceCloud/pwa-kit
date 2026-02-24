/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: [
        'container',
        'heading',
        'message',
        'field',
        'button',
        'socialIcons',
        'link',
        'disclaimer'
    ],
    baseStyle: {
        container: {
            maxWidth: {base: '21.5rem', lg: 'none'}
        },
        heading: {
            fontSize: 'md',
            paddingTop: {base: 0, lg: 3},
            marginBottom: 2
        },
        message: {
            fontSize: 'sm',
            marginBottom: 4
        },
        field: {
            background: 'white',
            color: 'gray.900',
            borderRightRadius: 0
        },
        button: {
            borderLeftRadius: 0,
            height: 'auto',
            paddingLeft: 5,
            paddingRight: 5
        },
        socialIcons: {
            marginTop: 4
        },
        link: {
            color: 'blue.500'
        },
        disclaimer: {
            fontSize: 'xs',
            color: 'gray.500',
            marginTop: 2
        }
    }
}
