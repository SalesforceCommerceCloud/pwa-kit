/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    variants: {
        subtle: (props) => ({
            container: {
                borderColor: `${props.colorScheme || 'green'}.600`,
                borderWidth: 1,
                borderStyle: 'solid'
            }
        })
    }
}
