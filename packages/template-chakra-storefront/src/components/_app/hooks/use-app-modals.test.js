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

jest.mock('../../../hooks/use-dnt-notification', () => ({
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
        const {useDntNotification} = require('../../../hooks/use-dnt-notification')

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
        expect(result.current.isOpenStoreLocator).toBe(false)
        expect(result.current.onOpenStoreLocator).toEqual(expect.any(Function))
        expect(result.current.onCloseStoreLocator).toEqual(expect.any(Function))
        expect(result.current.dntNotification).toEqual(mockDntNotification)
    })

    test('calls useDisclosure twice for drawer and store locator modals', () => {
        const {useDisclosure} = require('@chakra-ui/react')

        renderHook(() => useAppModals())

        expect(useDisclosure).toHaveBeenCalledTimes(2)
    })

    test('calls useDntNotification for DNT modal state', () => {
        const {useDntNotification} = require('../../../hooks/use-dnt-notification')

        renderHook(() => useAppModals())

        expect(useDntNotification).toHaveBeenCalledTimes(1)
    })

    test('closes drawer menu when location changes', () => {
        const {useLocation} = require('react-router-dom')
        const {useDisclosure} = require('@chakra-ui/react')

        const mockOnClose = jest.fn()
        useDisclosure
            .mockReturnValueOnce({
                ...mockDrawerDisclosure,
                onClose: mockOnClose
            })
            .mockReturnValueOnce(mockStoreLocatorDisclosure)

        const {rerender} = renderHook(() => useAppModals())

        // Change location
        useLocation.mockReturnValue({
            pathname: '/new-path',
            search: '?q=test'
        })

        rerender()

        expect(mockOnClose).toHaveBeenCalled()
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

    test('handles different store locator states', () => {
        const {result} = renderHook(() => useAppModals())

        act(() => {
            result.current.onOpenStoreLocator()
        })

        expect(result.current.onOpenStoreLocator).toEqual(expect.any(Function))
        expect(result.current.isOpenStoreLocator).toBe(false)
    })

    test('provides correct handlers for drawer menu', () => {
        const {useDisclosure} = require('@chakra-ui/react')

        // Setup fresh mocks for this test - override the beforeEach setup
        useDisclosure
            .mockReturnValueOnce(mockDrawerDisclosure)
            .mockReturnValueOnce(mockStoreLocatorDisclosure)

        const {result} = renderHook(() => useAppModals())

        expect(result.current.onDrawerMenuOpen).toBe(mockDrawerDisclosure.onOpen)
        expect(result.current.onDrawerMenuClose).toBe(mockDrawerDisclosure.onClose)
    })

    test('provides correct handlers for store locator', () => {
        const {result} = renderHook(() => useAppModals())

        expect(result.current.onOpenStoreLocator).toEqual(expect.any(Function))
        expect(result.current.onCloseStoreLocator).toEqual(expect.any(Function))

        act(() => {
            result.current.onOpenStoreLocator()
            result.current.onCloseStoreLocator()
        })
    })
})
