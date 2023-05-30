/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    extends: [require.resolve('@salesforce/pwa-kit-dev/configs/eslint')],
    plugins: ['no-relative-import-paths'],
    rules: {
        // https://github.com/MelvinVermeer/eslint-plugin-no-relative-import-paths
        'no-relative-import-paths/no-relative-import-paths': [
            'error',
            {
                allowSameFolder: false,
                ...(process.cwd().endsWith('template-retail-react-app')
                    ? {}
                    : // Otherwise, assumes that the current working directory is the monorepo
                      {rootDir: 'packages/template-retail-react-app/'}),
                prefix: '@salesforce/retail-react-app'
            }
        ]
    }
}
