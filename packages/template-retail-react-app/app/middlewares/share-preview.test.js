/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {sharePreviewMiddleware} from '@salesforce/retail-react-app/app/middlewares/share-preview'
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

// Payload: {"exp":1761942400}
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NjE5NDI0MDB9.MOCK'
const JWT_EXP = 1761942400
const SHOPPER_TOKEN = 'shopper-access-token'

const createReq = ({query, cookie, originalUrl} = {}) => ({
    query: query === undefined ? {__previewContext: MOCK_JWT} : query,
    headers: cookie === undefined ? {cookie: `cc-at_RefArch=${SHOPPER_TOKEN}`} : {cookie},
    originalUrl: originalUrl || `/some/path?__previewContext=${MOCK_JWT}`
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
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 204})
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
            expect(global.fetch).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('calls next() without fetching when __previewContext is absent', async () => {
            await sharePreviewMiddleware(createReq({query: {}}), res, next)
            expect(next).toHaveBeenCalledTimes(1)
            expect(global.fetch).not.toHaveBeenCalled()
        })

        test('calls next() without fetching when share_preview_ctx cookie exists', async () => {
            const req = createReq({
                cookie: `cc-at_RefArch=${SHOPPER_TOKEN}; share_preview_ctx=1`
            })
            await sharePreviewMiddleware(req, res, next)
            expect(next).toHaveBeenCalledTimes(1)
            expect(global.fetch).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('warns and calls next() when no shopper token cookie is present', async () => {
            await sharePreviewMiddleware(createReq({cookie: 'other=1'}), res, next)
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('no shopper token'))
            expect(next).toHaveBeenCalledTimes(1)
            expect(global.fetch).not.toHaveBeenCalled()
        })
    })

    describe('SCAPI call failures', () => {
        test.each([400, 500])('warns and calls next() when SCAPI returns %i', async (status) => {
            global.fetch.mockResolvedValue({ok: false, status})
            await sharePreviewMiddleware(createReq(), res, next)
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('apply preview context failed'),
                {status}
            )
            expect(next).toHaveBeenCalledTimes(1)
            expect(res.append).not.toHaveBeenCalled()
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('warns and calls next() when fetch throws', async () => {
            global.fetch.mockRejectedValue(new Error('network down'))
            await sharePreviewMiddleware(createReq(), res, next)
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('apply preview context error'),
                {message: 'network down'}
            )
            expect(next).toHaveBeenCalledTimes(1)
            expect(res.redirect).not.toHaveBeenCalled()
        })
    })

    describe('success path', () => {
        test('calls SCAPI, sets cookie and redirects to the clean URL', async () => {
            await sharePreviewMiddleware(createReq(), res, next)

            expect(global.fetch).toHaveBeenCalledWith(
                `https://test-app.com/mobify/proxy/api/shopper/shopper-experience/v1/organizations/${encodeURIComponent(
                    'f_ecom_test_001'
                )}/preview-context/apply?siteId=${encodeURIComponent('RefArch')}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${SHOPPER_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({token: MOCK_JWT}),
                    signal: expect.anything()
                }
            )
            expect(res.append).toHaveBeenCalledWith('set-cookie', expect.any(String))
            const cookie = res.append.mock.calls[0][1]
            expect(cookie).toContain('share_preview_ctx=1')
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
                originalUrl: `/search?q=shirt&__previewContext=${MOCK_JWT}&page=2`
            })
            await sharePreviewMiddleware(req, res, next)
            expect(res.redirect).toHaveBeenCalledWith(302, '/search?q=shirt&page=2')
        })
    })
})
