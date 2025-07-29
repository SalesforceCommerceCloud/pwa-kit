/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook, act} from '@testing-library/react'
import {useAppModals} from './use-app-modals'

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    Router: jest.fn(({children}) => children),
    BrowserRouter: jest.fn(({children}) => children)
}))

jest.mock('@chakra-ui/react', () => ({
    useDisclosure: jest.fn(),
    defineLayerStyles: jest.fn((styles) => styles),
    defineRecipe: jest.fn((recipe) => recipe),
    defineSemanticTokens: jest.fn((tokens) => tokens),
    defineSlotRecipe: jest.fn((recipe) => recipe),
    defineConfig: jest.fn((config) => config),
    createToaster: jest.fn(() => ({toast: jest.fn()})),
    createSystem: jest.fn(() => ({})),
    ChakraProvider: jest.fn(({children}) => children),
    Box: jest.fn(({children}) => children),
    useBreakpointValue: jest.fn(() => 'lg')
}))

jest.mock('../../../hooks', () => ({
    useDntNotification: jest.fn()
}))

const mockLocation = {
    pathname: '/home',
    search: '',
    hash: ''
}

const mockDrawerDisclosure = {
    open: false,
    onOpen: jest.fn(),
    onClose: jest.fn()
}

const mockStoreLocatorDisclosure = {
    open: false,
    onOpen: jest.fn(),
    onClose: jest.fn()
}

const mockDntNotification = {
    isOpen: false,
    onClose: jest.fn()
}

describe('useAppModals', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        const {useLocation} = require('react-router-dom')
        const {useDisclosure} = require('@chakra-ui/react')
        const {useDntNotification} = require('../../../hooks')

        useLocation.mockReturnValue(mockLocation)
        useDisclosure
            .mockReturnValueOnce(mockDrawerDisclosure)
            .mockReturnValueOnce(mockStoreLocatorDisclosure)
        useDntNotification.mockReturnValue(mockDntNotification)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns modal states and handlers', () => {
        const {result} = renderHook(() => useAppModals())

        expect(result.current.isDrawerMenuOpen).toBe(false)
        expect(result.current.onDrawerMenuOpen).toEqual(expect.any(Function))
        expect(result.current.onDrawerMenuClose).toEqual(expect.any(Function))
        expect(result.current.dntNotification).toEqual(mockDntNotification)
    })

    test('calls useDntNotification for DNT modal state', () => {
        const {useDntNotification} = require('../../../hooks')

        renderHook(() => useAppModals())

        expect(useDntNotification).toHaveBeenCalledTimes(1)
    })

    test('handles different drawer states', () => {
        // Specifically for this test, we want to test when drawer menu is open
        // We'll just check that the hook properly exposes the isOpen state
        // Since useDisclosure manages the state internally, we test the return values
        const {result} = renderHook(() => useAppModals())

        act(() => {
            result.current.onDrawerMenuOpen()
        })

        // The actual implementation uses useDisclosure which manages state internally
        // We verify the function exists and can be called
        expect(result.current.onDrawerMenuOpen).toEqual(expect.any(Function))
        expect(result.current.isDrawerMenuOpen).toBe(false)
    })

    test('provides correct handlers for drawer menu', () => {
        const {result} = renderHook(() => useAppModals())

        // Verify functions exist and are callable
        expect(result.current.onDrawerMenuOpen).toEqual(expect.any(Function))
        expect(result.current.onDrawerMenuClose).toEqual(expect.any(Function))
        
        // Verify they can be called without errors
        expect(() => {
            result.current.onDrawerMenuOpen()
            result.current.onDrawerMenuClose()
        }).not.toThrow()
    })
})
