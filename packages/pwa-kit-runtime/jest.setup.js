/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* global jest, afterAll */

// Jest setup file to ensure proper cleanup of async operations

// Clean up any remaining timers
afterAll(() => {
    // Clear any remaining timers
    jest.clearAllTimers()

    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }

    // Wait a bit for any pending operations to complete
    return new Promise((resolve) => setTimeout(resolve, 200))
})

afterAll(() => {
    jest.clearAllMocks()
})

// Mock the pwa-kit-dev package
jest.mock('../pwa-kit-dev/dist/bin/pwa-kit-dev.js', () => {
    return {
        __esModule: true,
        default: jest.fn()
    }
})
