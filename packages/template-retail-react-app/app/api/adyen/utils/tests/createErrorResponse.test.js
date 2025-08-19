/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createErrorResponse} from '@salesforce/retail-react-app/app/api/adyen/utils/createErrorResponse'

describe('createErrorResponse', () => {
    it('should create an error response with default message', () => {
        const errorResponse = createErrorResponse()
        expect(errorResponse).toEqual({
            error: true,
            errorMessage: 'Technical error!'
        })
    })

    it('should create an error response with custom message', () => {
        const customErrorMessage = 'Custom error message'
        const errorResponse = createErrorResponse(customErrorMessage)
        expect(errorResponse).toEqual({
            error: true,
            errorMessage: customErrorMessage
        })
    })
})
