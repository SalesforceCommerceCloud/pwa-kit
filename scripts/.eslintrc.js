/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Because this directory exists outside of the context of the packages, we
// can't rely on lerna magic. Importing from packages like this is not ideal,
// but there's no clean way of doing this and the scope of this is limited to
// dev tooling in this directory (it is unlikely to cause issues with packages).
module.exports = {
    extends: [require.resolve('../packages/eslint-config-pwa-kit')],
    parserOptions: {
        babelOptions: {
            presets: [require.resolve('../packages/babel-preset-pwa-kit')]
        }
    }
}
