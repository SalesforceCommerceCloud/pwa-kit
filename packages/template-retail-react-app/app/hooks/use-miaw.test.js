/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react'
import useMiaw, {
    normalizeLocaleToSalesforce,
    SALESFORCE_LANG_MAP
} from '@salesforce/retail-react-app/app/hooks/use-miaw'

// Mock window.embeddedservice_bootstrap
const mockEmbeddedServiceBootstrap = {
    settings: {
        language: null,
        disableStreamingResponses: false,
        enableUserInputForConversationWithBot: true
    },
    init: jest.fn()
}

// Mock window object
Object.defineProperty(window, 'embeddedservice_bootstrap', {
    value: mockEmbeddedServiceBootstrap,
    writable: true
})

describe('normalizeLocaleToSalesforce', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return en_US for null/undefined input', () => {
        expect(normalizeLocaleToSalesforce(null)).toBe('en_US')
        expect(normalizeLocaleToSalesforce(undefined)).toBe('en_US')
        expect(normalizeLocaleToSalesforce('')).toBe('en_US')
    })

    test('should return en_US for non-string input', () => {
        expect(normalizeLocaleToSalesforce(123)).toBe('en_US')
        expect(normalizeLocaleToSalesforce({})).toBe('en_US')
        expect(normalizeLocaleToSalesforce([])).toBe('en_US')
    })

    test('should handle whitespace in locale', () => {
        expect(normalizeLocaleToSalesforce('  fr-FR  ')).toBe('fr')
        expect(normalizeLocaleToSalesforce('\ten-US\n')).toBe('en_US')
    })

    test('should map known locales correctly', () => {
        expect(normalizeLocaleToSalesforce('en-US')).toBe('en_US')
        expect(normalizeLocaleToSalesforce('en-GB')).toBe('en_GB')
        expect(normalizeLocaleToSalesforce('en-CA')).toBe('en')
        expect(normalizeLocaleToSalesforce('fr-FR')).toBe('fr')
        expect(normalizeLocaleToSalesforce('es-MX')).toBe('es')
        expect(normalizeLocaleToSalesforce('pt-BR')).toBe('pt_BR')
        expect(normalizeLocaleToSalesforce('de-DE')).toBe('de')
        expect(normalizeLocaleToSalesforce('zh-CN')).toBe('zh_CN')
        expect(normalizeLocaleToSalesforce('zh-TW')).toBe('zh_TW')
    })

    test('should extract base language for unmapped locales', () => {
        expect(normalizeLocaleToSalesforce('de-AT')).toBe('de')
        expect(normalizeLocaleToSalesforce('fr-CA')).toBe('fr')
        expect(normalizeLocaleToSalesforce('es-ES')).toBe('es')
        expect(normalizeLocaleToSalesforce('it-IT')).toBe('it')
    })

    test('should handle malformed locale strings', () => {
        expect(normalizeLocaleToSalesforce('x')).toBe('en_US')
        expect(normalizeLocaleToSalesforce('a')).toBe('en_US')
        expect(normalizeLocaleToSalesforce('toolong')).toBe('en_US')
        expect(normalizeLocaleToSalesforce('-')).toBe('en_US')
        expect(normalizeLocaleToSalesforce('--')).toBe('en_US')
    })

    test('should handle edge cases', () => {
        expect(normalizeLocaleToSalesforce('en')).toBe('en')
        expect(normalizeLocaleToSalesforce('fr')).toBe('fr')
        expect(normalizeLocaleToSalesforce('zh')).toBe('zh')
    })
})

describe('SALESFORCE_LANG_MAP', () => {
    test('should contain expected language mappings', () => {
        expect(SALESFORCE_LANG_MAP).toEqual({
            'en-US': 'en_US',
            'en-GB': 'en_GB',
            'en-CA': 'en',
            'fr-FR': 'fr',
            'es-MX': 'es',
            'pt-BR': 'pt_BR',
            'de-DE': 'de',
            'it-IT': 'it',
            'ja-JP': 'ja',
            'ko-KR': 'ko',
            'nl-NL': 'nl',
            'no-NO': 'no',
            'pl-PL': 'pl',
            'sv-SE': 'sv',
            'da-DK': 'da',
            'fi-FI': 'fi',
            'zh-CN': 'zh_CN',
            'zh-TW': 'zh_TW'
        })
    })
})

