/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal/index'
import {Box, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {screen} from '@testing-library/react'

const mockOrder = {
    orderNo: '00028011',
    status: 'completed',
    creationDate: '2023-02-15T10:15:00.000Z',
    currency: 'USD',
    productItems: [
        {
            productId: 'test-product-1',
            quantity: 2,
            name: 'Test Product 1'
        }
    ]
}

const MockedComponent = (props) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            <button onClick={modalProps.onOpen}>Open Cancel Modal</button>
            <CancelOrderModal {...modalProps} {...props} />
        </Box>
    )
}

afterEach(() => {
    jest.resetModules()
})

test('renders cancel order modal when open', async () => {
    renderWithProviders(<CancelOrderModal isOpen={true} onClose={jest.fn()} order={mockOrder} />)

    // Check modal content
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText(/request cancellation/i)).toHaveLength(2)
})

test('does not render modal when closed', () => {
    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Modal should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/request cancellation/i)).not.toBeInTheDocument()
})

test('renders modal with correct header text', async () => {
    renderWithProviders(<CancelOrderModal isOpen={true} onClose={jest.fn()} order={mockOrder} />)

    // Check header text specifically - look for the modal header within the dialog
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getAllByText(/request cancellation/i)).toHaveLength(2) // Header and button
})

test('renders modal with correct body content', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Open the modal
    const trigger = screen.getByText(/open cancel modal/i)
    await user.click(trigger)

    // Check body content
    expect(screen.getByText(/this is a blank modal for canceling the order/i)).toBeInTheDocument()
})

test('renders request cancellation button', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Open the modal
    const trigger = screen.getByText(/open cancel modal/i)
    await user.click(trigger)

    // Check for request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    expect(requestButton).toBeInTheDocument()
})

test('renders close button (X)', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Open the modal
    const trigger = screen.getByText(/open cancel modal/i)
    await user.click(trigger)

    // Check for close button (usually has aria-label or is recognizable by role)
    const closeButton = screen.getByRole('button', {name: /close/i})
    expect(closeButton).toBeInTheDocument()
})

test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    renderWithProviders(<MockedComponent order={mockOrder} onClose={onClose} />)

    // Open the modal manually by setting isOpen to true
    renderWithProviders(<CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} />)

    // Click close button
    const closeButton = screen.getByRole('button', {name: /close/i})
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
})

test('calls onRequestCancellation when request cancellation button is clicked', async () => {
    const user = userEvent.setup()
    const onRequestCancellation = jest.fn()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={onClose}
            order={mockOrder}
            onRequestCancellation={onRequestCancellation}
        />
    )

    // Click request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    expect(onRequestCancellation).toHaveBeenCalledTimes(1)
    expect(onRequestCancellation).toHaveBeenCalledWith(mockOrder)
})

test('calls onClose when request cancellation button is clicked', async () => {
    const user = userEvent.setup()
    const onRequestCancellation = jest.fn()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={onClose}
            order={mockOrder}
            onRequestCancellation={onRequestCancellation}
        />
    )

    // Click request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    expect(onClose).toHaveBeenCalledTimes(1)
})
