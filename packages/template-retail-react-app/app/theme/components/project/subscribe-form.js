/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: ['container', 'heading', 'message', 'field', 'buttonContainer', 'socialIcons'],
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
            color: 'gray.900'
        },
        buttonContainer: {
            width: 'auto'
        },
        socialIcons: {
            marginTop: 4
        }
    }
}
