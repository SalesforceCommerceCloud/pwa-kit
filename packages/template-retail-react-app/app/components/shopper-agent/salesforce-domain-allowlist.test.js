/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isTrustedSalesforceDomain,
    isTrustedSCRTDomain
} from '@salesforce/retail-react-app/app/components/shopper-agent/salesforce-domain-allowlist'

const TRUSTED_SCRT2_URL = 'https://orgfarm-123.test1.my.pc-rnd.salesforce-scrt.com'

describe('salesforce-domain-allowlist', () => {
    // ------------------------------------------------------------------------
    // isTrustedSalesforceDomain gates the CSRF Origin check (Storefront Preview
    // iframe, served from Core's My Domain) and the Token Bridge upstream SSRF
    // check — Core `*.salesforce.com` only.
    describe('isTrustedSalesforceDomain', () => {
        it('accepts .salesforce.com domains', () => {
            expect(isTrustedSalesforceDomain('https://org.salesforce.com')).toBe(true)
        })

        it('accepts .my.salesforce.com domains', () => {
            expect(isTrustedSalesforceDomain('https://org.my.salesforce.com')).toBe(true)
        })

        it('accepts .pc-rnd.salesforce.com domains', () => {
            expect(
                isTrustedSalesforceDomain('https://orgfarm-123.test1.my.pc-rnd.salesforce.com')
            ).toBe(true)
        })

        it('rejects .salesforce-scrt.com domains (SCRT2, not a Core origin)', () => {
            expect(isTrustedSalesforceDomain('https://org.salesforce-scrt.com')).toBe(false)
        })

        it('rejects non-Salesforce domains', () => {
            expect(isTrustedSalesforceDomain('https://evil.com')).toBe(false)
        })

        it('rejects domains that only contain salesforce in a subdomain', () => {
            expect(isTrustedSalesforceDomain('https://salesforce.evil.com')).toBe(false)
        })

        it('rejects invalid URLs', () => {
            expect(isTrustedSalesforceDomain('not-a-url')).toBe(false)
        })

        it('is case-insensitive', () => {
            expect(isTrustedSalesforceDomain('https://ORG.SALESFORCE.COM')).toBe(true)
        })
    })

    // ------------------------------------------------------------------------
    // isTrustedSCRTDomain gates the SSRF check on the Auth Link proxy upstream
    // (scrt2Url) — SCRT2 `*.salesforce-scrt.com` only.
    describe('isTrustedSCRTDomain', () => {
        it('accepts .salesforce-scrt.com domains', () => {
            expect(isTrustedSCRTDomain('https://org.salesforce-scrt.com')).toBe(true)
        })

        it('accepts .my.salesforce-scrt.com domains', () => {
            expect(isTrustedSCRTDomain('https://orgfarm-123.test1.my.salesforce-scrt.com')).toBe(
                true
            )
        })

        it('accepts .pc-rnd.salesforce-scrt.com domains', () => {
            expect(isTrustedSCRTDomain(TRUSTED_SCRT2_URL)).toBe(true)
        })

        it('rejects .salesforce.com domains (Core My Domain, not SCRT2)', () => {
            expect(isTrustedSCRTDomain('https://org.my.salesforce.com')).toBe(false)
        })

        it('rejects non-Salesforce domains', () => {
            expect(isTrustedSCRTDomain('https://evil.com')).toBe(false)
        })

        it('rejects domains that only contain salesforce-scrt in a subdomain', () => {
            expect(isTrustedSCRTDomain('https://salesforce-scrt.evil.com')).toBe(false)
        })

        it('rejects invalid URLs', () => {
            expect(isTrustedSCRTDomain('not-a-url')).toBe(false)
        })

        it('is case-insensitive', () => {
            expect(isTrustedSCRTDomain('https://ORG.SALESFORCE-SCRT.COM')).toBe(true)
        })
    })
})
