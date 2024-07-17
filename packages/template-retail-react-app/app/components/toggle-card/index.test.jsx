import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import { ToggleCard } from './index'

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
