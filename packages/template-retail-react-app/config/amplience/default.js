/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
    default: {
        hub: 'sfcccomposable'
    },
    envs: [
        {
            name: 'production',
            hub: 'sfcccomposable',
            vse: '1pqebtas9axy7zeeiy96389op.staging.bigcontent.io',
            timeMachine: 'gvzrfgnzc'
        }
        /*
         {
            name: 'Environment 1',
            hub: 'environment01',
            vse: '{{Your VSE URL for Environment 2}}'
        }
         */
    ],
    visualisations: [
        {
            name: 'Localhost',
            default: true,
            url: 'http://localhost:3000'
        },
        {
            name: 'Production',
            default: false,
            url: 'https://ascc-production.mobify-storefront.com'
        }
        /*,
        {
            name: 'UAT',
            default: false,
            url: 'https://ascc-uat.mobify-storefront.com'
        }
        */
    ]
}
