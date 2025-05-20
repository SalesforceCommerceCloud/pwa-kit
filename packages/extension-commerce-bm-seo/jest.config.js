/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,

        // handle pwa-kit extensibility special import
        '^overridable!(.*)': '$1'
    },
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    coverageThreshold: {
        global: {
            branches: 87,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
}
