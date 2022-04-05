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
            //NOTE: Adjust the key pages URLs that you find important to your website.
            url: [
                'http://localhost:3000/',
                'http://localhost:3000/global/en-GB/category/womens',
                'http://localhost:3000/global/en-GB/product/25493613M',
                'http://localhost:3000/global/en-GB/search?q=suit'
            ],
            startServerReadyPattern: 'First build complete',
            startServerReadyTimeout: 90000
        },
        upload: {
            target: 'temporary-public-storage'
        },
        assert: {
            aggregationMethod: 'median',
            assertions: {
                // NOTE: Adjust the scores accordingly as the performance is improved
                'categories:performance': ['error', {minScore: 0.3}],
                'categories:pwa': ['error', {minScore: 0.9}],
                'categories:seo': ['error', {minScore: 0.85}],
                'categories:accessibility': ['error', {minScore: 0.88}]
            }
        }
    }
}
