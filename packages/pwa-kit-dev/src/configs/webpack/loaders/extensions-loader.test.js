/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import ExtensionLoader from './extensions-loader'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import dedent from 'dedent'

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

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn(() => mockConfig)
    }
})

describe('Extenion Loader', () => {
    beforeAll(() => {
        getConfig.mockImplementation(() => mockConfig)
    })

    test('Returns single file re-exporting all extensions configured.', () => {
        expect(ExtensionLoader()).toBe(dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // Extension Imports
            import SalesforceThis from '@salesforce/extension-this/setup-app'
            import SalesforceThat from '@salesforce/extension-that/setup-app'
            import CompanyxAnother from '@companyx/extension-another/setup-app'
            import This from 'extension-this/setup-app'

            export default [
                new SalesforceThis({}),
                new SalesforceThat({}),
                new CompanyxAnother({}),
                new This({})
            ]
        `)
    })
})
