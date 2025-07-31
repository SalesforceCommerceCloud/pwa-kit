/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, act} from '@testing-library/react'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import PropTypes from 'prop-types'
// Test component that uses the hook
const TestComponent = ({src}) => {
    const scriptLoadStatus = useScript(src)

    return <div data-testid="script-status">{JSON.stringify(scriptLoadStatus)}</div>
}

TestComponent.propTypes = {
    src: PropTypes.string
}

describe('useScript hook', () => {
    beforeEach(() => {
        // Clear any existing scripts
        const scripts = document.querySelectorAll('script[src]')
        scripts.forEach((script) => script.remove())
    })

    test('should return initial state when no src is provided', () => {
        const {getByTestId} = render(<TestComponent src={null} />)

        expect(getByTestId('script-status').textContent).toBe(
            JSON.stringify({loaded: false, error: false})
        )
        expect(document.querySelector('script[src]')).toBeNull()
    })

    test('should create and append script element when a script element does not exist', () => {
        const src = 'https://test-script.js/'
        render(<TestComponent src={src} />)

        const script = document.querySelector(`script[src="${src}"]`)
        expect(script).not.toBeNull()
        expect(script.src).toBe(src)
        expect(script.defer).toBe(true)
    })

    test('should not create a script element when a script element already exists', () => {
        const src = 'https://test-script.js'

        // Create an existing script
        const existingScript = document.createElement('script')
        existingScript.src = src
        document.body.appendChild(existingScript)

        const initialScriptCount = document.querySelectorAll(`script[src="${src}"]`).length

        render(<TestComponent src={src} />)

        const finalScriptCount = document.querySelectorAll(`script[src="${src}"]`).length
        expect(finalScriptCount).toBe(initialScriptCount)
    })

    test('should update state to loaded when script loads successfully', () => {
        const src = 'https://test-script.js'
        const {getByTestId} = render(<TestComponent src={src} />)

        const script = document.querySelector(`script[src="${src}"]`)

        // Simulate script load event
        act(() => {
            script.dispatchEvent(new Event('load'))
        })

        expect(getByTestId('script-status').textContent).toBe(
            JSON.stringify({loaded: true, error: false})
        )
    })

    test('should update state to error when script fails to load', () => {
        const src = 'https://test-script.js'
        const {getByTestId} = render(<TestComponent src={src} />)

        const script = document.querySelector(`script[src="${src}"]`)

        // Simulate script error event
        act(() => {
            script.dispatchEvent(new Event('error'))
        })

        expect(getByTestId('script-status').textContent).toBe(
            JSON.stringify({loaded: false, error: true})
        )
    })

    test('should handle multiple script loads with the same src', () => {
        const src = 'https://test-script.js'

        // First render
        const {getByTestId, rerender} = render(<TestComponent src={src} />)

        const script = document.querySelector(`script[src="${src}"]`)

        // Simulate first script load
        act(() => {
            script.dispatchEvent(new Event('load'))
        })

        const initialScriptCount = document.querySelectorAll(`script[src="${src}"]`).length

        // Re-render with same src
        rerender(<TestComponent src={src} />)

        const finalScriptCount = document.querySelectorAll(`script[src="${src}"]`).length
        expect(finalScriptCount).toBe(initialScriptCount)

        // State should remain loaded
        expect(getByTestId('script-status').textContent).toBe(
            JSON.stringify({loaded: true, error: false})
        )
    })

    test('should not load a new script when the src changes', () => {
        const src1 = 'https://test-script-1.js/'
        const src2 = 'https://test-script-2.js/'

        const {rerender} = render(<TestComponent src={src1} />)

        const script1 = document.querySelector(`script[src="${src1}"]`)

        // Simulate first script load
        act(() => {
            script1.dispatchEvent(new Event('load'))
        })

        // Re-render with different src
        rerender(<TestComponent src={src2} />)

        const script2 = document.querySelector(`script[src="${src1}"]`)
        expect(script2.src).toBe(src1)
    })
})
