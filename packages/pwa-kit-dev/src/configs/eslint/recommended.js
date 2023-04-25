/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Recommended configuration for PWA Kit projects.
 * Contains rules for JavaScript, TypeScript, React, and Jest.
 */
module.exports = {
    extends: [
        require.resolve('./partials/base'),
        // React rules live in `extends`, rather than `overrides`, because any file can have React code.
        require.resolve('./partials/react')
    ],
    // TypeScript and Jest rules only apply to specific file paths, so they are overrides.
    overrides: [require('./partials/typescript-permit-any'), require('./partials/jest')]
}
