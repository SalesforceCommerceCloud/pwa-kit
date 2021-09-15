/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export default {
    baseStyle: {
        container: {
            flex: 1,
            minWidth: '375px'
        },
        main: {
            padding: {lg: 8, md: 6, sm: 0, base: 0},
            flex: 1
        },
        content: {
            px: {base: 4, md: 6, lg: 50},
            py: {base: 20, md: 24},
            height: 'full',
            flexDirection: 'column',
            justifyContent: 'center'
        },
        header: {
            width: 'full',
            boxShadow: 'base',
            backgroundColor: 'white'
        },
        headerContent: {
            maxWidth: 'container.xxxl',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: [4, 4, 6, 8],
            paddingRight: [4, 4, 6, 8],
            paddingTop: [1, 1, 2, 4],
            paddingBottom: [3, 3, 2, 4]
        },
        logo: {
            width: [8, 8, 8, 12],
            height: [6, 6, 6, 8]
        },
        icons: {
            marginBottom: [1, 1, 2, 0]
        },
        buttons: {
            width: ['100%', 'auto']
        },
        description: {
            maxWidth: '440px',
            marginBottom: 8
        },
        stackTrace: {
            marginTop: 20
        },
        pre: {
            mt: 4,
            fontSize: 'sm',
            background: 'gray.50',
            borderColor: 'gray.200',
            borderStyle: 'solid',
            borderWidth: '1px',
            overflow: 'auto',
            padding: 4
        }
    },
    parts: [
        'container',
        'main',
        'content',
        'header',
        'headerContent',
        'buttons',
        'logo',
        'icons',
        'buttons',
        'description',
        'pre',
        'stackTrace'
    ]
}
