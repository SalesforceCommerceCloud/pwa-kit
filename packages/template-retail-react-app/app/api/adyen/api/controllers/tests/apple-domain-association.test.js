/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {appleDomainAssociation} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/apple-domain-association'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'

// Mock the getAdyenConfigForCurrentSite function
jest.mock(
    '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js',
    () => ({
        getAdyenConfigForCurrentSite: jest.fn()
    })
)

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

        // Mock the getAdyenConfigForCurrentSite to return a test config
        getAdyenConfigForCurrentSite.mockReturnValue({
            appleDomainAssociation: 'test'
        })
    })

    afterEach(() => {
        consoleInfoSpy.mockRestore()
    })

    it('should send apple domain association response', async () => {
        await appleDomainAssociation(req, res, next)
        expect(res.send).toHaveBeenCalledWith('test\n')
        expect(res.setHeader).toHaveBeenCalledWith('content-type', 'text/plain')
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('AppleDomainAssociation')
    })
})
