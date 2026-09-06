/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import HelloWorld from '@salesforce/retail-react-app/app/pages/hello-world/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen} from '@testing-library/react'

test('renders the Hello World heading', () => {
    renderWithProviders(<HelloWorld />)

    expect(screen.getByRole('heading', {name: /Hello World/i})).toBeInTheDocument()
})
