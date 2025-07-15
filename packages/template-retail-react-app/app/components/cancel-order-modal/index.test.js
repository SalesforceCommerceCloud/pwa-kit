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
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText(/request cancellation/i)).toHaveLength(2)
})

test('does not render modal when closed', () => {
    renderWithProviders(<MockedComponent order={mockOrder} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/request cancellation/i)).not.toBeInTheDocument()
})

test('renders modal with correct header text', async () => {
    renderWithProviders(<CancelOrderModal isOpen={true} onClose={jest.fn()} order={mockOrder} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getAllByText(/request cancellation/i)).toHaveLength(2)
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

    // Check for close button
    const closeButton = screen.getByRole('button', {name: /close/i})
    expect(closeButton).toBeInTheDocument()
})

test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    renderWithProviders(<MockedComponent order={mockOrder} onClose={onClose} />)

    // Open the modal
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

test('component works correctly with all required props provided', async () => {
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

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /request cancellation/i})).toBeInTheDocument()
})

test('onRequestCancellation is called with correct order parameter', async () => {
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

    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    // Verify the callback is called with the exact order object
    expect(onRequestCancellation).toHaveBeenCalledWith(mockOrder)
    expect(onRequestCancellation).toHaveBeenCalledTimes(1)
})

test('both onRequestCancellation and onClose are called in correct order', async () => {
    const user = userEvent.setup()
    const onRequestCancellation = jest.fn()
    const onClose = jest.fn()
    const callOrder = []

    // Track call order
    onRequestCancellation.mockImplementation(() => callOrder.push('onRequestCancellation'))
    onClose.mockImplementation(() => callOrder.push('onClose'))

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={onClose}
            order={mockOrder}
            onRequestCancellation={onRequestCancellation}
        />
    )

    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    // Verify both functions are called and in the correct order
    expect(callOrder).toEqual(['onRequestCancellation', 'onClose'])
})
