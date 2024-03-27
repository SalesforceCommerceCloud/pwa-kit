/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        accordion: {},
        container: {},
        selectedButtonIcon: {
            color: 'grey'
        },
        selectedButton: {
            paddingLeft: 0
        },
        selectedText: {
            flex: '1',
            textAlign: 'left',
            paddingLeft: 2
        },
        selectedIcon: {
            color: 'blue.600'
        },
        optionButton: {
            paddingLeft: 2
        },
        optionText: {
            paddingLeft: 2,
            paddingRight: 4,
            textAlign: 'left'
        }
    },
    parts: [
        'accordion',
        'container',
        'selectedButton',
        'selectedText',
        'optionButton',
        'optionText'
    ]
}
