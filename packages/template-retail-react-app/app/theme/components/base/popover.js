/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: ['popper'],
    baseStyle: {
        popper: {
            borderColor: 'transparent',
            borderRadius: 'base',
            boxShadow: '0px 1px 12px rgba(0, 0, 0, 0.25)'
        }
    },
    variants: {
        small: {},
        normal: {
            popper: {
                width: 286
            },
            header: {
                textAlign: 'left',
                fontWeight: 700,
                borderBottom: 'none',
                fontSize: 18,
                px: 7,
                paddingTop: 6
            },
            footer: {
                textAlign: 'left',
                fontSize: 14,
                px: 3,
                borderTop: 'none'
            },
            content: {
                width: 286
            },
            body: {
                py: 0
            }
        },
        fullWidth: {
            popper: {
                width: '100%',
                maxWidth: '100%',
                boxShadow: 'none',
                top: '0',
                right: 'auto',
                bottom: 'auto',
                left: '0'
            },
            content: {
                width: 'auto'
            }
        }
    },
    defaultProps: {
        variant: 'normal'
    }
}
