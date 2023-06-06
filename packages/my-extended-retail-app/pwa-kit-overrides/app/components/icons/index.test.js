/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {within} from '@testing-library/dom'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import * as Icons from '@salesforce/retail-react-app/app/components/icons/index'

test('renders svg icons with Chakra Icon component', () => {
    renderWithProviders(<Icons.CheckIcon />)
    const svg = document.querySelector('.chakra-icon')
    const use = within(svg).getByRole('presentation')
    expect(svg).toBeInTheDocument()
    expect(use).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(use).toHaveAttribute('xlink:href', '#check')
})
