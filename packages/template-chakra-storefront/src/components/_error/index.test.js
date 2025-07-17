/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Error from './index'
// !!! ----- WARNING ----- WARNING ----- WARNING ----- !!!
// Tests use render instead of renderWithProviders because
// error component is rendered outside provider tree
// !!! ----------------------------------------------- !!!
import {screen, render} from '@testing-library/react'
import {renderWithChakraProvider} from '../../utils/test-utils'
const originalLocation = window.location

afterEach(() => {
    // Restore `window.location` to the `jsdom` `Location` object
    window.location = originalLocation

    jest.resetModules()
})

test('Error renders without errors', () => {
    expect(renderWithChakraProvider(<Error />)).toBeDefined()
})

test('Error status 500', () => {
    renderWithChakraProvider(<Error status={500} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
})

test('Error status 500 with stack trace', () => {
    renderWithChakraProvider(<Error status={500} stack={'Stack trace error message'} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
    expect(screen.getByText(/stack trace error message/i)).toBeInTheDocument()
})

test('clicking logo navigates to home', () => {
    // Mock window.location.href
    delete window.location
    window.location = {href: ''}
    renderWithChakraProvider(<Error />)
    const logoBtn = screen.getByLabelText('logo')
    logoBtn.click()
    expect(window.location.href).toBe('/')
})

test('Contact Support button has correct link', () => {
    renderWithChakraProvider(<Error />)
    const supportBtn = screen.getByRole('link', {name: 'Contact Support'})
    expect(supportBtn).toHaveAttribute('href', 'https://help.salesforce.com/s/support')
    expect(supportBtn).toHaveAttribute('target', '_blank')
})

test('clicking Refresh the page calls window.location.reload', () => {
    const reloadMock = jest.fn()
    Object.defineProperty(window, 'location', {
        value: {reload: reloadMock},
        writable: true
    })
    renderWithChakraProvider(<Error />)
    const refreshBtn = screen.getByRole('button', {name: 'Refresh the page'})
    refreshBtn.click()
    expect(reloadMock).toHaveBeenCalled()
})

test('renders custom error message', () => {
    renderWithChakraProvider(<Error message="Custom error occurred" />)
    expect(screen.getByText('Custom error occurred')).toBeInTheDocument()
})
