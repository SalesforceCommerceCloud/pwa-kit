/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppConfig} from './use-app-config'

// Mock dependencies
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.mock('@chakra-ui/react', () => ({
    useSlotRecipe: jest.fn(),
    useToken: jest.fn()
}))

const mockAppConfig = {
    defaultAppLocale: 'en-US',
    defaultSiteTitle: 'Test Store',
    pages: {
        home: {
            path: '/'
        }
    }
}

const mockStyles = {
    container: {
        minHeight: '100vh'
    },
    headerWrapper: {
        position: 'sticky'
    }
}

describe('useAppConfig', () => {
    beforeEach(() => {
        const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')
        const {useSlotRecipe, useToken} = require('@chakra-ui/react')

        getConfig.mockReturnValue(mockAppConfig)
        useSlotRecipe.mockReturnValue(() => mockStyles)
        useToken.mockReturnValue(['#3182ce'])
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns app configuration and theme data', () => {
        const {result} = renderHook(() => useAppConfig())

        expect(result.current.appConfig).toEqual(mockAppConfig)
        expect(result.current.styles).toEqual(mockStyles)
        expect(result.current.themeColor).toBe('#3182ce')
    })

    test('calls getConfig to retrieve app configuration', () => {
        const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')

        renderHook(() => useAppConfig())

        expect(getConfig).toHaveBeenCalledTimes(1)
    })

    test('calls useSlotRecipe with correct parameters', () => {
        const {useSlotRecipe} = require('@chakra-ui/react')

        renderHook(() => useAppConfig())

        expect(useSlotRecipe).toHaveBeenCalledWith({key: 'app'})
    })

    test('calls useToken with correct parameters', () => {
        const {useToken} = require('@chakra-ui/react')

        renderHook(() => useAppConfig())

        expect(useToken).toHaveBeenCalledWith('colors.blue', '600')
    })
})
