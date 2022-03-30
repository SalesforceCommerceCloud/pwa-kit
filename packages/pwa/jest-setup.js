/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

require('pwa-kit-build/configs/jest/jest-setup')

import mockConfig from './config/__mocks__/default'

console.log('mockConfig', mockConfig)

// Mock the `default` config to the window global
Object.defineProperty(window, '__CONFIG__', {
    value: mockConfig,
    configurable: true
})
console.log('window.__CONFIG__', window.__CONFIG__)
