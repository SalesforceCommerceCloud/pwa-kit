/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import ListMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'

describe('ListMenu', () => {
    test('ListMenu renders without errors', () => {
        renderWithProviders(<ListMenu />)

        const drawer = document.getElementById('chakra-toast-portal')

        expect(drawer).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()
    })
})
