/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import '@testing-library/jest-dom'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../test-utils'

const Component = () => {
    return <div>hello world</div>
}

test('FOO', () => {
    renderWithProviders(<Component />)
    expect(screen.getByText('hello world')).toBeInTheDocument()

    // TODO: should use renderHook() instead?
    // https://testing-library.com/docs/react-testing-library/api#renderhook
})
