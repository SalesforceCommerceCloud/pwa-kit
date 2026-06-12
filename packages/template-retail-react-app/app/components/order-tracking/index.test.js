/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OrderTracking from '@salesforce/retail-react-app/app/components/order-tracking/index'

const baseProps = {
    shippingMethodName: 'FedEx Ground',
    shippingStatus: 'shipped',
    trackingNumber: 'TRACK-12345',
    trackingUrl: 'https://tracking.fedex.com/TRACK-12345',
    shipmentsLength: 1,
    index: 0
}

describe('OrderTracking component', () => {
    test('renders the provider / shipping method name', () => {
        renderWithProviders(<OrderTracking {...baseProps} />)
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
    })

    test('renders a localized shipping status when the status is a known key', () => {
        renderWithProviders(<OrderTracking {...baseProps} shippingStatus="not_shipped" />)
        expect(screen.getByText('Not shipped')).toBeInTheDocument()
    })

    test('falls back to the raw status string for unknown OMS statuses', () => {
        renderWithProviders(<OrderTracking {...baseProps} shippingStatus="DELIVERED" />)
        expect(screen.getByText('DELIVERED')).toBeInTheDocument()
    })

    test('renders the tracking number as an external link to the carrier site when trackingUrl is present (US2)', () => {
        renderWithProviders(<OrderTracking {...baseProps} />)
        const link = screen.getByRole('link', {name: /TRACK-12345/i})
        expect(link).toHaveAttribute('href', 'https://tracking.fedex.com/TRACK-12345')
        // External links open in a new tab
        expect(link).toHaveAttribute('target', '_blank')
    })

    test('renders the tracking number as plain text (no link) when trackingUrl is absent', () => {
        renderWithProviders(<OrderTracking {...baseProps} trackingUrl={undefined} />)
        expect(screen.queryByRole('link', {name: /TRACK-12345/i})).not.toBeInTheDocument()
        expect(screen.getByText(/TRACK-12345/)).toBeInTheDocument()
    })

    test('omits the tracking line entirely when there is no tracking number', () => {
        renderWithProviders(
            <OrderTracking {...baseProps} trackingNumber={undefined} trackingUrl={undefined} />
        )
        expect(screen.queryByText(/Tracking Number/i)).not.toBeInTheDocument()
        // The shipping method still renders
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
    })

    test('renders the unnumbered heading for a single shipment', () => {
        renderWithProviders(<OrderTracking {...baseProps} shipmentsLength={1} index={0} />)
        expect(screen.getByRole('heading', {name: /^Shipping Method$/i})).toBeInTheDocument()
    })

    test('renders a numbered heading when multiple shipments are present', () => {
        renderWithProviders(<OrderTracking {...baseProps} shipmentsLength={2} index={1} />)
        // index is zero-based; heading shows index + 1
        expect(screen.getByRole('heading', {name: /Shipping Method 2/i})).toBeInTheDocument()
    })

    // The date is formatted by locale + timezone (the test IntlProvider is en-GB),
    // so we assert the label + month/year rather than a hardcoded exact string.
    // `expectedDeliveryDate` of June renders as e.g. "11 Jun 2026" (en-GB, day-month-year).
    test('renders the expected delivery date (locale-formatted) when present (AC3)', () => {
        const {container} = renderWithProviders(
            <OrderTracking {...baseProps} expectedDeliveryDate="2026-06-12T00:00:00.000Z" />
        )
        expect(screen.getByText(/Expected delivery/i)).toBeInTheDocument()
        // The formatted date sits in the same <Text> line as the label.
        expect(container.textContent).toMatch(/Expected delivery:\s*\d{1,2} Jun 2026/)
    })

    test('omits the expected-delivery line when no expectedDeliveryDate is present', () => {
        renderWithProviders(<OrderTracking {...baseProps} expectedDeliveryDate={undefined} />)
        expect(screen.queryByText(/Expected delivery/i)).not.toBeInTheDocument()
    })

    test('renders the delivered date (locale-formatted) when actualDeliveryDate is present', () => {
        const {container} = renderWithProviders(
            <OrderTracking {...baseProps} actualDeliveryDate="2026-06-15T00:00:00.000Z" />
        )
        expect(screen.getByText(/Delivered/i)).toBeInTheDocument()
        expect(container.textContent).toMatch(/Delivered:\s*\d{1,2} Jun 2026/)
    })

    test('omits the delivered line when no actualDeliveryDate is present', () => {
        renderWithProviders(<OrderTracking {...baseProps} actualDeliveryDate={undefined} />)
        expect(screen.queryByText(/Delivered/i)).not.toBeInTheDocument()
    })

    test('renders both expected and delivered lines when both dates are present', () => {
        const {container} = renderWithProviders(
            <OrderTracking
                {...baseProps}
                expectedDeliveryDate="2026-06-12T00:00:00.000Z"
                actualDeliveryDate="2026-06-15T00:00:00.000Z"
            />
        )
        expect(screen.getByText(/Expected delivery/i)).toBeInTheDocument()
        expect(screen.getByText(/Delivered/i)).toBeInTheDocument()
        expect(container.textContent).toMatch(/Expected delivery:\s*\d{1,2} Jun 2026/)
        expect(container.textContent).toMatch(/Delivered:\s*\d{1,2} Jun 2026/)
    })

    test('omits the date line for a malformed date string (no "Invalid Date", no throw)', () => {
        renderWithProviders(
            <OrderTracking
                {...baseProps}
                expectedDeliveryDate="not-a-real-date"
                actualDeliveryDate="also-bad"
            />
        )
        // Malformed values must not surface to the shopper or crash the render.
        expect(screen.queryByText(/Expected delivery/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Delivered/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument()
        // The rest of the block still renders.
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
    })
})
