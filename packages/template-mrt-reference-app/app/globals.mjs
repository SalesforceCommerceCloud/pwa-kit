/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Global module setup for ES modules compatibility
 * 
 * This module sets up global utilities that are commonly needed
 * when transitioning from CommonJS to ES modules, particularly
 * the `require` function for loading JSON files and CommonJS modules.
 */

import { createRequire } from "module"

// Create a require function bound to this module's URL
const require = createRequire(import.meta.url)

// Make require available globally so any libraries can use it
// This is particularly useful for:
// - Loading JSON files (e.g., package.json)
// - Loading CommonJS modules that haven't been converted to ES modules
// - Third-party libraries that expect require to be available
global.require = require

// Export for explicit imports if needed
export { require }
