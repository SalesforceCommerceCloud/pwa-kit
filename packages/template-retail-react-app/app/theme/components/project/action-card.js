/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: ['container', 'content', 'actionsContainer', 'editButton', 'removeButton'],
    baseStyle: {
        container: {
            spacing: 4,
            p: 4,
            position: 'relative',
            border: '1px solid',
            borderColor: 'gray.100',
            borderRadius: 'base'
        },
        content: {},
        actionsContainer: {
            direction: 'row',
            spacing: 4
        },
        editButton: {
            variant: 'link',
            size: 'sm'
        },
        removeButton: {
            variant: 'link',
            size: 'sm',
            colorScheme: 'red',
            color: 'red.600'
        }
    }
}
