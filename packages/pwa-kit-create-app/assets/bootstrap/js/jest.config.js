/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    ...require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js'),
    // Empty array to ensure no files are ignored
    transformIgnorePatterns: []
}
