/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import AddressSuggestionDropdown from '@salesforce/retail-react-app/../../app/components/address-suggestion-dropdown/index'

describe('AddressSuggestionDropdown', () => {
    const mockSuggestions = [
        {
            description: '123 Main Street, New York, NY 10001, USA',
            place_id: 'ChIJ1234567890',
            structured_formatting: {
                main_text: '123 Main Street',
                secondary_text: 'New York, NY 10001, USA'
            },
            terms: [
                {offset: 0, value: '123 Main Street'},
                {offset: 17, value: 'New York'},
                {offset: 27, value: 'NY'},
                {offset: 30, value: '10001'},
                {offset: 37, value: 'USA'}
            ],
            types: ['street_address']
        },
        {
            description: '456 Oak Avenue, Los Angeles, CA 90210, USA',
            place_id: 'ChIJ4567890123',
            structured_formatting: {
                main_text: '456 Oak Avenue',
                secondary_text: 'Los Angeles, CA 90210, USA'
            },
            terms: [
                {offset: 0, value: '456 Oak Avenue'},
                {offset: 16, value: 'Los Angeles'},
                {offset: 29, value: 'CA'},
                {offset: 32, value: '90210'},
                {offset: 39, value: 'USA'}
            ],
            types: ['street_address']
        }
    ]

    const defaultProps = {
        suggestions: [],
        isLoading: false,
        isVisible: false,
        onClose: jest.fn(),
        onSelectSuggestion: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should not render when isVisible is false', () => {
        render(<AddressSuggestionDropdown {...defaultProps} />)

        expect(screen.queryByTestId('address-suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('should render dropdown when isVisible is true', () => {
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
            />
        )

        expect(screen.getByTestId('address-suggestion-dropdown')).toBeInTheDocument()
    })

    it('should render loading state when isLoading is true', () => {
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                isLoading={true}
                suggestions={[
                    {
                        description: 'dummy',
                        place_id: 'dummy',
                        structured_formatting: {
                            main_text: 'dummy',
                            secondary_text: 'dummy'
                        },
                        terms: [],
                        types: []
                    }
                ]}
            />
        )

        expect(screen.getByText('Loading suggestions...')).toBeInTheDocument()
    })

    it('should render suggestions when provided', () => {
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
            />
        )

        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('New York, NY 10001, USA')).toBeInTheDocument()
        expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument()
        expect(screen.getByText('Los Angeles, CA 90210, USA')).toBeInTheDocument()
    })

    it('should call onSelectSuggestion when a suggestion is clicked', () => {
        const mockOnSelect = jest.fn()
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        fireEvent.click(screen.getByText('123 Main Street'))

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should call onSelectSuggestion when Enter key is pressed on a suggestion', () => {
        const mockOnSelect = jest.fn()
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        const firstSuggestion = screen.getByText('123 Main Street').closest('[role="button"]')
        fireEvent.keyDown(firstSuggestion, {key: 'Enter', code: 'Enter'})

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should call onClose when close button is clicked', () => {
        const mockOnClose = jest.fn()
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onClose={mockOnClose}
            />
        )

        const closeButton = screen.getByLabelText('Close suggestions')
        fireEvent.click(closeButton)

        expect(mockOnClose).toHaveBeenCalled()
    })

    it('should handle empty suggestions array', () => {
        render(<AddressSuggestionDropdown {...defaultProps} isVisible={true} suggestions={[]} />)

        // Should not render anything when suggestions are empty
        expect(screen.queryByTestId('address-suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('should handle suggestions with missing secondaryText', () => {
        const suggestionsWithoutSecondary = [
            {
                description: '123 Main Street',
                place_id: 'ChIJ1234567890',
                structured_formatting: {
                    main_text: '123 Main Street',
                    secondary_text: null
                },
                terms: [{offset: 0, value: '123 Main Street'}],
                types: ['street_address']
            }
        ]

        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={suggestionsWithoutSecondary}
            />
        )

        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        // Should not crash when secondaryText is null
    })

    it('should handle keyboard navigation', () => {
        const mockOnSelect = jest.fn()
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        const firstSuggestion = screen.getByText('123 Main Street').closest('[role="button"]')
        fireEvent.keyDown(firstSuggestion, {key: 'Enter', code: 'Enter'})

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should handle mouse hover on suggestions', () => {
        render(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
            />
        )

        const firstSuggestion = screen.getByText('123 Main Street').closest('[role="button"]')

        // Should not crash on hover
        fireEvent.mouseEnter(firstSuggestion)
        fireEvent.mouseLeave(firstSuggestion)
    })
})
