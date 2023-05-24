/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/** Extension of the base configuration for use in React projects. */
module.exports = {
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    },
    extends: ['plugin:react/recommended', 'plugin:jsx-a11y/recommended'],
    plugins: ['jsx-a11y', 'react', 'react-hooks', 'use-effect-no-deps'],

    settings: {
        react: {
            version: 'detect'
        }
    },
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        // react-hooks/exhaustive-deps has too many false positives; use-effect-no-deps is nicer
        'use-effect-no-deps/use-effect-no-deps': 'warn'
    }
}
