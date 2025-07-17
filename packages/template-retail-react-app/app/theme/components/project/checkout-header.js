/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Header from '@salesforce/retail-react-app/app/theme/components/project/header'

const {baseStyle} = Header

export default {
    parts: [
        'container',
        'content',
        'flexContainer',
        'logo',
        'cartButton',
        'cartButtonIcon'
    ],
    baseStyle: {
        container: {
            ...baseStyle.container,
            px: [4, 4, 8],
            borderBottom: '1px',
            borderColor: 'gray.100'
        },
        content: baseStyle.content,
        flexContainer: {
            h: {base: '52px', md: '80px'},
            align: 'center',
            justify: 'space-between'
        },
        logo: {
            width: {base: '35px', md: '45px'},
            height: {base: '24px', md: '32px'}
        },
        cartButton: {
            variant: 'unstyled',
            color: 'gray.900'
        },
        cartButtonIcon: {
            position: 'relative',
            width: 11,
            height: 11
        }
    }
} 