/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import getEnvironment from '@salesforce/retail-react-app/app/api/adyen/api/controllers/environment'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'

jest.mock(
    '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js',
    () => ({
        getAdyenConfigForCurrentSite: jest.fn()
    })
)

describe('getEnvironment middleware', () => {
    let req, res, next

    beforeEach(() => {
        req = {
            query: {
                siteId: 'RefArch'
            }
        }
        res = {
            locals: {}
        }
        next = jest.fn()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should set response locals with correct Adyen config', async () => {
        const mockAdyenConfig = {
            clientKey: 'mockClientKey',
            environment: 'mockEnvironment'
        }

        getAdyenConfigForCurrentSite.mockReturnValueOnce(mockAdyenConfig)
        await getEnvironment(req, res, next)

        expect(getAdyenConfigForCurrentSite).toHaveBeenCalled()
        expect(res.locals.response).toEqual({
            ADYEN_CLIENT_KEY: 'mockClientKey',
            ADYEN_ENVIRONMENT: 'mockEnvironment'
        })
        expect(next).toHaveBeenCalled()
    })
})
