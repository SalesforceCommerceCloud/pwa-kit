/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import OfflineBanner from './index'
import {screen} from '@testing-library/react'

test('OfflineBanner component is rendered appropriately', () => {
    renderWithProviders(<OfflineBanner />)
    expect(screen.getByText("You're currently browsing in offline mode")).toBeInTheDocument()
})
