module.exports = {
    root: true,
    rules: {
        'header/header': [
            2,
            'block',
            [
                '',
                {
                    pattern: '^ \\* Copyright \\(c\\) \\d{4}, salesforce.com, inc\\.$',
                    template: ' * Copyright (c) 2021, salesforce.com, inc.'
                },
                ' * All rights reserved.',
                ' * SPDX-License-Identifier: BSD-3-Clause',
                ' * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause',
                ' '
            ]
        ]
    }
}