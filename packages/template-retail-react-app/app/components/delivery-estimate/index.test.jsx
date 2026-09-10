/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useDeliveryEstimates} from '@salesforce/commerce-sdk-react'
import DeliveryEstimate from '@salesforce/retail-react-app/app/components/delivery-estimate'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {...actual, useDeliveryEstimates: jest.fn()}
})

const deliveryResult = {
    productDeliveryEstimates: [
        {
            productId: 'sku-a',
            shippingOptions: [
                {
                    shippingMethodId: 'express',
                    name: 'Express',
                    price: 12,
                    currency: 'USD',
                    deliveryWindow: {
                        startAt: '2026-09-15T14:00:00Z',
                        endAt: '2026-09-16T14:00:00Z'
                    }
                },
                {
                    shippingMethodId: 'ground',
                    name: 'Ground',
                    price: 5,
                    currency: 'USD',
                    deliveryWindow: {
                        startAt: '2026-09-16T14:00:00Z',
                        endAt: '2026-09-18T14:00:00Z'
                    }
                }
            ]
        }
    ]
}

const renderDeliveryEstimate = (props = {}) => {
    return renderWithProviders(
        <DeliveryEstimate productId="sku-a" siteId="site-1" defaultCountryCode="US" {...props} />
    )
}

const DeliveryEstimateVariantHarness = () => {
    const [productId, setProductId] = React.useState('sku-a')

    return (
        <>
            <button type="button" onClick={() => setProductId('sku-b')}>
                Select SKU B
            </button>
            <DeliveryEstimate productId={productId} siteId="site-1" defaultCountryCode="US" />
        </>
    )
}

describe('DeliveryEstimate', () => {
    beforeEach(() => {
        window.localStorage.clear()
        useDeliveryEstimates.mockReturnValue({
            data: deliveryResult,
            isError: false,
            isLoading: false,
            isFetching: false,
            refetch: jest.fn()
        })
    })

    afterEach(() => jest.clearAllMocks())

    test('submits a valid destination and displays the lowest-price estimate', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                {
                    parameters: {
                        productIds: ['sku-a'],
                        postalCode: '94105',
                        countryCode: 'US',
                        siteId: 'site-1'
                    }
                },
                expect.objectContaining({enabled: true})
            )
        })
        expect(await screen.findByText(/ground/i)).toBeInTheDocument()
        expect(screen.queryByText(/express/i)).not.toBeInTheDocument()
        expect(JSON.parse(window.localStorage.getItem('deliveryDestination_site-1'))).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    test('clears the previous estimate without persisting an invalid destination', async () => {
        const user = userEvent.setup()
        window.localStorage.setItem(
            'deliveryDestination_site-1',
            JSON.stringify({countryCode: 'US', postalCode: '94105'})
        )
        renderDeliveryEstimate()

        expect(await screen.findByText(/ground/i)).toBeInTheDocument()
        await user.clear(screen.getByRole('textbox', {name: /postal code/i}))
        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        expect(screen.getByText(/enter a postal code/i)).toBeInTheDocument()
        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
        expect(screen.queryByText(/ground/i)).not.toBeInTheDocument()
        expect(JSON.parse(window.localStorage.getItem('deliveryDestination_site-1'))).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    test('does not request when the country code is invalid', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.clear(screen.getByRole('textbox', {name: /country code/i}))
        await user.type(screen.getByRole('textbox', {name: /country code/i}), 'U')
        await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        expect(screen.getByText(/enter a valid country code/i)).toBeInTheDocument()
        expect(useDeliveryEstimates).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({enabled: false})
        )
    })

    test('announces a successful estimate', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        expect(await screen.findByRole('status')).toHaveTextContent(/ground/i)
    })

    test('displays an estimate when browser storage cannot persist the destination', async () => {
        const user = userEvent.setup()
        const storageError = new Error('Storage unavailable')
        const originalSetItem = Storage.prototype.setItem
        Storage.prototype.setItem = jest.fn(() => {
            throw storageError
        })

        try {
            renderDeliveryEstimate()

            await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
            await user.click(screen.getByRole('button', {name: /check delivery/i}))

            expect(await screen.findByText(/ground/i)).toBeInTheDocument()
        } finally {
            Storage.prototype.setItem = originalSetItem
        }
    })

    test('clears an estimate that does not match the newly selected variant', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DeliveryEstimateVariantHarness />)

        await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /check delivery/i}))
        expect(await screen.findByText(/ground/i)).toBeInTheDocument()

        await user.click(screen.getByRole('button', {name: /select sku b/i}))

        expect(screen.queryByText(/ground/i)).not.toBeInTheDocument()
    })

    test('keeps a saved destination when the provider returns no eligible option', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {productDeliveryEstimates: []},
            isError: false,
            isLoading: false,
            isFetching: false
        })
        window.localStorage.setItem(
            'deliveryDestination_site-1',
            JSON.stringify({countryCode: 'US', postalCode: '94105'})
        )
        renderDeliveryEstimate()

        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        expect(await screen.findByText(/unavailable for this destination/i)).toBeInTheDocument()
        expect(JSON.parse(window.localStorage.getItem('deliveryDestination_site-1'))).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    test('does not expose non-delivery provider reasons to shoppers', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {
                productDeliveryEstimates: [
                    {
                        productId: 'sku-a',
                        shippingOptions: [
                            {
                                shippingMethodId: 'ground',
                                nonDeliverableReason: 'INSUFFICIENT_INVENTORY'
                            }
                        ]
                    }
                ]
            },
            isError: false,
            isLoading: false,
            isFetching: false
        })
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /postal code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /check delivery/i}))

        expect(await screen.findByText(/unavailable for this destination/i)).toBeInTheDocument()
        expect(screen.queryByText(/insufficient inventory/i)).not.toBeInTheDocument()
    })
})
