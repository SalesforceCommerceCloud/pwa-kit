/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    authenticate,
    parseNotification,
    validateHmac
} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/webhook'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

let mockValidateHMAC = jest.fn()

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn().mockImplementation(() => {
            return {
                app: {
                    sites: [
                        {
                            id: 'RefArch'
                        }
                    ],
                    commerceAPI: {
                        parameters: {
                            siteId: 'RefArch'
                        }
                    }
                }
            }
        })
    }
})
jest.mock('@adyen/api-library', () => {
    return {
        hmacValidator: jest.fn().mockImplementation(() => {
            return {
                validateHMAC: mockValidateHMAC
            }
        })
    }
})
describe('WebhookHandler', () => {
    let req, res, next, consoleInfoSpy, consoleErrorSpy

    beforeEach(() => {
        req = {
            headers: {},
            body: {
                notificationItems: [
                    {
                        NotificationRequestItem: {}
                    }
                ]
            },
            query: {
                siteId: 'RefArch'
            }
        }
        res = {
            locals: {}
        }
        process.env.ADYEN_HMAC_KEY = ''
        next = jest.fn()
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })
    describe('authenticate', () => {
        it('when valid username and password is used', () => {
            const authorization =
                'Basic ' +
                btoa(process.env.ADYEN_WEBHOOK_USER + ':' + process.env.ADYEN_WEBHOOK_PASSWORD)
            req.headers.authorization = authorization
            authenticate(req, res, next)
            expect(next).toHaveBeenCalled()
        })
        it('when no authorization is passed', () => {
            authenticate(req, res, next)
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('Access Denied!')
            expect(next).toHaveBeenCalledWith(new AdyenError('Access Denied!', 401))
        })
        it('when invalid authorization is passed', () => {
            const authorization = 'Basic ' + btoa('mockUser' + ':' + 'mockPassword')
            req.headers.authorization = authorization
            authenticate(req, res, next)
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('Access Denied!')
            expect(next).toHaveBeenCalledWith(new AdyenError('Access Denied!', 401))
        })
    })
    describe('validateHmac', () => {
        it('when no HMAC is present', () => {
            validateHmac(req, res, next)
            expect(next).toHaveBeenCalled()
        })
        it('when valid HMAC is present', () => {
            process.env.RefArch_ADYEN_HMAC_KEY = 'test'
            mockValidateHMAC.mockImplementationOnce(() => {
                return true
            })
            validateHmac(req, res, next)
            expect(mockValidateHMAC).toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })
        it('when invalid HMAC is present', () => {
            process.env.RefArch_ADYEN_HMAC_KEY = 'test'
            mockValidateHMAC.mockImplementationOnce(() => {
                return false
            })
            validateHmac(req, res, next)
            expect(mockValidateHMAC).toHaveBeenCalled()
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('Access Denied!')
            expect(next).toHaveBeenCalledWith(new AdyenError('Access Denied!', 401))
        })
    })
    describe('parseNotification', () => {
        it('when valid notification is present', () => {
            parseNotification(req, res, next)
            expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
            expect(consoleInfoSpy.mock.calls[0][0]).toContain('AdyenNotification {}')
            expect(next).toHaveBeenCalled()
        })
        it('when notificationRequestItem is not present', () => {
            req.body.notificationItems = []
            parseNotification(req, res, next)
            expect(next).toHaveBeenCalledWith(
                new AdyenError(
                    'Handling of Adyen notification has failed. No input parameters were provided.',
                    400
                )
            )
        })
        it('when notificationItems is not present', () => {
            req.body = {}
            parseNotification(req, res, next)
            expect(next).toHaveBeenCalledWith(
                new AdyenError(
                    'Handling of Adyen notification has failed. No input parameters were provided.',
                    400
                )
            )
        })
    })
})
