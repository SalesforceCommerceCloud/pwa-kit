/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {IntlProvider} from 'react-intl'
import PickupOrDelivery, {
    DELIVERY_OPTIONS
} from '@salesforce/retail-react-app/app/components/pickup-or-delivery/index'

// Mock the shared UI components
jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => ({
    // eslint-disable-next-line react/prop-types
    Box: ({children, ...props}) => <div {...props}>{children}</div>,
    // eslint-disable-next-line react/prop-types
    Text: ({children, ...props}) => <span {...props}>{children}</span>,
    // eslint-disable-next-line react/prop-types
    Select: ({children, onChange, size, ...props}) => (
        <select onChange={onChange} data-size={size} {...props}>
            {children}
        </select>
    )
}))

// Helper function to render component with IntlProvider
const renderWithIntl = (component) => {
    return render(
        <IntlProvider locale="en" messages={{}}>
            {component}
        </IntlProvider>
    )
}

describe('PickupOrDelivery', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders with default props', () => {
        renderWithIntl(<PickupOrDelivery />)

        const select = screen.getByTestId('delivery-option-select')
        expect(select).toBeInTheDocument()
        expect(select).toHaveValue(DELIVERY_OPTIONS.SHIP)

        // Should not show labels by default
        expect(screen.queryByText('Delivery:')).not.toBeInTheDocument()

        // Should have both options
        expect(screen.getByText('Ship to Address')).toBeInTheDocument()
        expect(screen.getByText('Pick Up in Store')).toBeInTheDocument()
    })

    test('renders with showLabels=true', () => {
        renderWithIntl(<PickupOrDelivery showLabels={true} />)

        expect(screen.getByText('Delivery:')).toBeInTheDocument()
    })

    test('renders with showLabels=false', () => {
        renderWithIntl(<PickupOrDelivery showLabels={false} />)

        expect(screen.queryByText('Delivery:')).not.toBeInTheDocument()
    })

    test('renders with pickup selected', () => {
        renderWithIntl(<PickupOrDelivery value={DELIVERY_OPTIONS.PICKUP} />)

        const select = screen.getByTestId('delivery-option-select')
        expect(select).toHaveValue(DELIVERY_OPTIONS.PICKUP)
    })

    test('passes size prop to Select component', () => {
        renderWithIntl(<PickupOrDelivery size="md" />)

        const select = screen.getByTestId('delivery-option-select')
        expect(select).toBeInTheDocument()
        // Check that size is passed as a data attribute
        expect(select).toHaveAttribute('data-size', 'md')
    })

    test('disables ship option when isShipDisabled=true', () => {
        renderWithIntl(<PickupOrDelivery isShipDisabled={true} />)

        const shipOption = screen.getByRole('option', {name: 'Ship to Address'})
        expect(shipOption).toBeDisabled()

        const pickupOption = screen.getByRole('option', {name: 'Pick Up in Store'})
        expect(pickupOption).not.toBeDisabled()
    })

    test('disables pickup option when isPickupDisabled=true', () => {
        renderWithIntl(<PickupOrDelivery isPickupDisabled={true} />)

        const shipOption = screen.getByRole('option', {name: 'Ship to Address'})
        expect(shipOption).not.toBeDisabled()

        const pickupOption = screen.getByRole('option', {name: 'Pick Up in Store'})
        expect(pickupOption).toBeDisabled()
    })

    test('disables both options when both disabled props are true', () => {
        renderWithIntl(<PickupOrDelivery isShipDisabled={true} isPickupDisabled={true} />)

        const shipOption = screen.getByRole('option', {name: 'Ship to Address'})
        expect(shipOption).toBeDisabled()

        const pickupOption = screen.getByRole('option', {name: 'Pick Up in Store'})
        expect(pickupOption).toBeDisabled()
    })

    test('calls onChange when selection changes', async () => {
        const user = userEvent.setup()
        const mockOnChange = jest.fn()

        renderWithIntl(<PickupOrDelivery onChange={mockOnChange} />)

        const select = screen.getByTestId('delivery-option-select')
        await user.selectOptions(select, DELIVERY_OPTIONS.PICKUP)

        expect(mockOnChange).toHaveBeenCalledTimes(1)
        expect(mockOnChange).toHaveBeenCalledWith(DELIVERY_OPTIONS.PICKUP)
    })

    test('calls onChange when changing back to ship', async () => {
        const user = userEvent.setup()
        const mockOnChange = jest.fn()

        renderWithIntl(<PickupOrDelivery value={DELIVERY_OPTIONS.PICKUP} onChange={mockOnChange} />)

        const select = screen.getByTestId('delivery-option-select')
        await user.selectOptions(select, DELIVERY_OPTIONS.SHIP)

        expect(mockOnChange).toHaveBeenCalledTimes(1)
        expect(mockOnChange).toHaveBeenCalledWith(DELIVERY_OPTIONS.SHIP)
    })

    test('does not call onChange when no onChange handler provided', () => {
        renderWithIntl(<PickupOrDelivery />)

        const select = screen.getByTestId('delivery-option-select')

        // Should not throw error when no onChange handler is provided
        expect(() => {
            fireEvent.change(select, {target: {value: DELIVERY_OPTIONS.PICKUP}})
        }).not.toThrow()
    })

    test('handles onChange with undefined handler gracefully', () => {
        renderWithIntl(<PickupOrDelivery onChange={undefined} />)

        const select = screen.getByTestId('delivery-option-select')

        // Should not throw error when onChange is undefined
        expect(() => {
            fireEvent.change(select, {target: {value: DELIVERY_OPTIONS.PICKUP}})
        }).not.toThrow()
    })

    test('renders with all props combined', () => {
        const mockOnChange = jest.fn()

        renderWithIntl(
            <PickupOrDelivery
                value={DELIVERY_OPTIONS.PICKUP}
                onChange={mockOnChange}
                isPickupDisabled={true}
                isShipDisabled={false}
                showLabels={true}
                size="lg"
            />
        )

        const select = screen.getByTestId('delivery-option-select')
        expect(select).toHaveValue(DELIVERY_OPTIONS.PICKUP)
        expect(select).toHaveAttribute('data-size', 'lg')

        expect(screen.getByText('Delivery:')).toBeInTheDocument()

        const shipOption = screen.getByRole('option', {name: 'Ship to Address'})
        expect(shipOption).not.toBeDisabled()

        const pickupOption = screen.getByRole('option', {name: 'Pick Up in Store'})
        expect(pickupOption).toBeDisabled()
    })

    test('exports DELIVERY_OPTIONS constants', () => {
        expect(DELIVERY_OPTIONS).toBeDefined()
        expect(DELIVERY_OPTIONS.SHIP).toBe('ship')
        expect(DELIVERY_OPTIONS.PICKUP).toBe('pickup')
    })
})
