/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen} from '@testing-library/react'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge/index'

// Builds a minimal order with the given item-level omsData.status values. getOrderDisplayStatus
// reads productItems[*].omsData.status, so that is all the component needs to derive its state.
const orderWithItemStatuses = (...statuses) => ({
    status: 'new',
    productItems: statuses.map((status, i) => ({
        productId: `item-${i}`,
        omsData: {status}
    }))
})

describe('OrderStatusBadge', () => {
    describe('cancelled (red, terminal)', () => {
        test('renders Cancelled when every item is cancelled', () => {
            renderWithProviders(<OrderStatusBadge order={orderWithItemStatuses('canceled')} />)
            expect(screen.getByText('Cancelled')).toBeInTheDocument()
        })

        test('renders Cancelled when cancelFeedback reports success (optimistic)', () => {
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('shipped')}
                    cancelFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Cancelled')).toBeInTheDocument()
        })

        test('cancelled wins over a return state', () => {
            // cancelFeedback success forces cancelled even though an item is returned.
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('returned')}
                    cancelFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Cancelled')).toBeInTheDocument()
            expect(screen.queryByText('Return Complete')).not.toBeInTheDocument()
        })
    })

    describe('return states (neutral gray)', () => {
        test('all items return initiated -> Return Initiated', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('return initiated')} />
            )
            expect(screen.getByText('Return Initiated')).toBeInTheDocument()
        })

        test('some items return initiated -> Partial Return Initiated', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('return initiated', 'shipped')} />
            )
            expect(screen.getByText('Partial Return Initiated')).toBeInTheDocument()
        })

        test('all items returned -> Return Complete', () => {
            renderWithProviders(<OrderStatusBadge order={orderWithItemStatuses('returned')} />)
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
        })

        test('some returned, some delivered -> Partial Return Complete', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('returned', 'delivered')} />
            )
            expect(screen.getByText('Partial Return Complete')).toBeInTheDocument()
        })

        test('cancelled + returned mix shows the return badge, not Cancelled', () => {
            // Cancelled items drop out of the active set, so an order is only Cancelled when EVERY
            // item is cancelled; a cancelled + returned mix is a return.
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('canceled', 'returned')} />
            )
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
            expect(screen.queryByText('Cancelled')).not.toBeInTheDocument()
        })
    })

    describe('optimistic return feedback', () => {
        test('flips to Return Initiated when returnFeedback reports success', () => {
            // The order items do not yet reflect the return (still shipped) -> optimistic label.
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('shipped')}
                    returnFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Return Initiated')).toBeInTheDocument()
        })

        test("the order's real return status takes precedence over the optimistic label", () => {
            // Items already read as fully returned: show Return Complete, not the generic optimistic
            // Return Initiated.
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('returned')}
                    returnFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
            expect(screen.queryByText('Return Initiated')).not.toBeInTheDocument()
        })

        test('a non-success returnFeedback does not flip the badge', () => {
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('shipped')}
                    returnFeedback={{status: 'error'}}
                />
            )
            expect(screen.queryByText('Return Initiated')).not.toBeInTheDocument()
        })
    })

    describe('non-return / fallback (green)', () => {
        test('falls back to the raw order.status when no item-level OMS status resolves a state', () => {
            renderWithProviders(<OrderStatusBadge order={{status: 'new', productItems: []}} />)
            expect(screen.getByText('new')).toBeInTheDocument()
        })

        test('falls back to omsData.status when order.status is absent', () => {
            renderWithProviders(
                <OrderStatusBadge order={{omsData: {status: 'Created'}, productItems: []}} />
            )
            expect(screen.getByText('Created')).toBeInTheDocument()
        })
    })
})
