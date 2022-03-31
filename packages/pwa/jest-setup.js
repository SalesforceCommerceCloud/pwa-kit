/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
require('pwa-kit-build/configs/jest/jest-setup')

// mock the config globally to be consumed by all unit tests
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})
