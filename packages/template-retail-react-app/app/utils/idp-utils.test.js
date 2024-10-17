/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    createCodeVerifier,
    generateCodeChallenge,
    redirectToAuthURL
} from '@salesforce/retail-react-app/app/utils/idp-utils'

describe('IDP Utils', () => {
    describe('createCodeVerifier', () => {
        it('should return a string of length 128', () => {
            const verifier = createCodeVerifier()
            expect(typeof verifier).toBe('string')
            expect(verifier).toHaveLength(128)
        })
    })

    describe('generateCodeChallenge', () => {
        it('should return a string', async () => {
            const verifier = createCodeVerifier()
            const challenge = await generateCodeChallenge(verifier)
            expect(typeof challenge).toBe('string')
        })

        it('should throw an error if the code verifier is not provided', async () => {
            await expect(generateCodeChallenge()).rejects.toThrow()
        })
    })

    describe('redirectToAuthURL', () => {
        it('should call window.location.assign with the correct URL', () => {
            const assignMock = jest.fn()

            delete window.location
            window.location = {assign: assignMock}

            const params = {
                proxy: 'proxy',
                idp: 'idp',
                codeChallenge: 'codeChallenge',
                slasCallbackEndpoint: 'slasCallbackEndpoint',
                clientId: 'clientId',
                siteId: 'siteId',
                organizationId: 'organizationId'
            }

            redirectToAuthURL(
                params.proxy,
                params.idp,
                params.codeChallenge,
                params.slasCallbackEndpoint,
                params.clientId,
                params.siteId,
                params.organizationId
            )

            const expectedUrl = `${params.proxy}/shopper/auth/v1/organizations/${params.organizationId}/oauth2/authorize?redirect_uri=${params.slasCallbackEndpoint}&client_id=${params.clientId}&code_challenge=${params.codeChallenge}&response_type=code&channel_id=${params.siteId}&hint=${params.idp}`
            expect(assignMock).toHaveBeenCalledWith(expectedUrl)
        })
    })
})
