/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    root: true,
    plugins: ['header'],
    rules: {
        'header/header': [
            2,
            'block',
            [
                '',
                {
                    pattern: '^ \\* Copyright \\(c\\) \\d{4}, (salesforce.com, inc|Salesforce, Inc)\\.$',
                    template: ' * Copyright (c) 2022, Salesforce, Inc.'
                },
                ' * All rights reserved.',
                ' * SPDX-License-Identifier: BSD-3-Clause',
                ' * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause',
                ' '
            ]
        ]
    }
}
