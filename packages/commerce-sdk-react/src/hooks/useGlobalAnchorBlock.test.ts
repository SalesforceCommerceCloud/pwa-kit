/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook} from '@testing-library/react'
import {useGlobalAnchorBlock} from './useGlobalAnchorBlock'

describe('useGlobalAnchorBlock', () => {
    let addEventListenerSpy: jest.SpyInstance
    let removeEventListenerSpy: jest.SpyInstance

    beforeEach(() => {
        // Create spies for event listener methods
        addEventListenerSpy = jest.spyOn(document, 'addEventListener')
        removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    })

    afterEach(() => {
        // Clean up spies
        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
    })

    describe('event listener registration', () => {
        it('should add click event listener when enabled is true', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
        })

        it('should add click event listener when enabled is not provided (defaults to true)', () => {
            renderHook(() => useGlobalAnchorBlock())

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
        })

        it('should not add click event listener when enabled is false', () => {
            renderHook(() => useGlobalAnchorBlock(false))

            expect(addEventListenerSpy).not.toHaveBeenCalled()
        })

        it('should remove click event listener on unmount', () => {
            const {unmount} = renderHook(() => useGlobalAnchorBlock(true))

            // Get the handler function that was registered
            const registeredHandler = addEventListenerSpy.mock.calls[0][1]

            unmount()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('click', registeredHandler, true)
        })

        it('should update event listener when enabled changes', () => {
            const {rerender} = renderHook(({enabled}) => useGlobalAnchorBlock(enabled), {
                initialProps: {enabled: false}
            })

            expect(addEventListenerSpy).not.toHaveBeenCalled()

            // Enable blocking
            rerender({enabled: true})

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true)

            // Disable blocking
            rerender({enabled: false})

            expect(removeEventListenerSpy).toHaveBeenCalled()
        })
    })

    describe('anchor click blocking', () => {
        it('should prevent default on anchor clicks', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '/some-path'
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            expect(preventDefaultSpy).toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should prevent default when clicking on child elements of anchor', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '/some-path'
            const span = document.createElement('span')
            span.textContent = 'Click me'
            anchor.appendChild(span)
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            // Click the span inside the anchor
            span.dispatchEvent(event)

            expect(preventDefaultSpy).toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should not prevent default on non-anchor elements', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const button = document.createElement('button')
            document.body.appendChild(button)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            button.dispatchEvent(event)

            expect(preventDefaultSpy).not.toHaveBeenCalled()

            document.body.removeChild(button)
        })
    })

    describe('data-pd-allow-link attribute', () => {
        it('should allow navigation when anchor has data-pd-allow-link attribute', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '/some-path'
            anchor.setAttribute('data-pd-allow-link', '')
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            expect(preventDefaultSpy).not.toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should allow navigation when clicking child of anchor with data-pd-allow-link', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '/some-path'
            anchor.setAttribute('data-pd-allow-link', '')
            const span = document.createElement('span')
            span.textContent = 'Click me'
            anchor.appendChild(span)
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            span.dispatchEvent(event)

            expect(preventDefaultSpy).not.toHaveBeenCalled()

            document.body.removeChild(anchor)
        })
    })

    describe('hash/anchor links', () => {
        it('should allow navigation for hash links (#section)', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '#section'
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            expect(preventDefaultSpy).not.toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should allow navigation for empty hash links (#)', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '#'
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            expect(preventDefaultSpy).not.toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should block navigation for regular paths, not hash links', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            anchor.href = '/path/to/page'
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            expect(preventDefaultSpy).toHaveBeenCalled()

            document.body.removeChild(anchor)
        })
    })

    describe('edge cases', () => {
        it('should handle anchors without href attribute', () => {
            renderHook(() => useGlobalAnchorBlock(true))

            const anchor = document.createElement('a')
            // No href attribute
            document.body.appendChild(anchor)

            const event = new MouseEvent('click', {bubbles: true, cancelable: true})
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            anchor.dispatchEvent(event)

            // Should prevent default even without href
            expect(preventDefaultSpy).toHaveBeenCalled()

            document.body.removeChild(anchor)
        })

        it('should handle multiple hook instances', () => {
            renderHook(() => useGlobalAnchorBlock(true))
            renderHook(() => useGlobalAnchorBlock(true))

            // Should have registered two event listeners
            expect(addEventListenerSpy).toHaveBeenCalledTimes(2)
        })

        it('should handle rapid enable/disable toggling', () => {
            const {rerender} = renderHook(({enabled}) => useGlobalAnchorBlock(enabled), {
                initialProps: {enabled: true}
            })

            rerender({enabled: false})
            rerender({enabled: true})
            rerender({enabled: false})
            rerender({enabled: true})

            // Should have added and removed listeners appropriately
            expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(0)
            expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(0)
        })
    })
})
