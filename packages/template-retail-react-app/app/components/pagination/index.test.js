/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Pagination from '@salesforce/retail-react-app/app/components/pagination/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const mockUrls = ['/test?offset=0', '/test?offset=25', '/test?offset=50', '/test?offset=75']
const mockCurrentUrl = '/test?offset=25'

test('Renders Breadcrum', () => {
    const {getAllByRole} = renderWithProviders(
        <Pagination urls={mockUrls} currentUrl={mockCurrentUrl} />
    )

    const [prev, next] = getAllByRole('link')
    const option = getAllByRole('option')

    expect(prev).toBeDefined()
    expect(next).toBeDefined()
    expect(option).toHaveLength(mockUrls.length)
})
