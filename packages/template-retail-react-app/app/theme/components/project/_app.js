/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import theme from '@salesforce/retail-react-app/app/components/shared/theme'

export default {
    baseStyle: {
        container: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            minWidth: '375px'
        },
        headerWrapper: {
            position: 'sticky',
            top: 0,
            zIndex: {
                base: theme.zIndices.sticky,
                sm: theme.zIndices.base,
                md: theme.zIndices.base
            }
        }
    },
    sizes: {
        headerWrapper: {
            zIndex: theme.zIndices.base
        }
    },
    parts: ['container']
}
