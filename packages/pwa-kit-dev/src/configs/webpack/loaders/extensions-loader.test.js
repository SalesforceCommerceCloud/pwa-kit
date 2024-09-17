/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import dedent from 'dedent'
import compiler from './test/compiler'

const mockConfig = {
    app: {
        extensions: [
            '@salesforce/extension-this',
            '@salesforce/extension-that',
            '@companyx/extension-another',
            'extension-this'
        ]
    }
}

const mockPkgConfig = {
    devDependencies: {
        '@salesforce/extension-this': '1.0.0-dev',
        '@salesforce/extension-that': '1.0.0-dev',
        '@companyx/extension-another': '1.0.0-dev',
        'extension-this': '1.0.0-dev'
    }
}

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn(() => mockConfig)
    }
})

describe('Extension Loader', () => {
    beforeAll(() => {
        getConfig.mockImplementation(() => mockConfig)
    })

    test('Returns single file re-exporting all extensions configured.', async () => {
        const stats = await compiler('mock-extensions.js', {pkg: mockPkgConfig})
        const output = stats.toJson({source: true}).modules[1].source

        expect(output).toBe(dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

            // App Extensions
            import SalesforceThis from '@salesforce/extension-this/setup-app'
            import SalesforceThat from '@salesforce/extension-that/setup-app'
            import CompanyxAnother from '@companyx/extension-another/setup-app'
            import This from 'extension-this/setup-app'

            export const getExtensions = () => {
                const configuredExtensions = getConfig()?.app?.extensions || []

                return [
                    configuredExtensions.includes('@salesforce/extension-this') ? new SalesforceThis({}) : false,
                    configuredExtensions.includes('@salesforce/extension-that') ? new SalesforceThat({}) : false,
                    configuredExtensions.includes('@companyx/extension-another') ? new CompanyxAnother({}) : false,
                    configuredExtensions.includes('extension-this') ? new This({}) : false
                ].filter(Boolean)
            }
        `)
    })
})
