/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {sharePreviewMiddleware} from '@salesforce/retail-react-app/app/middlewares/share-preview'
import {ShopperExperience} from 'commerce-sdk-isomorphic'
import logger from '@salesforce/pwa-kit-runtime/utils/logger-instance'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            commerceAPI: {
                proxyPath: '/mobify/proxy/api',
                parameters: {
                    organizationId: 'f_ecom_test_001',
                    siteId: 'RefArch'
                }
            }
        }
    }))
}))

jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => ({
    getAppOrigin: jest.fn(() => 'https://test-app.com')
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/logger-instance', () => ({
    __esModule: true,
    default: {warn: jest.fn(), error: jest.fn(), info: jest.fn(), log: jest.fn()}
}))

const mockApplyPreviewContext = jest.fn()
jest.mock('commerce-sdk-isomorphic', () => ({
    ShopperExperience: jest.fn().mockImplementation(() => ({
        applyPreviewContext: mockApplyPreviewContext
    }))
}))

// Payload: {"exp":1761942400}
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NjE5NDI0MDB9.MOCK'
const JWT_EXP = 1761942400
const SHOPPER_TOKEN = 'shopper-access-token'

const createReq = ({query, cookie, originalUrl} = {}) => ({
    query: query === undefined ? {previewContext: MOCK_JWT} : query,
    headers: cookie === undefined ? {cookie: `cc-at_RefArch=${SHOPPER_TOKEN}`} : {cookie},
    originalUrl: originalUrl || `/some/path?previewContext=${MOCK_JWT}`
})

const createRes = () => ({
    append: jest.fn(),
    redirect: jest.fn()
})

describe('sharePreviewMiddleware', () => {
    const originalDeployTarget = process.env.DEPLOY_TARGET
    let next
    let res

    beforeEach(() => {
        delete process.env.DEPLOY_TARGET
        next = jest.fn()
        res = createRes()
        mockApplyPreviewContext.mockResolvedValue({status: 204})
    })

    afterEach(() => {
        jest.clearAllMocks()
        if (originalDeployTarget === undefined) {
            delete process.env.DEPLOY_TARGET
        } else {
            process.env.DEPLOY_TARGET = originalDeployTarget
        }
    })

    describe('guards', () => {
        test('calls next() without fetching in production', async () => {
            process.env.DEPLOY_TARGET = 'production'
            await sharePreviewMiddleware(createReq(), res, next)
            expect(next).toHaveBeenCalledTimes(1)
            expect(mockApplyPreviewContext).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('calls next() without fetching when previewContext is absent', async () => {
            await sharePreviewMiddleware(createReq({query: {}}), res, next)
            expect(next).toHaveBeenCalledTimes(1)
            expect(mockApplyPreviewContext).not.toHaveBeenCalled()
        })

        test('calls next() without fetching when cc-sp_RefArch cookie exists', async () => {
            const req = createReq({
                cookie: `cc-at_RefArch=${SHOPPER_TOKEN}; cc-sp_RefArch=1`
            })
            await sharePreviewMiddleware(req, res, next)
            expect(next).toHaveBeenCalledTimes(1)
            expect(mockApplyPreviewContext).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('warns and calls next() when no shopper token cookie is present', async () => {
            await sharePreviewMiddleware(createReq({cookie: 'other=1'}), res, next)
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('no shopper token'))
            expect(next).toHaveBeenCalledTimes(1)
            expect(mockApplyPreviewContext).not.toHaveBeenCalled()
        })
    })

    describe('SCAPI call failures', () => {
        test.each([400, 500])('warns and calls next() when SCAPI returns %i', async (status) => {
            mockApplyPreviewContext.mockRejectedValue(new Error(`${status} Bad Response`))
            await sharePreviewMiddleware(createReq(), res, next)
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('apply preview context failed'),
                {message: `${status} Bad Response`}
            )
            expect(next).toHaveBeenCalledTimes(1)
            expect(res.append).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('warns and calls next() when the client throws', async () => {
            mockApplyPreviewContext.mockRejectedValue(new Error('network down'))
            await sharePreviewMiddleware(createReq(), res, next)
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('apply preview context failed'),
                {message: 'network down'}
            )
            expect(next).toHaveBeenCalledTimes(1)
            expect(res.redirect).not.toHaveBeenCalled()
        })
    })

    describe('success path', () => {
        test('calls SCAPI, sets cookie and redirects to the clean URL', async () => {
            await sharePreviewMiddleware(createReq(), res, next)

            expect(ShopperExperience).toHaveBeenCalledWith(
                expect.objectContaining({
                    parameters: expect.objectContaining({
                        organizationId: 'f_ecom_test_001',
                        siteId: 'RefArch'
                    }),
                    headers: {authorization: `Bearer ${SHOPPER_TOKEN}`},
                    throwOnBadResponse: true
                })
            )
            expect(mockApplyPreviewContext).toHaveBeenCalledWith({
                body: {token: MOCK_JWT}
            })
            expect(res.append).toHaveBeenCalledWith('set-cookie', expect.any(String))
            const cookie = res.append.mock.calls[0][1]
            expect(cookie).toContain('cc-sp_RefArch=1')
            expect(cookie).toContain('Path=/')
            expect(cookie).toContain('Secure')
            expect(res.redirect).toHaveBeenCalledWith(302, '/some/path')
            expect(next).not.toHaveBeenCalled()
        })

        test('sets cookie expiry to the JWT exp claim', async () => {
            await sharePreviewMiddleware(createReq(), res, next)
            const cookie = res.append.mock.calls[0][1]
            expect(cookie).toContain(`Expires=${new Date(JWT_EXP * 1000).toUTCString()}`)
        })

        test('preserves other query params in the redirect', async () => {
            const req = createReq({
                originalUrl: `/search?q=shirt&previewContext=${MOCK_JWT}&page=2`
            })
            await sharePreviewMiddleware(req, res, next)
            expect(res.redirect).toHaveBeenCalledWith(302, '/search?q=shirt&page=2')
        })

        test('does not produce a protocol-relative redirect for double-slash paths', async () => {
            const req = createReq({
                originalUrl: `//attacker.example/?previewContext=${MOCK_JWT}`
            })
            await sharePreviewMiddleware(req, res, next)
            const [, location] = res.redirect.mock.calls[0]
            expect(location).not.toMatch(/^\/\//)
        })
    })
})
