/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {appleDomainAssociation} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/apple-domain-association'

describe('appleDomainAssociation Controller', () => {
    let req, res, next, consoleInfoSpy

    beforeEach(() => {
        req = {}
        res = {
            send: jest.fn(),
            setHeader: jest.fn()
        }
        next = jest.fn()
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    })
    it('update order when success notification is received', async () => {
        await appleDomainAssociation(req, res, next)
        expect(res.send).toHaveBeenCalledWith('test\n')
        expect(res.setHeader).toHaveBeenCalledWith('content-type', 'text/plain')
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('AppleDomainAssociation')
    })
})
