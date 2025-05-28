/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import useToast from './use-toast'
import {toaster} from '../components/toaster'

// Mock the toaster dependency
jest.mock('../components/toaster', () => ({
    toaster: {
        create: jest.fn()
    }
}))

describe('useToast', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks()
    })

    it('should return a function', () => {
        const {result} = renderHook(() => useToast())

        expect(typeof result.current).toBe('function')
    })

    it('should call toaster.create with provided options', () => {
        const {result} = renderHook(() => useToast())
        const toast = result.current

        const options = {
            title: 'Test Title',
            description: 'Test Description',
            type: 'success'
        }

        toast(options)

        expect(toaster.create).toHaveBeenCalledWith(options)
        expect(toaster.create).toHaveBeenCalledTimes(1)
    })

    it('should return the result from toaster.create', () => {
        const mockResult = {id: 'toast-123', dismiss: jest.fn()}
        toaster.create.mockReturnValue(mockResult)

        const {result} = renderHook(() => useToast())
        const toast = result.current

        const returnValue = toast({title: 'Test'})

        expect(returnValue).toBe(mockResult)
    })

    it('should handle multiple calls correctly', () => {
        const {result} = renderHook(() => useToast())
        const toast = result.current

        const options1 = {title: 'First Toast', type: 'success'}
        const options2 = {title: 'Second Toast', type: 'error'}

        toast(options1)
        toast(options2)

        expect(toaster.create).toHaveBeenCalledTimes(2)
        expect(toaster.create).toHaveBeenNthCalledWith(1, options1)
        expect(toaster.create).toHaveBeenNthCalledWith(2, options2)
    })

    it('should handle options with action property', () => {
        const {result} = renderHook(() => useToast())
        const toast = result.current

        const mockAction = {
            label: 'Click me',
            onClick: jest.fn()
        }

        const options = {
            title: 'Toast with Action',
            description: 'This toast has an action',
            type: 'info',
            action: mockAction
        }

        toast(options)

        expect(toaster.create).toHaveBeenCalledWith(options)
    })

    it('should handle empty or undefined options', () => {
        const {result} = renderHook(() => useToast())
        const toast = result.current

        toast()
        toast(undefined)
        toast({})

        expect(toaster.create).toHaveBeenCalledTimes(3)
        expect(toaster.create).toHaveBeenNthCalledWith(1, undefined)
        expect(toaster.create).toHaveBeenNthCalledWith(2, undefined)
        expect(toaster.create).toHaveBeenNthCalledWith(3, {})
    })

    it('should maintain function reference stability (memoization)', () => {
        const {result, rerender} = renderHook(() => useToast())
        const firstRender = result.current

        rerender()
        const secondRender = result.current

        expect(firstRender).toBe(secondRender)
    })

    it('should handle all toast types', () => {
        const {result} = renderHook(() => useToast())
        const toast = result.current

        const types = ['success', 'error', 'warning', 'info']

        types.forEach((type, index) => {
            toast({
                title: `${type} toast`,
                type
            })

            expect(toaster.create).toHaveBeenNthCalledWith(index + 1, {
                title: `${type} toast`,
                type
            })
        })

        expect(toaster.create).toHaveBeenCalledTimes(4)
    })
})
