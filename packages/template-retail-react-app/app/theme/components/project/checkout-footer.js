/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Footer from '@salesforce/retail-react-app/app/theme/components/project/footer'

const {baseStyle} = Footer

export default {
    parts: [
        'container',
        'content',
        'horizontalRule',
        'bottomHalf',
        'copyright',
        'creditCardIcon',
        'customerService'
    ],
    baseStyle: {
        container: baseStyle.container,
        content: baseStyle.content,
        horizontalRule: baseStyle.horizontalRule,
        bottomHalf: baseStyle.bottomHalf,
        copyright: baseStyle.copyright,
        creditCardIcon: {
            width: '38px',
            height: '22px'
        },
        customerService: {
            marginBottom: 6
        }
    }
}
