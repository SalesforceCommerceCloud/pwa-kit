/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import AddressSuggestionDropdown from './address-suggestion-dropdown'

describe('AddressSuggestionDropdown', () => {
    const mockSuggestions = [
        {
            mainText: '123 Main Street',
            secondaryText: 'New York, NY 10001, USA',
            country: 'US'
        },
        {
            mainText: '456 Oak Avenue',
            secondaryText: 'Los Angeles, CA 90210, USA',
            country: 'US'
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
                suggestions={[{mainText: 'dummy'}]}
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
                mainText: '123 Main Street',
                secondaryText: null
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
