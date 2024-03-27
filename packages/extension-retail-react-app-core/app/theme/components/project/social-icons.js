/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        container: {
            flex: 1
        },
        icon: {
            width: 5,
            height: 5
        },
        item: {
            textAlign: 'center',
            paddingLeft: 2,
            paddingRight: 2
        }
    },
    variants: {
        'flex-start': {
            container: {
                justifyContent: 'flex-start'
            },
            item: {
                flex: 0
            }
        },
        'flex-end': {
            container: {
                justifyContent: 'flex-end'
            },
            item: {
                flex: 0
            }
        },
        flex: {
            container: {
                justifyContent: 'center'
            },
            item: {
                flex: 1
            }
        }
    },
    parts: ['container', 'item', 'icon'],
    defaultProps: {
        variant: 'flex-start'
    }
}
