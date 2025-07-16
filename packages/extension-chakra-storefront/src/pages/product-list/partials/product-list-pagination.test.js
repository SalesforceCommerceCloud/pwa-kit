/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import ProductListPagination from './product-list-pagination'

describe('ProductListPagination', () => {
    const mockUrls = [
        '/test?offset=0&limit=25',
        '/test?offset=25&limit=25',
        '/test?offset=50&limit=25'
    ]
    const basePath = '/test?offset=0&limit=25'

    test('renders nothing when pageUrls is not provided or has less than 2 items', () => {
        const {container, rerender} = renderWithProviders(<ProductListPagination />)
        expect(container.firstChild).toBeNull()

        rerender(<ProductListPagination pageUrls={[]} />)
        expect(container.firstChild).toBeNull()

        rerender(<ProductListPagination pageUrls={[mockUrls[0]]} />)
        expect(container.firstChild).toBeNull()
    })

    test('renders pagination when there are multiple page URLs', () => {
        renderWithProviders(<ProductListPagination basePath={basePath} pageUrls={mockUrls} />)

        // The underlying Pagination component is tested in detail separately.
        // Here, we just want to confirm that it renders.
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
    })
})
