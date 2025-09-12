/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SingleAddressToggleModal from '@salesforce/retail-react-app/app/components/single-address-toggle-modal'

describe('SingleAddressToggleModal', () => {
    const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        onCancel: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders modal when open', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} />)
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText('Switch to one address?')).toBeInTheDocument()
        expect(
            screen.getByText(
                /If you switch to one address, the shipping addresses you added for the items will be removed/
            )
        ).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} isOpen={false} />)
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.queryByText('Switch to one address?')).not.toBeInTheDocument()
    })

    it('calls onConfirm when Switch button is clicked', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} />)
        const continueButton = screen.getByRole('button', {name: /switch/i})
        fireEvent.click(continueButton)
        expect(mockProps.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when Cancel button is clicked', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} />)
        const cancelButton = screen.getByRole('button', {name: /cancel/i})
        fireEvent.click(cancelButton)
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('has proper accessibility attributes', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} />)
        const dialog = screen.getByRole('alertdialog')
        expect(dialog).toHaveAttribute('aria-labelledby')
        expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('handles keyboard navigation', () => {
        renderWithProviders(<SingleAddressToggleModal {...mockProps} />)
        const continueButton = screen.getByRole('button', {name: /switch/i})
        const cancelButton = screen.getByRole('button', {name: /cancel/i})
        continueButton.focus()
        expect(document.activeElement).toBe(continueButton)
        cancelButton.focus()
        expect(document.activeElement).toBe(cancelButton)
    })
})
