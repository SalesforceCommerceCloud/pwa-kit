/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import OfflineBanner from './index'
import {screen} from '@testing-library/react'

test('OfflineBanner component is rendered appropriately', () => {
    renderWithProviders(<OfflineBanner />)
    expect(screen.getByText("You're currently browsing in offline mode")).toBeInTheDocument()
})
