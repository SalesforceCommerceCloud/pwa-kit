/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
    // The different Lighthouse CI configuration options:
    // https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/configuration.md
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            //TODO: Add key pages URLs here as they are implemented.
            url: [
                'http://localhost:3000/',
                'http://localhost:3000/en-GB/category/womens',
                'http://localhost:3000/en-GB/product/25493613M',
                'http://localhost:3000/en-GB/search?q=suit'
            ],
            startServerReadyPattern: 'HTTP development server listening on',
            startServerReadyTimeout: 15000
        },
        upload: {
            target: 'temporary-public-storage'
        },
        assert: {
            aggregationMethod: 'median',
            assertions: {
                //TODO: Adjust scores and the assertions level from 'warn' to 'error' to fail the build if the scores are not met.
                'categories:performance': ['error', {minScore: 0.5}],
                'categories:pwa': ['error', {minScore: 0.9}],
                'categories:seo': ['error', {minScore: 0.85}],
                'categories:accessibility': ['error', {minScore: 0.88}]
            }
        }
    }
}
