/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import App from './index'

describe('App', () => {
    test('Renders correctly', () => {
        const body = <p>Hello world</p>
        render(<App>{body}</App>)
        expect(screen.getByText(/hello world/i)).toBeInTheDocument()
    })
})
