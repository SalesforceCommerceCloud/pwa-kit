/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: () => ({
        container: {
            position: 'absolute',
            zIndex: '100',
            top: 2,
            left: 2,
            padding: '5px 10px',
            background: 'blue.500'
        },
        text: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 'md'
        }
    }),
    parts: ['container', 'text']
}

