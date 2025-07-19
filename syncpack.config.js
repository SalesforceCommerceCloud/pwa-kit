/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
  // Sync ESLint-related dependencies between pwa-kit-dev and template-retail-react-app
  dependencyTypes: ['dev', 'prod'],
  versionGroups: [
    {
      // Group all ESLint-related packages together
      label: 'ESLint Dependencies',
      packages: [
        'packages/pwa-kit-dev',
        'packages/template-retail-react-app',
        'packages/template-typescript-minimal',
        'packages/template-express-minimal', 
        'packages/template-mrt-reference-app',
        'packages/test-commerce-sdk-react'
      ],
      dependencies: [
        '@typescript-eslint/**',
        'eslint',
        'eslint-*',
        'prettier'
      ],
      policy: 'sameRange'
    }
  ]
}; 