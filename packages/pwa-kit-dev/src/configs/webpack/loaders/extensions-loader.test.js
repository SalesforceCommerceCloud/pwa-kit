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
            ['@salesforce/extension-this', {path: '/foo'}],
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

            const installedExtensions = [
                {packageName: '@salesforce/extension-this', instanceVariable: SalesforceThis},
                {packageName: '@salesforce/extension-that', instanceVariable: SalesforceThat},
                {packageName: '@companyx/extension-another', instanceVariable: CompanyxAnother},
                {packageName: 'extension-this', instanceVariable: This}
            ]

            const normalizeExtensionsList = (extensions = []) =>
                extensions.map((extension) => {
                    return {
                        packageName: Array.isArray(extension) ? extension[0] : extension,
                        config: Array.isArray(extension) ? {enabled: true, ...extension[1]} : {enabled: true}
                    }
                })

            export const getExtensions = () => {
                const configuredExtensions = (normalizeExtensionsList(getConfig()?.app?.extensions) || [])
                    .filter((extension) => extension.config.enabled)
                    .map((extension) => {
                        // Make sure that the configured extensions are installed, before instantiating them
                        const found = installedExtensions.find((ext) => ext.packageName === extension.packageName)
                        return found ? new found.instanceVariable(extension.config || {}) : false
                    })
                    .filter(Boolean)

                return configuredExtensions
            }
        `)
    })
})
