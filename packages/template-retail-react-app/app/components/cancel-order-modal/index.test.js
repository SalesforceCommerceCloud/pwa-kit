/*
 * Copyright (c) 2025, salesforce.com, inc.
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

// Mock the useProducts hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useProducts: jest.fn()
}))

import {useProducts} from '@salesforce/commerce-sdk-react'

const mockOrder = {
    orderNo: '00028011',
    status: 'completed',
    creationDate: '2023-02-15T10:15:00.000Z',
    currency: 'USD',
    productItems: [
        {
            productId: 'test-product-1',
            quantity: 2,
            productName: 'Test Product 1',
            price: 25.0,
            priceAfterItemDiscount: 25.0,
            itemId: 'item-1'
        }
    ]
}

const MockedComponent = (props) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            <button onClick={modalProps.onOpen}>Open Cancel Modal</button>
            <CancelOrderModal {...modalProps} onCancel={jest.fn()} {...props} />
        </Box>
    )
}

beforeEach(() => {
    // Mock useProducts to return empty data by default
    useProducts.mockReturnValue({
        data: undefined, // Return undefined instead of empty object to avoid map errors
        isLoading: false,
        error: null
    })
})

afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
})

test('displays cancellation modal when opened', async () => {
    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={jest.fn()}
            order={mockOrder}
            onCancel={jest.fn()}
        />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText(/request cancellation/i)).toHaveLength(2)
})

test('does not display modal by default', () => {
    renderWithProviders(<MockedComponent order={mockOrder} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/request cancellation/i)).not.toBeInTheDocument()
})

test('display the request cancellation button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Open the modal
    const trigger = screen.getByText(/open cancel modal/i)
    await user.click(trigger)

    // Check for request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    expect(requestButton).toBeInTheDocument()
})

test('displays the close modal button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockedComponent order={mockOrder} />)

    // Open the modal
    const trigger = screen.getByText(/open cancel modal/i)
    await user.click(trigger)

    // Check for close button
    const closeButton = screen.getByRole('button', {name: /close/i})
    expect(closeButton).toBeInTheDocument()
})

test('closes modal when user clicks close button', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    renderWithProviders(<MockedComponent order={mockOrder} onClose={onClose} />)

    // Open the modal
    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={jest.fn()} />
    )

    // Click close button
    const closeButton = screen.getByRole('button', {name: /close/i})
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
})

test('triggers cancellation request when user confirms', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={onCancel} />
    )

    // Click request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledWith(mockOrder, '')
})

test('closes modal after cancellation request', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={onCancel} />
    )

    // Click request cancellation button
    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    expect(onClose).toHaveBeenCalledTimes(1)
})

test('passes order details when requesting cancellation', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={onCancel} />
    )

    const requestButton = screen.getByRole('button', {name: /request cancellation/i})
    await user.click(requestButton)

    // Verify the callback is called with the exact order object
    expect(onCancel).toHaveBeenCalledWith(mockOrder, '')
    expect(onCancel).toHaveBeenCalledTimes(1)
})

describe('Cancellation Reason Dropdown', () => {
    test('displays default cancellation reason', async () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        const menuButton = screen.getByRole('button', {name: /select a cancellation reason/i})
        expect(menuButton).toBeInTheDocument()
    })

    test('opens dropdown menu when clicked', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        const menuButton = screen.getByRole('button', {name: /select a cancellation reason/i})
        await user.click(menuButton)

        expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    test('displays all available cancellation reasons in dropdown', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        const menuButton = screen.getByRole('button', {name: /select a cancellation reason/i})
        await user.click(menuButton)

        // Check for expected cancellation reasons
        expect(
            screen.getByRole('menuitem', {name: /select a cancellation reason/i})
        ).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /item price too high/i})).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /shipping cost too high/i})).toBeInTheDocument()
        expect(
            screen.getByRole('menuitem', {name: /item\(s\) would not arrive on time/i})
        ).toBeInTheDocument()
        expect(
            screen.getByRole('menuitem', {name: /order created by mistake/i})
        ).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /changed my mind/i})).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /no longer needed/i})).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /financial reasons/i})).toBeInTheDocument()
        expect(screen.getByRole('menuitem', {name: /other/i})).toBeInTheDocument()
    })

    test('passes selected reason when cancellation is requested', async () => {
        const user = userEvent.setup()
        const onCancel = jest.fn()
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={onCancel}
            />
        )

        // Select a different reason
        const menuButton = screen.getByRole('button', {name: /select a cancellation reason/i})
        await user.click(menuButton)

        const financialReasonsOption = screen.getByRole('menuitem', {name: /financial reasons/i})
        await user.click(financialReasonsOption)

        // Request cancellation
        const requestButton = screen.getByRole('button', {name: /request cancellation/i})
        await user.click(requestButton)

        expect(onCancel).toHaveBeenCalledWith(mockOrder, 'financial_reasons')
    })

    test('passes empty string when cancellation is requested and no reason is explicitly selected', async () => {
        const user = userEvent.setup()
        const onCancel = jest.fn()

        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={onCancel}
            />
        )

        const requestButton = screen.getByRole('button', {name: /request cancellation/i})
        await user.click(requestButton)
        expect(onCancel).toHaveBeenCalledWith(mockOrder, '')
    })
})

describe('Order Items Display', () => {
    const enhancedMockOrder = {
        ...mockOrder,
        productItems: [
            {
                productId: 'test-product-1',
                quantity: 2,
                productName: 'Test Product 1',
                price: 50.0,
                priceAfterItemDiscount: 50.0,
                itemId: 'item-1'
            },
            {
                productId: 'test-product-2',
                quantity: 1,
                productName: 'Test Product 2',
                price: 75.99,
                priceAfterItemDiscount: 75.99,
                itemId: 'item-2'
            }
        ]
    }

    test('displays all order items', async () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={enhancedMockOrder}
                onCancel={jest.fn()}
            />
        )

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    test('displays product quantities and prices correctly', async () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={enhancedMockOrder}
                onCancel={jest.fn()}
            />
        )

        expect(screen.getByLabelText(/current price US\$50\.00/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/current price US\$75\.99/i)).toBeInTheDocument()
        expect(screen.getByText(/quantity:\s*2/i)).toBeInTheDocument()
        expect(screen.getByText(/quantity:\s*1/i)).toBeInTheDocument()
    })

    test('calculates total price correctly for multiple quantities', async () => {
        const orderWithMultipleQuantities = {
            ...mockOrder,
            productItems: [
                {
                    productId: 'bulk-product',
                    quantity: 5,
                    productName: 'Bulk Product',
                    price: 12.5,
                    priceAfterItemDiscount: 12.5,
                    itemId: 'bulk-item'
                }
            ]
        }

        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={orderWithMultipleQuantities}
                onCancel={jest.fn()}
            />
        )
        expect(screen.getByLabelText(/current price US\$12\.50/i)).toBeInTheDocument()
        expect(screen.getByText(/quantity:\s*5/i)).toBeInTheDocument()
    })

    test('shows modal when there are no product items', async () => {
        const orderWithNoItems = {
            ...mockOrder,
            productItems: []
        }

        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={orderWithNoItems}
                onCancel={jest.fn()}
            />
        )

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.queryByText(/total:/i)).not.toBeInTheDocument()
    })
})
