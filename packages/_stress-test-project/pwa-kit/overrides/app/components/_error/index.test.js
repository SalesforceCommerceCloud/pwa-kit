/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import Error from './index'

test('Error renders without errors', () => {
    expect(renderWithProviders(<Error />))
})

test('Error status 500', () => {
    renderWithProviders(<Error status={500} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
})

test('Error status 500 with stack trace', () => {
    renderWithProviders(<Error status={500} stack={'Stack trace error message'} />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent("This page isn't working")
    expect(screen.getByText(/stack trace error message/i)).toBeInTheDocument()
})
