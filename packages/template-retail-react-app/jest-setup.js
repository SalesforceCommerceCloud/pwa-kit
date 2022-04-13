/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const mockConfig = require(path.join(__dirname, 'config/mocks/default.js'))

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})
