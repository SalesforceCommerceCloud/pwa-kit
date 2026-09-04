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
    trackingUrl: 'https://tracking.fedex.com/TRACK-12345'
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

    test('normalizes a scheme-less trackingUrl to an absolute external href (not a relative path)', () => {
        // Without normalization the browser resolves "www.carrier.com/t" relative to the
        // current page; ensureExternalUrl prepends https:// so it points at the carrier.
        renderWithProviders(<OrderTracking {...baseProps} trackingUrl="www.carrier.test/t" />)
        const link = screen.getByRole('link', {name: /TRACK-12345/i})
        expect(link).toHaveAttribute('href', 'https://www.carrier.test/t')
    })

    test('renders the tracking number as plain text (no link) when trackingUrl is absent', () => {
        renderWithProviders(<OrderTracking {...baseProps} trackingUrl={undefined} />)
        expect(screen.queryByRole('link', {name: /TRACK-12345/i})).not.toBeInTheDocument()
        expect(screen.getByText(/TRACK-12345/)).toBeInTheDocument()
    })

    test('renders the tracking number as plain text (no link) when trackingUrl is unsafe', () => {
        // ensureExternalUrl rejects the userinfo spoof -> no href -> plain text, not a link to evil.com
        renderWithProviders(
            <OrderTracking {...baseProps} trackingUrl="https://www.ups.com@evil.com" />
        )
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

    test('renders as a heading-less card (no Shipping Method heading)', () => {
        renderWithProviders(<OrderTracking {...baseProps} />)
        expect(screen.queryByRole('heading', {name: /Shipping Method/i})).not.toBeInTheDocument()
        // The card content still renders
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
        expect(screen.getByTestId('order-tracking-card')).toBeInTheDocument()
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

    test('omits the date line when the delivery date is explicitly null (no "31 Dec 1969")', () => {
        // Regression guard: new Date(null) is the epoch (1970-01-01), NOT Invalid Date,
        // so a null delivery date must be caught by the falsy check — otherwise it would
        // render "31 Dec 1969" to the shopper. (Found in QA.)
        renderWithProviders(
            <OrderTracking {...baseProps} expectedDeliveryDate={null} actualDeliveryDate={null} />
        )
        expect(screen.queryByText(/Expected delivery/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Delivered/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/1969/)).not.toBeInTheDocument()
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument()
        // The rest of the block still renders.
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
    })

    test('omits the date line for a truthy epoch-era sentinel string (no "1 Jan 1970")', () => {
        // A truthy string like "1970-01-01T00:00:00Z" parses to a *valid* Date (unlike
        // null/"" which the falsy check already handles), so without the epoch-year guard
        // it would render "1 Jan 1970" to the shopper. SOM does not currently send such a
        // sentinel, but the guard is cheap insurance if it ever does.
        renderWithProviders(
            <OrderTracking
                {...baseProps}
                expectedDeliveryDate="1970-01-01T00:00:00Z"
                actualDeliveryDate="1970-01-01T00:00:00Z"
            />
        )
        expect(screen.queryByText(/Expected delivery/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Delivered/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument()
        // The rest of the block still renders.
        expect(screen.getByText('FedEx Ground')).toBeInTheDocument()
    })

    test('still renders a legitimate recent date (the epoch guard does not over-suppress)', () => {
        const {container} = renderWithProviders(
            <OrderTracking {...baseProps} expectedDeliveryDate="2026-06-12T00:00:00.000Z" />
        )
        expect(screen.getByText(/Expected delivery/i)).toBeInTheDocument()
        expect(container.textContent).toMatch(/Expected delivery:\s*\d{1,2} Jun 2026/)
    })
})
