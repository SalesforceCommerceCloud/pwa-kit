/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PaymentsDetailsController} from '@salesforce/retail-react-app/app/api/adyen/api'
import {RESULT_CODES} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'
import Logger from '../logger'

let mockPaymentsDetails = jest.fn()

jest.mock('../checkout-config', () => {
    return {
        getInstance: jest.fn().mockImplementation(() => {
            return {
                paymentsDetails: mockPaymentsDetails
            }
        })
    }
})

jest.mock('../logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}))

describe('payments details controller', () => {
    let req, res, next

    afterEach(() => {
        mockPaymentsDetails.mockReset()
        jest.clearAllMocks()
    })

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'mockToken',
                customerid: 'testCustomer'
            },
            body: {
                data: {}
            },
            query: {
                siteId: 'RefArch'
            }
        }
        res = {
            locals: {}
        }
        next = jest.fn()
    })

    it('returns checkout response if payments details response is successful', async () => {
        mockPaymentsDetails.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        await PaymentsDetailsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(Logger.info).toHaveBeenCalledTimes(2)
        expect(Logger.info).toHaveBeenNthCalledWith(1, 'sendPaymentDetails', 'start')
        expect(Logger.info).toHaveBeenNthCalledWith(
            2,
            'sendPaymentDetails',
            'resultCode Authorised'
        )
        expect(next).toHaveBeenCalled()
    })

    it('returns error response if payments details response is unsuccessful', async () => {
        mockPaymentsDetails.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.ERROR,
                merchantReference: 'reference123'
            }
        })

        await PaymentsDetailsController(req, res, next)
        expect(res.locals.response).toBeUndefined()
        expect(Logger.info).toHaveBeenCalledTimes(2)
        expect(Logger.info).toHaveBeenNthCalledWith(1, 'sendPaymentDetails', 'start')
        expect(Logger.info).toHaveBeenNthCalledWith(2, 'sendPaymentDetails', 'resultCode Error')
        expect(Logger.error).toHaveBeenCalledWith(
            'sendPaymentDetails',
            'payments details call not successful'
        )
        expect(next).toHaveBeenCalledWith(
            new AdyenError('payments details call not successful', 400)
        )
    })
})