describe('useMiaw hook', () => {
    const mockScriptLoadStatus = {
        loaded: true,
        error: false
    }

    const mockParams = {
        salesforceOrgId: 'test-org-id',
        embeddedServiceDeploymentName: 'test-deployment',
        embeddedServiceDeploymentUrl: 'https://test.com',
        scrt2Url: 'https://scrt2.test.com',
        locale: 'fr-FR',
        refreshToken: 'test-refresh-token'
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Reset window.embeddedservice_bootstrap
        window.embeddedservice_bootstrap = {
            ...mockEmbeddedServiceBootstrap,
            init: jest.fn()
        }
    })

    test('should initialize embedded messaging when script is loaded', () => {
        renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(mockParams)))

        expect(window.embeddedservice_bootstrap.settings.language).toBe('fr')
        expect(window.embeddedservice_bootstrap.settings.disableStreamingResponses).toBe(true)
        expect(
            window.embeddedservice_bootstrap.settings.enableUserInputForConversationWithBot
        ).toBe(false)
        expect(window.embeddedservice_bootstrap.init).toHaveBeenCalledWith(
            'test-org-id',
            'test-deployment',
            'https://test.com',
            {
                scrt2URL: 'https://scrt2.test.com'
            }
        )
    })

    test('should not initialize when script is not loaded', () => {
        const scriptNotLoaded = {loaded: false, error: false}

        renderHook(() => useMiaw(scriptNotLoaded, ...Object.values(mockParams)))

        expect(window.embeddedservice_bootstrap.init).not.toHaveBeenCalled()
    })

    test('should not initialize when script has error', () => {
        const scriptWithError = {loaded: true, error: true}

        renderHook(() => useMiaw(scriptWithError, ...Object.values(mockParams)))

        expect(window.embeddedservice_bootstrap.init).not.toHaveBeenCalled()
    })

    test('should handle different locale mappings', () => {
        const testCases = [
            {locale: 'en-US', expected: 'en_US'},
            {locale: 'en-CA', expected: 'en'},
            {locale: 'pt-BR', expected: 'pt_BR'},
            {locale: 'de-DE', expected: 'de'},
            {locale: 'zh-CN', expected: 'zh_CN'}
        ]

        testCases.forEach(({locale, expected}) => {
            jest.clearAllMocks()
            const params = {...mockParams, locale}

            renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(params)))

            expect(window.embeddedservice_bootstrap.settings.language).toBe(expected)
        })
    })

    test('should handle invalid locale gracefully', () => {
        const params = {...mockParams, locale: null}

        renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(params)))

        expect(window.embeddedservice_bootstrap.settings.language).toBe('en_US')
    })

    test('should handle missing window.embeddedservice_bootstrap gracefully', () => {
        // Temporarily remove window.embeddedservice_bootstrap
        const originalBootstrap = window.embeddedservice_bootstrap
        delete window.embeddedservice_bootstrap

        // Should not throw error
        expect(() => {
            renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(mockParams)))
        }).not.toThrow()

        // Restore original
        window.embeddedservice_bootstrap = originalBootstrap
    })

    test('should handle missing settings gracefully', () => {
        // Mock window.embeddedservice_bootstrap without settings
        window.embeddedservice_bootstrap = {
            init: jest.fn()
        }

        // Should not throw error
        expect(() => {
            renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(mockParams)))
        }).not.toThrow()
    })

    test('should re-initialize when dependencies change', () => {
        const {rerender} = renderHook(
            ({scriptLoadStatus, locale}) =>
                useMiaw(scriptLoadStatus, ...Object.values({...mockParams, locale})),
            {
                initialProps: {
                    scriptLoadStatus: mockScriptLoadStatus,
                    locale: 'fr-FR'
                }
            }
        )

        expect(window.embeddedservice_bootstrap.settings.language).toBe('fr')
        expect(window.embeddedservice_bootstrap.init).toHaveBeenCalledTimes(1)

        // Change locale
        rerender({
            scriptLoadStatus: mockScriptLoadStatus,
            locale: 'en-US'
        })

        expect(window.embeddedservice_bootstrap.settings.language).toBe('en_US')
        expect(window.embeddedservice_bootstrap.init).toHaveBeenCalledTimes(2)
    })

    test('should handle initialization errors gracefully', () => {
        // Mock init to throw error
        window.embeddedservice_bootstrap.init.mockImplementation(() => {
            throw new Error('Initialization failed')
        })

        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

        // Should not throw error
        expect(() => {
            renderHook(() => useMiaw(mockScriptLoadStatus, ...Object.values(mockParams)))
        }).not.toThrow()

        expect(consoleSpy).toHaveBeenCalledWith(
            'Error initializing Embedded Messaging: ',
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })
})
