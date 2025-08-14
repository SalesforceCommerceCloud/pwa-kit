/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    ErrorHandler,
    registerAdyenEndpoints,
    SuccessHandler
} from '@salesforce/retail-react-app/app/api/adyen/index'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'

jest.mock('@salesforce/retail-react-app/app/api/adyen/api/controllers/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}))

describe('Adyen Endpoints', () => {
    let app
    let runtime

    beforeEach(() => {
        app = {
            get: jest.fn(),
            post: jest.fn(),
            use: jest.fn(),
            set: jest.fn()
        }
        runtime = {
            render: jest.fn()
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('registerAdyenEndpoints', () => {
        test('should register all Adyen endpoints with appropriate handlers', () => {
            const overrides = {}

            registerAdyenEndpoints(app, runtime, overrides)
            expect(app.get).toHaveBeenCalledTimes(6)
            expect(app.post).toHaveBeenCalledTimes(5)
            expect(app.use).toHaveBeenCalledTimes(2)
        })
    })

    describe('SuccessHandler', () => {
        test('should log success message and send a JSON response with 200 status', () => {
            const req = {}
            const res = {
                status: jest.fn(() => res),
                json: jest.fn(),
                locals: {
                    response: {message: 'Success response'}
                },
                toString: () => 'Response object'
            }

            SuccessHandler(req, res)

            expect(Logger.info).toHaveBeenCalledWith('Success')
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({message: 'Success response'})
        })
    })

    describe('ErrorHandler', () => {
        test('should log error message and send a JSON response with appropriate status', () => {
            const req = {}
            const res = {
                status: jest.fn(() => res),
                json: jest.fn()
            }
            const error = {
                message: 'Error message',
                cause: 'Error cause',
                statusCode: 404
            }

            ErrorHandler(error, req, res)

            expect(Logger.error).toHaveBeenCalledWith('Error message', 'Error cause')
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({errorMessage: 'Error message', error: true})
        })
    })
})
