/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {ToggleCard} from '@salesforce/retail-react-app/app/components/toggle-card'

test('ToggleCard renders edit button with correct aria-label and calls onEdit on click', () => {
    const mockOnEdit = jest.fn()
    const editLabel = 'Edit Card'

    renderWithProviders(
        <ToggleCard
            title="Card Title"
            editLabel={editLabel}
            editing={false}
            disabled={false}
            onEdit={mockOnEdit}
        />
    )

    // Find the edit button
    const editButton = screen.getByRole('button', {name: editLabel})

    // Assert aria-label
    expect(editButton).toHaveAttribute('aria-label', editLabel)

    // Click the edit button
    fireEvent.click(editButton)

    // Assert onEdit function is called
    expect(mockOnEdit).toHaveBeenCalledTimes(1)
})

test('ToggleCard focuses on title when first editting', () => {
    const cardTitle = 'Card Title'

    renderWithProviders(<ToggleCard title={cardTitle} editing={true} />)

    const title = screen.getByText(cardTitle)
    expect(title).toBeInTheDocument()
    expect(document.activeElement).toBe(title)
})
