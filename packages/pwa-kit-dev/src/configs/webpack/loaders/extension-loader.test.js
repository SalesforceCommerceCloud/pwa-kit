/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import ExtensionLoader from './extension-loader'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const mockConfig = {
    app: {
        extensions: ['@salesforce/extension-this', '@salesforce/extension-that']
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
        expect(ExtensionLoader()).toEqual(`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // Extension Imports
            import ExtensionThis from '@salesforce/extension-this/setup-app'
import ExtensionThat from '@salesforce/extension-that/setup-app'

            export default [
                new ExtensionThis({}),
new ExtensionThat({})
            ]
        `)
    })
})
