/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    // To support extensibility, jest needs to transform the underlying templates/extensions
    transformIgnorePatterns: ['/node_modules/(?!@salesforce/retail-react-app/.*)'],
    moduleNameMapper: {
        ...base.moduleNameMapper,
        // pulled from @salesforce/retail-react-app jest.config.js
        // allows jest to resolve imports for these packages
        '^is-what$': '<rootDir>/node_modules/is-what/dist/cjs/index.cjs',
        '^copy-anything$': '<rootDir>/node_modules/copy-anything/dist/cjs/index.cjs'
    }
}
