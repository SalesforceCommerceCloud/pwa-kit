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

// The badge forwards its resolved colorScheme onto the underlying <span> as `data-color-scheme`,
// giving tests a stable assertion target without coupling to Chakra's generated class hashes.
const expectBadgeColorScheme = (scheme) =>
    expect(screen.getByTestId('order-status-badge')).toHaveAttribute('data-color-scheme', scheme)

describe('OrderStatusBadge', () => {
    describe('cancelled (red, terminal)', () => {
        test('renders Cancelled when every item is cancelled', () => {
            renderWithProviders(<OrderStatusBadge order={orderWithItemStatuses('canceled')} />)
            expect(screen.getByText('Canceled')).toBeInTheDocument()
            expectBadgeColorScheme('red')
        })

        test('renders Cancelled when cancelFeedback reports success (optimistic)', () => {
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('shipped')}
                    cancelFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Canceled')).toBeInTheDocument()
            expectBadgeColorScheme('red')
        })

        test('cancelled wins over a terminal return state', () => {
            // cancelFeedback success forces cancelled even though an item is returned.
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('returned')}
                    cancelFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Canceled')).toBeInTheDocument()
            expect(screen.queryByText('Return Complete')).not.toBeInTheDocument()
            expectBadgeColorScheme('red')
        })

        test('cancelled wins over an in-progress return state', () => {
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('return initiated')}
                    cancelFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Canceled')).toBeInTheDocument()
            expect(screen.queryByText('Return Initiated')).not.toBeInTheDocument()
            expectBadgeColorScheme('red')
        })
    })

    describe('return in-progress states (blue)', () => {
        test('all items return initiated -> Return Initiated (blue)', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('return initiated')} />
            )
            expect(screen.getByText('Return Initiated')).toBeInTheDocument()
            expectBadgeColorScheme('blue')
        })

        test('some items return initiated -> Partial Return Initiated (blue)', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('return initiated', 'shipped')} />
            )
            expect(screen.getByText('Partial Return Initiated')).toBeInTheDocument()
            expectBadgeColorScheme('blue')
        })
    })

    describe('return complete states (gray)', () => {
        test('all items returned -> Return Complete (gray)', () => {
            renderWithProviders(<OrderStatusBadge order={orderWithItemStatuses('returned')} />)
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
            expectBadgeColorScheme('gray')
        })

        test('some returned, some delivered -> Partial Return Complete (gray)', () => {
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('returned', 'delivered')} />
            )
            expect(screen.getByText('Partial Return Complete')).toBeInTheDocument()
            expectBadgeColorScheme('gray')
        })

        test('cancelled + returned mix shows the return badge, not Cancelled', () => {
            // Cancelled items drop out of the active set, so an order is only Cancelled when EVERY
            // item is cancelled; a cancelled + returned mix is a return.
            renderWithProviders(
                <OrderStatusBadge order={orderWithItemStatuses('canceled', 'returned')} />
            )
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
            expect(screen.queryByText('Canceled')).not.toBeInTheDocument()
            expectBadgeColorScheme('gray')
        })
    })

    describe('optimistic return feedback', () => {
        test('flips to Return Initiated (blue) when returnFeedback reports success', () => {
            // The order items do not yet reflect the return (still shipped) -> optimistic label.
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('shipped')}
                    returnFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Return Initiated')).toBeInTheDocument()
            expectBadgeColorScheme('blue')
        })

        test("the order's real return status takes precedence over the optimistic label", () => {
            // Items already read as fully returned: show Return Complete (gray), not the generic
            // optimistic Return Initiated (blue).
            renderWithProviders(
                <OrderStatusBadge
                    order={orderWithItemStatuses('returned')}
                    returnFeedback={{status: 'success'}}
                />
            )
            expect(screen.getByText('Return Complete')).toBeInTheDocument()
            expect(screen.queryByText('Return Initiated')).not.toBeInTheDocument()
            expectBadgeColorScheme('gray')
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
            expectBadgeColorScheme('green')
        })

        test('falls back to omsData.status when order.status is absent', () => {
            renderWithProviders(
                <OrderStatusBadge order={{omsData: {status: 'Created'}, productItems: []}} />
            )
            expect(screen.getByText('Created')).toBeInTheDocument()
            expectBadgeColorScheme('green')
        })
    })
})
