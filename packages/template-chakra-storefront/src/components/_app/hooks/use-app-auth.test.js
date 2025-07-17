/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppAuth} from './use-app-auth'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: jest.fn()
}))

jest.mock('../../../hooks/use-auth-modal', () => ({
    useAuthModal: jest.fn()
}))

const mockGetTokenWhenReady = jest.fn()
const mockAuthModal = {
    isOpen: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    initialView: 'login'
}

describe('useAppAuth', () => {
    beforeEach(() => {
        const {useAccessToken} = require('@salesforce/commerce-sdk-react')
        const {useAuthModal} = require('../../../hooks/use-auth-modal')

        useAccessToken.mockReturnValue({
            getTokenWhenReady: mockGetTokenWhenReady
        })
        useAuthModal.mockReturnValue(mockAuthModal)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns access token function and auth modal state', () => {
        const {result} = renderHook(() => useAppAuth())

        expect(result.current.getTokenWhenReady).toBe(mockGetTokenWhenReady)
        expect(result.current.authModal).toEqual(mockAuthModal)
    })

    test('calls useAccessToken hook', () => {
        const {useAccessToken} = require('@salesforce/commerce-sdk-react')

        renderHook(() => useAppAuth())

        expect(useAccessToken).toHaveBeenCalledTimes(1)
    })

    test('calls useAuthModal hook', () => {
        const {useAuthModal} = require('../../../hooks/use-auth-modal')

        renderHook(() => useAppAuth())

        expect(useAuthModal).toHaveBeenCalledTimes(1)
    })

    test('returns correct structure when auth modal is open', () => {
        const {useAuthModal} = require('../../../hooks/use-auth-modal')
        const openAuthModal = {
            ...mockAuthModal,
            isOpen: true,
            initialView: 'register'
        }

        useAuthModal.mockReturnValue(openAuthModal)

        const {result} = renderHook(() => useAppAuth())

        expect(result.current.authModal.isOpen).toBe(true)
        expect(result.current.authModal.initialView).toBe('register')
    })
})
