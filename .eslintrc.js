/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * This file is intended for linting rules that apply to all files in the monorepo, and exclusively
 * in the monorepo context (i.e. do not apply to generated projects). Rules that apply to generated
 * projects as well _must_ be added to `eslint-config-pwa-kit`. We don't have an established pattern
 * for having rules that apply to a subset of packages (e.g. `template-*` or `pwa-kit-*`), but those
 * should probably live somewhere like `eslint-config-pwa-kit`. Definitely not here.
 */

module.exports = {
    root: true,
    // NOTE: The header plugin is currently pinned to v3.0.0 because there's a regression in v3.1.0.
    // In files that start with a #! directive, the header is incorrectly applied multiple times.
    // More info: https://github.com/Stuk/eslint-plugin-header/issues/39
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
