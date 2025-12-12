/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import '@testing-library/jest-dom'
import AddressSuggestionDropdown from '@salesforce/retail-react-app/app/components/address-suggestion-dropdown/index'

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
                {value: '123 Main Street'},
                {value: 'New York'},
                {value: 'NY'},
                {value: '10001'},
                {value: 'USA'}
            ],
            placePrediction: {
                text: {text: '123 Main Street, New York, NY 10001, USA'},
                placeId: 'ChIJ1234567890'
            }
        },
        {
            description: '456 Oak Avenue, Los Angeles, CA 90210, USA',
            place_id: 'ChIJ4567890123',
            structured_formatting: {
                main_text: '456 Oak Avenue',
                secondary_text: 'Los Angeles, CA 90210, USA'
            },
            terms: [
                {value: '456 Oak Avenue'},
                {value: 'Los Angeles'},
                {value: 'CA'},
                {value: '90210'},
                {value: 'USA'}
            ],
            placePrediction: {
                text: {text: '456 Oak Avenue, Los Angeles, CA 90210, USA'},
                placeId: 'ChIJ4567890123'
            }
        }
    ]

    const defaultProps = {
        suggestions: [],
        isLoading: false,
        isVisible: false,
        onClose: jest.fn(),
        onSelectSuggestion: jest.fn()
    }

    const renderWithIntl = (component) => {
        return render(
            <IntlProvider locale="en" messages={{}}>
                {component}
            </IntlProvider>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should not render when isVisible is false', () => {
        renderWithIntl(<AddressSuggestionDropdown {...defaultProps} />)

        expect(screen.queryByTestId('address-suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('should render dropdown when isVisible is true', () => {
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
            />
        )

        expect(screen.getByTestId('address-suggestion-dropdown')).toBeInTheDocument()
    })

    it('should render loading state when isLoading is true', () => {
        renderWithIntl(
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
                        placePrediction: {
                            text: {text: 'dummy'},
                            placeId: 'dummy'
                        }
                    }
                ]}
            />
        )

        expect(screen.getByText('Loading suggestions...')).toBeInTheDocument()
    })

    it('should render suggestions when provided', () => {
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
            />
        )

        expect(screen.getByText('123 Main Street, New York, NY 10001, USA')).toBeInTheDocument()
        expect(screen.getByText('456 Oak Avenue, Los Angeles, CA 90210, USA')).toBeInTheDocument()
    })

    it('should call onSelectSuggestion when a suggestion is clicked', () => {
        const mockOnSelect = jest.fn()
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        fireEvent.click(screen.getByText('123 Main Street, New York, NY 10001, USA'))

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should call onSelectSuggestion when Enter key is pressed on a suggestion', () => {
        const mockOnSelect = jest.fn()
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        const firstSuggestion = screen
            .getByText('123 Main Street, New York, NY 10001, USA')
            .closest('[role="button"]')
        fireEvent.keyDown(firstSuggestion, {key: 'Enter', code: 'Enter'})

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should call onClose when close button is clicked', () => {
        const mockOnClose = jest.fn()
        renderWithIntl(
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
        renderWithIntl(
            <AddressSuggestionDropdown {...defaultProps} isVisible={true} suggestions={[]} />
        )

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

        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={suggestionsWithoutSecondary}
            />
        )

        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
    })

    it('should handle keyboard navigation', () => {
        const mockOnSelect = jest.fn()
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        const firstSuggestion = screen
            .getByText('123 Main Street, New York, NY 10001, USA')
            .closest('[role="button"]')
        fireEvent.keyDown(firstSuggestion, {key: 'Enter', code: 'Enter'})

        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should handle mouse hover on suggestions', () => {
        const mockOnSelect = jest.fn()
        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={mockSuggestions}
                onSelectSuggestion={mockOnSelect}
            />
        )

        const firstSuggestion = screen
            .getByText('123 Main Street, New York, NY 10001, USA')
            .closest('[role="button"]')

        // Verify element exists before hover
        expect(firstSuggestion).toBeInTheDocument()

        // Simulate hover events
        fireEvent.mouseEnter(firstSuggestion)
        fireEvent.mouseLeave(firstSuggestion)

        // Verify element is still present and functional after hover
        expect(firstSuggestion).toBeInTheDocument()
        expect(firstSuggestion).toHaveAttribute('role', 'button')

        // Verify the suggestion is still clickable after hover
        fireEvent.click(firstSuggestion)
        expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should display Google Maps placePrediction data correctly', () => {
        const googleMapsSuggestions = [
            {
                description: '123 Main St, New York, NY 10001, USA',
                place_id: 'test-place-id',
                structured_formatting: {
                    main_text: '123 Main St',
                    secondary_text: 'New York, NY 10001, USA'
                },
                terms: [
                    {value: '123 Main St'},
                    {value: 'New York'},
                    {value: 'NY'},
                    {value: '10001'},
                    {value: 'USA'}
                ],
                placePrediction: {
                    text: {text: '123 Main St, New York, NY 10001, USA'},
                    placeId: 'test-place-id'
                }
            }
        ]

        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={googleMapsSuggestions}
            />
        )

        expect(screen.getByText('123 Main St, New York, NY 10001, USA')).toBeInTheDocument()
    })

    it('should fallback to structured_formatting when placePrediction is not available', () => {
        const fallbackSuggestions = [
            {
                description: '123 Main St, New York, NY 10001, USA',
                place_id: 'test-place-id',
                structured_formatting: {
                    main_text: '123 Main St',
                    secondary_text: 'New York, NY 10001, USA'
                },
                terms: [
                    {value: '123 Main St'},
                    {value: 'New York'},
                    {value: 'NY'},
                    {value: '10001'},
                    {value: 'USA'}
                ]
            }
        ]

        renderWithIntl(
            <AddressSuggestionDropdown
                {...defaultProps}
                isVisible={true}
                suggestions={fallbackSuggestions}
            />
        )

        expect(screen.getByText('123 Main St, New York, NY 10001, USA')).toBeInTheDocument()
    })
})
