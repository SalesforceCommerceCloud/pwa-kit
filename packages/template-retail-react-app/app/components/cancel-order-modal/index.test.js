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

const MockedComponent = (props) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            <button onClick={modalProps.onOpen}>Open Cancel Modal</button>
            <CancelOrderModal {...modalProps} onCancel={jest.fn()} order={mockOrder} {...props} />
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
        />
    )
    expect(screen.getByText(/select a reason and confirm cancellation/i)).toBeInTheDocument()
    expect(screen.getByText(/this cancels the entire order/i)).toBeInTheDocument()
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
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={jest.fn()} />
    )

    await user.click(screen.getByRole('button', {name: /close/i}))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('closes modal when user clicks Keep order', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={onClose} order={mockOrder} onCancel={jest.fn()} />
    )

    await user.click(screen.getByRole('button', {name: /keep order/i}))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('triggers cancellation when user clicks Confirm cancellation', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()

    renderWithProviders(
        <CancelOrderModal isOpen={true} onClose={jest.fn()} order={mockOrder} onCancel={onCancel} />
    )

    await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
    expect(onCancel).toHaveBeenCalledWith(mockOrder, '')
})

describe('Cancellation Reason Select', () => {
    test('displays reason select with placeholder', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
        expect(screen.getByText(/select a cancellation reason/i)).toBeInTheDocument()
    })

    test('displays all available cancellation reasons as options', () => {
        renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={jest.fn()}
                order={mockOrder}
                onCancel={jest.fn()}
            />
        )

        expect(screen.getByRole('option', {name: /item price too high/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /shipping cost too high/i})).toBeInTheDocument()
        expect(
            screen.getByRole('option', {name: /item\(s\) would not arrive on time/i})
        ).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /order created by mistake/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /changed my mind/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /no longer needed/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /financial reasons/i})).toBeInTheDocument()
        expect(screen.getByRole('option', {name: /other/i})).toBeInTheDocument()
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
            />
        )

        const select = screen.getByRole('combobox')
        await user.selectOptions(select, 'financial_reasons')

        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        expect(onCancel).toHaveBeenCalledWith(mockOrder, 'financial_reasons')
    })

    test('passes empty string when no reason is selected', async () => {
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

    test('resets selected reason when modal closes', () => {
        const onClose = jest.fn()
        const onCancel = jest.fn()
        const {rerender} = renderWithProviders(
            <CancelOrderModal
                isOpen={true}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
            />
        )

        const select = screen.getByRole('combobox')
        expect(select.value).toBe('')

        rerender(
            <CancelOrderModal
                isOpen={false}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
            />
        )

        rerender(
            <CancelOrderModal
                isOpen={true}
                onClose={onClose}
                order={mockOrder}
                onCancel={onCancel}
            />
        )

        expect(screen.getByRole('combobox').value).toBe('')
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
            />
        )

        const select = screen.getByRole('combobox')
        expect(select).toHaveAttribute('id', 'cancel-reason-select')
        const label = document.querySelector('label[for="cancel-reason-select"]')
        expect(label).toBeInTheDocument()
        expect(label).toHaveTextContent('Reason')
    })
})
