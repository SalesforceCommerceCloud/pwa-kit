/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createCheckoutResponse} from '@salesforce/retail-react-app/app/api/adyen/utils/createCheckoutResponse'
import {RESULT_CODES} from '@salesforce/retail-react-app/app/api/adyen/utils/constants'

describe('createCheckoutResponse', () => {
    it('should return final response for AUTHORISED or RECEIVED resultCode', () => {
        const response = {
            resultCode: RESULT_CODES.AUTHORISED,
            merchantReference: 'reference123'
        }

        const checkoutResponse = createCheckoutResponse(response)
        expect(checkoutResponse).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
    })

    it('should return non-final response for REDIRECTSHOPPER resultCode', () => {
        const response = {
            resultCode: RESULT_CODES.REDIRECTSHOPPER,
            action: 'redirectAction'
        }

        const checkoutResponse = createCheckoutResponse(response)
        expect(checkoutResponse).toEqual({
            isFinal: false,
            action: 'redirectAction'
        })
    })

    it('should return default response for an unknown resultCode', () => {
        const response = {
            resultCode: 'UNKNOWN_RESULT_CODE'
        }

        const checkoutResponse = createCheckoutResponse(response)
        expect(checkoutResponse).toEqual({
            isFinal: true,
            isSuccessful: false
        })
    })
})
