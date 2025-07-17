/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: [
        'container',
        'radioBox',
        'checkIndicator',
        'checkIcon'
    ],
    baseStyle: {
        container: {
            as: 'label'
        },
        radioBox: {
            position: 'relative',
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: 'base',
            height: 'full',
            px: 4,
            py: 4,
            _checked: {
                borderColor: 'blue.600'
            },
            _focus: {
                boxShadow: 'outline'
            }
        },
        checkIndicator: {
            position: 'absolute',
            top: 0,
            right: 0,
            w: 0,
            h: 0,
            borderStyle: 'solid',
            borderWidth: '0 38px 38px 0',
            borderColor: 'transparent',
            borderRightColor: 'blue.600'
        },
        checkIcon: {
            color: 'white',
            position: 'absolute',
            right: '-40px',
            top: '1px'
        }
    }
} 