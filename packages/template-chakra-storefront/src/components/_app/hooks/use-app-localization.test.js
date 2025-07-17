/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppLocalization} from './use-app-localization'

// Mock dependencies
jest.mock('../../../utils/locale', () => ({
    getTargetLocale: jest.fn(() => 'en-US')
}))

jest.mock('../../../utils/utils', () => ({
    buildUrlWithAppOrigin: jest.fn((origin, href, site, locale) => `${origin}/${locale}${href}`)
}))

jest.mock('../../../hooks/use-site', () => ({
    useSite: jest.fn(() => ({
        id: 'RefArch',
        alias: 'test-site'
    }))
}))

jest.mock('../../../hooks/use-locale', () => ({
    useLocale: jest.fn(() => ({
        id: 'en-US',
        alias: 'en_US'
    }))
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperCustomersQuery: jest.fn(() => ({
        locale: 'en-US',
        currency: 'USD'
    }))
}))

// Mock window location
Object.defineProperty(window, 'location', {
    value: {
        origin: 'https://example.com'
    },
    writable: true
})

describe('useAppLocalization', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns localization data correctly', () => {
        const {result} = renderHook(() => useAppLocalization())

        expect(result.current).toMatchObject({
            targetLocale: 'en-US',
            messages: expect.any(Object),
            site: expect.objectContaining({
                id: 'RefArch'
            }),
            locale: expect.objectContaining({
                id: 'en-US'
            }),
            buildUrl: expect.any(Function),
            currency: 'USD',
            appOrigin: 'https://example.com'
        })
    })

    it('builds URLs correctly', () => {
        const {buildUrlWithAppOrigin} = require('../../../utils/utils')
        const {result} = renderHook(() => useAppLocalization())

        const testHref = '/test-page'
        result.current.buildUrl(testHref)

        expect(buildUrlWithAppOrigin).toHaveBeenCalledWith(
            'https://example.com',
            testHref,
            expect.any(Object),
            expect.any(Object)
        )
    })

    it('handles missing window origin', () => {
        // Temporarily remove window.location.origin
        const originalOrigin = window.location.origin
        delete window.location.origin

        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.appOrigin).toBeDefined()

        // Restore original value
        window.location.origin = originalOrigin
    })

    it('uses correct target locale', () => {
        const {getTargetLocale} = require('../../../utils/locale')
        getTargetLocale.mockReturnValue('fr-FR')

        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.targetLocale).toBe('fr-FR')
    })

    it('handles different currencies', () => {
        const {
            useShopperCustomersQuery
        } = require('@salesforce/commerce-sdk-react')
        useShopperCustomersQuery.mockReturnValue({
            locale: 'en-US',
            currency: 'EUR'
        })

        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.currency).toBe('EUR')
    })
})
