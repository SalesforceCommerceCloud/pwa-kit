/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import 'raf/polyfill' // fix requestAnimationFrame issue with polyfill
import fetch from 'jest-fetch-mock'
import 'regenerator-runtime/runtime'

// Polyfill setImmediate/clearImmediate for jsdom environment (Jest 28+)
// jsdom no longer provides these Node.js globals by default
if (typeof global.setImmediate === 'undefined') {
    global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args)
    global.clearImmediate = (id) => clearTimeout(id)
}

// Polyfill performance.mark/measure for jsdom environment (Jest 29+)
// jsdom v20 does not implement the User Timing API (performance.mark/measure)
// Use the Node.js built-in performance API as a fallback
if (typeof global.performance !== 'undefined' && typeof global.performance.mark !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {performance: nodePerformance} = require('perf_hooks')
    global.performance.mark = nodePerformance.mark.bind(nodePerformance)
    global.performance.measure = nodePerformance.measure.bind(nodePerformance)
    global.performance.getEntriesByName = nodePerformance.getEntriesByName.bind(nodePerformance)
    global.performance.getEntriesByType = nodePerformance.getEntriesByType.bind(nodePerformance)
    global.performance.clearMarks = nodePerformance.clearMarks.bind(nodePerformance)
    global.performance.clearMeasures = nodePerformance.clearMeasures.bind(nodePerformance)
}

// Mock Fetch
global.fetch = fetch
