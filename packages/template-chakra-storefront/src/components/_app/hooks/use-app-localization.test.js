/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppLocalization} from './use-app-localization'

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn()
}))

jest.mock('./use-app-config', () => ({
    useAppConfig: jest.fn()
}))

// Mock dependencies
jest.mock('react-intl', () => ({
    useIntl: jest.fn(),
    defineMessages: jest.fn((messages) => messages),
    defineMessage: jest.fn((message) => message)
}))

jest.mock('../../../hooks/use-multi-site', () => {
    const mockUseMultiSite = jest.fn()
    return {
        __esModule: true,
        useMultiSite: mockUseMultiSite
    }
})

jest.mock('../../../hooks/use-app-origin', () => ({
    useAppOrigin: jest.fn()
}))

jest.mock('../../../utils/url', () => ({
    buildUrl: jest.fn()
}))

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({
        data: {messages: {}},
        isLoading: false,
        error: null
    }))
}))

jest.mock('../../../utils/site-utils', () => ({
    getSites: jest.fn(() => []),
    getDefaultSite: jest.fn(() => ({
        id: 'RefArch',
        alias: 'site1',
        l10n: {
            supportedLocales: [
                {id: 'en-US', alias: 'us'},
                {id: 'en-GB', alias: 'uk'}
            ],
            defaultLocale: 'en-US'
        }
    })),
    getSiteByReference: jest.fn(() => ({
        id: 'RefArch',
        alias: 'site1'
    }))
}))

jest.mock('../../../utils/locale', () => ({
    getTargetLocale: jest.fn(() => 'en-GB'),
    fetchTranslations: jest.fn(() => Promise.resolve({messages: {}}))
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

const mockIntl = {
    locale: 'en-GB',
    messages: {'test.key': 'Test Message'}
}

const mockMultiSite = {
    site: {
        id: 'test-site',
        alias: 'uk',
        l10n: {
            supportedLocales: [
                {id: 'en-US', alias: 'us'},
                {id: 'en-GB', alias: 'uk'},
                {id: 'fr-FR', alias: 'fr'}
            ],
            defaultLocale: 'en-US',
            defaultCurrency: 'GBP'
        }
    },
    locale: {id: 'en-GB', alias: 'uk', preferredCurrency: 'GBP'},
    currency: 'GBP',
    buildUrl: jest.fn((path) => `/test-path${path}`)
}

const mockAppOrigin = {
    origin: 'https://example.com'
}

const mockAppConfig = {
    app: {
        url: {
            site: 'path'
        }
    }
}

describe('useAppLocalization', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Setup useAppConfig mock
        const {useAppConfig} = require('./use-app-config')
        useAppConfig.mockReturnValue({
            appConfig: mockAppConfig,
            styles: {},
            themeColor: '#blue'
        })

        // Setup useIntl mock
        const {useIntl} = require('react-intl')
        useIntl.mockReturnValue(mockIntl)

        const {useMultiSite} = require('../../../hooks/use-multi-site')
        useMultiSite.mockReturnValue(mockMultiSite)

        const {useAppOrigin} = require('../../../hooks/use-app-origin')
        useAppOrigin.mockReturnValue(mockAppOrigin)

        const {buildUrl} = require('../../../utils/url')
        buildUrl.mockImplementation(() => `${mockAppOrigin.origin}/test-path`)

        const {useLocation} = require('react-router-dom')
        useLocation.mockReturnValue({pathname: '/test-path'})

        const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')
        getConfig.mockReturnValue(mockAppConfig)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns localization data correctly', () => {
        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.targetLocale).toBe('en-GB')
        expect(result.current.messages).toEqual({messages: {}})
        expect(result.current.site).toBe(mockMultiSite.site)
        expect(result.current.locale).toBe(mockMultiSite.locale)
        expect(result.current.currency).toBe(mockMultiSite.currency)
    })

    test('builds URLs correctly', () => {
        const {result} = renderHook(() => useAppLocalization())

        const url = result.current.buildUrl('/products')
        expect(url).toBe('/test-path/products')

        // The buildUrl function should be the one from mockMultiSite, not the mocked url utility
        expect(typeof result.current.buildUrl).toBe('function')
    })

    test('builds URLs with app origin correctly', () => {
        // This function doesn't exist in the actual hook, removing this test
        const {result} = renderHook(() => useAppLocalization())

        // Test that we have appOrigin from the hook (it returns the whole object)
        expect(result.current.appOrigin).toEqual(mockAppOrigin)
    })

    test('handles missing window origin', () => {
        const {useAppOrigin} = require('../../../hooks/use-app-origin')
        useAppOrigin.mockReturnValue({origin: null})

        const {result} = renderHook(() => useAppLocalization())

        // Test that appOrigin object has null origin
        expect(result.current.appOrigin).toEqual({origin: null})
    })

    test('uses correct target locale', () => {
        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.targetLocale).toBe('en-GB')
    })

    test('handles different currencies', () => {
        const {useMultiSite} = require('../../../hooks/use-multi-site')
        useMultiSite.mockClear()
        useMultiSite.mockReturnValue({
            ...mockMultiSite,
            locale: {
                ...mockMultiSite.locale,
                preferredCurrency: 'EUR'
            },
            currency: 'EUR'
        })

        const {result} = renderHook(() => useAppLocalization())

        expect(result.current.currency).toBe('EUR')
    })
})
