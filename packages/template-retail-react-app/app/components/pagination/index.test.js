/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import Pagination from '@salesforce/retail-react-app/app/components/pagination/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// mock the useHistory
const mockPush = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        push: mockPush
    })
}))

describe('Pagination', () => {
    const mockUrls = ['/test?offset=0', '/test?offset=25', '/test?offset=50', '/test?offset=75']
    const defaultProps = {
        urls: mockUrls,
        currentURL: '/test?offset=25'
    }

    beforeEach(() => {
        mockPush.mockClear()
    })

    it('Renders Pagination and its elements', () => {
        const {getAllByRole} = renderWithProviders(<Pagination {...defaultProps} />)
        const [prev, next] = getAllByRole('link')
        const option = getAllByRole('option')
        expect(prev).toBeDefined()
        expect(next).toBeDefined()
        expect(option).toHaveLength(mockUrls.length)
    })

    it('shows correct number of pages', () => {
        renderWithProviders(<Pagination {...defaultProps} />)
        expect(screen.getByText('of 4')).toBeInTheDocument()
    })

    it('shows correct current page in select options', () => {
        renderWithProviders(<Pagination {...defaultProps} />)
        expect(screen.getByLabelText('Select page number').value).toBe('/test?offset=25')
    })

    it('disables disabled previous button on first page of contents', () => {
        renderWithProviders(<Pagination {...defaultProps} currentURL="/test?offset=0" />)
        const prev = screen.getByLabelText('Previous Page')
        expect(prev).toHaveAttribute('aria-disabled', 'true')
    })

    it('disables disabled next button on last page', () => {
        renderWithProviders(<Pagination {...defaultProps} currentURL="/test?offset=75" />)
        const next = screen.getByLabelText('Next Page')
        expect(next).toHaveAttribute('aria-disabled', 'true')
    })

    it('navigation buttons are enabled on middle pages', () => {
        renderWithProviders(<Pagination {...defaultProps} />)
        const prevButton = screen.getByLabelText('Previous Page')
        const nextButton = screen.getByLabelText('Next Page')
        expect(prevButton).toHaveAttribute('aria-disabled', 'false')
        expect(nextButton).toHaveAttribute('aria-disabled', 'false')
    })

    it('navigates to selected page when using pages dropdown', () => {
        renderWithProviders(<Pagination {...defaultProps} />)
        const select = screen.getByLabelText('Select page number')
        fireEvent.change(select, {target: {value: '/test?offset=50'}})
        expect(mockPush).toHaveBeenCalledWith('/test?offset=50')
    })

    it('renders all page options in select', () => {
        renderWithProviders(<Pagination {...defaultProps} />)
        const select = screen.getByLabelText('Select page number')
        expect(select.options).toHaveLength(mockUrls.length)
        mockUrls.forEach((url, index) => {
            expect(select.options[index].value).toBe(url)
            expect(select.options[index].text).toBe(String(index + 1))
        })
    })
})
