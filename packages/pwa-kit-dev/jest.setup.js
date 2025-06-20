/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* global jest, afterEach, afterAll */

// Jest setup file to ensure proper cleanup of async operations

// Clean up any remaining timers
afterEach(() => {
    jest.clearAllTimers()
})

afterAll(() => {
    jest.clearAllMocks()
})

// Mock the pwa-kit-dev package
jest.mock('../pwa-kit-dev/dist/bin/pwa-kit-dev.js', () => {
    return new Promise((resolve) => {
        resolve({
            __esModule: true,
            default: jest.fn()
        })
    })
})
