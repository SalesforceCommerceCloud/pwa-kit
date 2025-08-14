/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {applePayConfig} from '@salesforce/retail-react-app/app/api/adyen/components/applepay/config'
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'

jest.mock('@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig', () => ({
    baseConfig: jest.fn()
}))

describe('applePayConfig', () => {
    beforeEach(() => {
        // Reset mock function calls before each test
        jest.clearAllMocks()
    })

    it('should return the correct configuration object', () => {
        const mockedBaseConfigResult = {
            /* Define the mocked return value of baseConfig function here */
            // For example:
            someBaseConfigValue: 'mockedValue'
        }

        // Mock the return value of baseConfig function
        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            // Define props here if needed for the test
            // For example:
            prop1: 'value1',
            prop2: 'value2'
        }

        const expectedConfig = {
            ...mockedBaseConfigResult,
            showPayButton: true
        }

        const result = applePayConfig(props)

        expect(baseConfig).toHaveBeenCalledWith(props) // Verify if baseConfig was called with props
        expect(result).toEqual(expectedConfig) // Verify if the returned object matches the expected configuration
    })
})
