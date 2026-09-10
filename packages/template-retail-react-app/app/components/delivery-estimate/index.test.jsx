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
import usMessages from '@salesforce/retail-react-app/app/static/translations/compiled/en-US.json'

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
        <DeliveryEstimate productId="sku-a" siteId="site-1" defaultCountryCode="US" {...props} />,
        {wrapperProps: {locale: {id: 'en-US'}, messages: usMessages}}
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

        expect(screen.queryByRole('textbox', {name: /country code/i})).not.toBeInTheDocument()
        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

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

    test('uses the localized postcode label and instructions for GB', () => {
        renderWithProviders(
            <DeliveryEstimate productId="sku-a" siteId="site-1" defaultCountryCode="GB" />
        )

        const input = screen.getByRole('textbox', {name: /postcode/i})
        expect(input).toHaveAccessibleDescription(
            'Enter your postcode (e.g. SW1A 1AA) to see delivery estimates.'
        )
    })

    test('clears the previous estimate without persisting an invalid destination', async () => {
        const user = userEvent.setup()
        window.localStorage.setItem(
            'deliveryDestination_site-1',
            JSON.stringify({countryCode: 'US', postalCode: '94105'})
        )
        renderDeliveryEstimate()

        expect(await screen.findByText(/ground/i)).toBeInTheDocument()
        await user.clear(screen.getByRole('textbox', {name: /zip code/i}))
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(screen.getByText(/enter a zip code/i)).toBeInTheDocument()
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveAccessibleDescription(
            'Enter a ZIP code.'
        )
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

    test('announces and prevents duplicate submissions while calculating', async () => {
        window.localStorage.setItem(
            'deliveryDestination_site-1',
            JSON.stringify({countryCode: 'US', postalCode: '94105'})
        )
        useDeliveryEstimates.mockReturnValue({
            data: undefined,
            isError: false,
            isLoading: true,
            isFetching: false
        })
        renderDeliveryEstimate()

        const button = await screen.findByRole('button', {name: 'Calculating...'})
        expect(button).toBeDisabled()
        expect(screen.getByRole('status')).toHaveTextContent('Calculating...')
    })

    test('uses the locale country code when restoring a saved postal code', async () => {
        window.localStorage.setItem(
            'deliveryDestination_site-1',
            JSON.stringify({countryCode: 'US', postalCode: '94105'})
        )
        renderDeliveryEstimate({defaultCountryCode: 'GB'})

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                {
                    parameters: {
                        productIds: ['sku-a'],
                        postalCode: '94105',
                        countryCode: 'GB',
                        siteId: 'site-1'
                    }
                },
                expect.objectContaining({enabled: true})
            )
        })
    })

    test('announces a successful estimate', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

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

            await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
            await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

            expect(await screen.findByText(/ground/i)).toBeInTheDocument()
        } finally {
            Storage.prototype.setItem = originalSetItem
        }
    })

    test('clears an estimate that does not match the newly selected variant', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DeliveryEstimateVariantHarness />)

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))
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

        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByText(/delivery dates unavailable/i)).toBeInTheDocument()
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

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByText(/delivery dates unavailable/i)).toBeInTheDocument()
        expect(screen.queryByText(/insufficient inventory/i)).not.toBeInTheDocument()
    })
})
