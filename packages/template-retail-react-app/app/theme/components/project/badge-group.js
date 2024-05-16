/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: () => ({
        badgeGroup: {
            position: 'absolute',
            variant: 'unstyled',
            top: 2,
            left: 2
        },
        badge :{
            ml: 1,
            variant: 'subtle'
        }
    }),
    parts: ['badgeGroup', 'badge']
}
