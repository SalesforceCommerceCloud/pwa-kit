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

const mockOrder = {
    orderNo: '00028011',
    status: 'created',
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

const mockReasonCodes = [
    {reason: 'Not specified', default: true},
    {reason: 'Defect', default: false},
    {reason: 'Wrong item', default: false},
    {reason: 'Changed my mind', default: false}
]

const MockedComponent = (props) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            <button onClick={modalProps.onOpen}>Open Cancel Modal</button>
            <CancelOrderModal
                {...modalProps}
                onCancel={jest.fn()}
                order={mockOrder}
                reasonCodes={mockReasonCodes}
                {...props}
            />
        </Box>
    )
}

afterEach(() => {
    jest.clearAllMocks()
})

test('does not display modal by default', () => {
    renderWithProviders(<MockedComponent />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('displays modal with correct title when opened', () => {
    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={jest.fn()}
            order={mockOrder}
            onCancel={jest.fn()}
            reasonCodes={mockReasonCodes}
        />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/cancel order 00028011/i)).toBeInTheDocument()
})

test('displays description and impact text', () => {
    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={jest.fn()}
            order={mockOrder}
            onCancel={jest.fn()}
            reasonCodes={mockReasonCodes}
        />
    )
    expect(screen.getByText(/select a reason and confirm cancellation/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel the entire order/i)).toBeInTheDocument()
})

test('displays the close button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockedComponent />)

    await user.click(screen.getByText(/open cancel modal/i))

    expect(screen.getByRole('button', {name: /close/i})).toBeInTheDocument()
})

test('closes modal when user clicks close button', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={onClose}
            order={mockOrder}
            onCancel={jest.fn()}
            reasonCodes={mockReasonCodes}
        />
    )

    await user.click(screen.getByRole('button', {name: /close/i}))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('closes modal when user clicks Keep order', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={onClose}
            order={mockOrder}
            onCancel={jest.fn()}
            reasonCodes={mockReasonCodes}
        />
    )

    await user.click(screen.getByRole('button', {name: /keep order/i}))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('triggers cancellation with default reason when user clicks Confirm cancellation', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()

    renderWithProviders(
        <CancelOrderModal
            isOpen={true}
            onClose={jest.fn()}
            order={mockOrder}
            onCancel={onCancel}
            reasonCodes={mockReasonCodes}
        />
    )

    await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
    expect(onCancel).toHaveBeenCalledWith(mockOrder, 'Not specified')
})

describe('Metadata API failure scenarios', () => {
    test('hides reason dropdown when no reason codes provided (API failed)', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
        expect(document.querySelector('label[for="cancel-reason-select"]')).not.toBeInTheDocument()
    })

    test('hides reason dropdown when reason codes is undefined', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
                reasonCodes={undefined}
            />
        )

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    test('hides reason dropdown when reason codes is empty array', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
                reasonCodes={[]}
            />
        )

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    test('confirm button remains enabled when reason codes unavailable', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        const confirmButton = screen.getByRole('button', {name: /confirm cancellation/i})
        expect(confirmButton).not.toBeDisabled()
    })

    test('passes empty string when metadata failed and confirm is clicked', async () => {
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

        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        expect(onCancel).toHaveBeenCalledWith(mockOrder, '')
    })

    test('still shows modal title, description, and impact text when metadata failed', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        expect(screen.getByText(/cancel order 00028011/i)).toBeInTheDocument()
        expect(screen.getByText(/confirm cancellation below/i)).toBeInTheDocument()
        expect(screen.getByText(/cancel the entire order/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /keep order/i})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
    })
})

describe('Cancellation Reason Select', () => {
    test('displays reason select with placeholder', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
                reasonCodes={mockReasonCodes}
            />
        )

        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
        expect(screen.getByText(/select a cancellation reason/i)).toBeInTheDocument()
    })

    test('displays all reason codes as options', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
                reasonCodes={mockReasonCodes}
            />
        )

        expect(screen.getByRole('option', {name: /not specified/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /defect/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /wrong item/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /changed my mind/i})).toBeInTheDocument()
    })

    test('passes selected reason when cancellation is confirmed', async () => {
        const user = userEvent.setup()
        const onCancel = jest.fn()

        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={onCancel}
                reasonCodes={mockReasonCodes}
            />
        )

        const select = screen.getByRole('combobox')
        await user.selectOptions(select, 'Changed my mind')

        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        expect(onCancel).toHaveBeenCalledWith(mockOrder, 'Changed my mind')
    })

    test('resets selected reason to default when modal closes and reopens', () => {
        const onClose = jest.fn()
        const onCancel = jest.fn()
        const {rerender} = renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
                reasonCodes={mockReasonCodes}
            />
        )

        const select = screen.getByRole('combobox')
        // Default reason is pre-selected
        expect(select.value).toBe('Not specified')

        rerender(
            <CancelOrderModal
                isOpen={false}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
                reasonCodes={mockReasonCodes}
            />
        )

        rerender(
            <CancelOrderModal
                isOpen={true}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
                reasonCodes={mockReasonCodes}
            />
        )

        // After close and reopen, default reason is re-selected
        expect(screen.getByRole('combobox').value).toBe('Not specified')
    })
})

describe('Accessibility', () => {
    test('reason select has an associated label', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
                reasonCodes={mockReasonCodes}
            />
        )

        const select = screen.getByRole('combobox')
        expect(select).toHaveAttribute('id', 'cancel-reason-select')
        const label = document.querySelector('label[for="cancel-reason-select"]')
        expect(label).toBeInTheDocument()
        expect(label).toHaveTextContent('Reason')
    })
})
