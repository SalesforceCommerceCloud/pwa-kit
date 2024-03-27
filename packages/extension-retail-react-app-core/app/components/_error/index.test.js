/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Error from '@salesforce/retail-react-app/app/components/_error/index'
// !!! ----- WARNING ----- WARNING ----- WARNING ----- !!!
// Tests use render instead of renderWithProviders because
// error component is rendered outside provider tree
// !!! ----------------------------------------------- !!!
import {screen, render} from '@testing-library/react'

test('Error renders without errors', () => {
    expect(render(<Error />)).toBeDefined()
})

test('Error status 500', () => {
    render(<Error status={500} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
})

test('Error status 500 with stack trace', () => {
    render(<Error status={500} stack={'Stack trace error message'} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
    expect(screen.getByText(/stack trace error message/i)).toBeInTheDocument()
})
