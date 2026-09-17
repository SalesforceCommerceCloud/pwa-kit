/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useDeliveryEstimates, useProduct} from '@salesforce/commerce-sdk-react'
import {getDefaultCookieAttributes} from '@salesforce/commerce-sdk-react/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import DeliveryEstimate from '@salesforce/retail-react-app/app/components/delivery-estimate'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import usMessages from '@salesforce/retail-react-app/app/static/translations/compiled/en-US.json'
import deMessages from '@salesforce/retail-react-app/app/static/translations/compiled/de-DE.json'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {...actual, useDeliveryEstimates: jest.fn(), useProduct: jest.fn()}
})

jest.mock('@salesforce/commerce-sdk-react/utils', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react/utils'),
    getDefaultCookieAttributes: jest.fn(() => ({secure: false, sameSite: 'Lax'}))
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn()
}))

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

const DeliveryEstimateResultContainerHarness = () => {
    const [resultContainer, setResultContainer] = React.useState(null)

    return (
        <>
            <div ref={setResultContainer} data-testid="delivery-estimate-result-container" />
            <DeliveryEstimate
                productId="sku-a"
                siteId="site-1"
                defaultCountryCode="US"
                resultContainer={resultContainer}
                showResultInCard={false}
            />
        </>
    )
}

const setDeliveryDestinationCookie = (destination) => {
    document.cookie = `deliveryZipCode_site-1=${encodeURIComponent(
        JSON.stringify(destination)
    )}; Path=/`
}

const getDeliveryDestinationCookieValue = () => {
    const cookie = document.cookie
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith('deliveryZipCode_site-1='))

    return cookie?.slice('deliveryZipCode_site-1='.length)
}

describe('DeliveryEstimate', () => {
    beforeEach(() => {
        document.cookie = 'deliveryZipCode_site-1=; Max-Age=0; path=/'
        getConfig.mockReturnValue(mockConfig)
        getDefaultCookieAttributes.mockReturnValue({secure: false, sameSite: 'Lax'})
        useCurrentCustomer.mockReturnValue({data: {isRegistered: false}})
        useDeliveryEstimates.mockReturnValue({
            data: deliveryResult,
            isError: false,
            isLoading: false,
            isFetching: false,
            refetch: jest.fn()
        })
        useProduct.mockReturnValue({data: undefined})
    })

    afterEach(() => jest.clearAllMocks())

    test('submits a valid destination and displays the fastest delivery window', async () => {
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
        expect(
            await screen.findByText('Arrives Tue, Sep 15 \u2013 Wed, Sep 16')
        ).toBeInTheDocument()
        expect(screen.queryByText(/ground/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/express/i)).not.toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'More Delivery Options'})).toHaveStyle(
            'text-decoration: underline'
        )
        await user.click(screen.getByRole('button', {name: 'More Delivery Options'}))
        const shippingOptions = await screen.findByRole('dialog', {name: 'Shipping Options'})
        expect(within(shippingOptions).getByText('Ground')).toBeInTheDocument()
        expect(within(shippingOptions).getByText('Express')).toBeInTheDocument()
        expect(within(shippingOptions).getByText('$5.00')).toBeInTheDocument()
        expect(within(shippingOptions).getByText('$12.00')).toBeInTheDocument()
        expect(decodeURIComponent(getDeliveryDestinationCookieValue())).toBe(
            JSON.stringify({postalCode: '94105', countryCode: 'US'})
        )
        expect(getDefaultCookieAttributes).toHaveBeenCalled()
    })

    test('includes years in delivery windows that cross New Year', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {
                productDeliveryEstimates: [
                    {
                        productId: 'sku-a',
                        shippingOptions: [
                            {
                                shippingMethodId: 'ground',
                                deliveryWindow: {
                                    startAt: '2026-12-30T14:00:00Z',
                                    endAt: '2027-01-03T14:00:00Z'
                                }
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

        expect(
            await screen.findByText('Arrives Wed, Dec 30, 2026 \u2013 Sun, Jan 3, 2027')
        ).toBeInTheDocument()
    })

    test('uses the localized postcode label, example, and instructions for GB', () => {
        renderWithProviders(
            <DeliveryEstimate productId="sku-a" siteId="site-1" defaultCountryCode="GB" />
        )

        const input = screen.getByRole('textbox', {name: /postcode/i})
        expect(input).toHaveAttribute('placeholder', 'Enter postcode (e.g. SW1A 1AA)')
        expect(input).toHaveAccessibleDescription(
            'Enter your postcode (e.g. SW1A 1AA) to see delivery estimates.'
        )
    })

    test('falls back to default delivery-estimate messages for untranslated locales', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation()

        try {
            renderWithProviders(
                <DeliveryEstimate productId="sku-a" siteId="site-1" defaultCountryCode="DE" />,
                {wrapperProps: {locale: {id: 'de-DE'}, messages: deMessages}}
            )

            expect(
                screen.getByRole('region', {name: 'Estimated Delivery Date'})
            ).toBeInTheDocument()
            expect(screen.getByRole('textbox', {name: 'postal code'})).toHaveAttribute(
                'placeholder',
                'Enter postal code (e.g. 10115)'
            )
            expect(
                screen.getByRole('button', {name: 'Calculate delivery estimate'})
            ).toHaveTextContent('Calculate')
        } finally {
            consoleError.mockRestore()
        }
    })

    test('renders the estimator as an accessible delivery section', () => {
        renderDeliveryEstimate()

        const section = screen.getByRole('region', {name: 'Estimated Delivery Date'})

        expect(within(section).getByRole('textbox', {name: /zip code/i})).toBeInTheDocument()
        expect(
            within(section).getByRole('button', {name: /calculate delivery estimate/i})
        ).toBeEnabled()
    })

    test('clears the previous estimate without persisting an invalid destination', async () => {
        const user = userEvent.setup()
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        renderDeliveryEstimate()

        expect(await screen.findByTestId('delivery-estimate-result')).toHaveTextContent(/arrives/i)
        await user.clear(screen.getByRole('textbox', {name: /zip code/i}))
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(screen.getByText(/enter a valid zip code/i)).toBeInTheDocument()
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveAccessibleDescription(
            'Enter a valid ZIP code (e.g. 90210).'
        )
        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
        expect(screen.queryByTestId('delivery-estimate-result')).not.toBeInTheDocument()
        expect(decodeURIComponent(getDeliveryDestinationCookieValue())).toBe(
            JSON.stringify({postalCode: '94105', countryCode: 'US'})
        )
    })

    test('prevents duplicate submissions while calculating', async () => {
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        useDeliveryEstimates.mockReturnValue({
            data: undefined,
            isError: false,
            isLoading: true,
            isFetching: false
        })
        renderDeliveryEstimate()

        const button = await screen.findByRole('button', {name: 'Calculating...'})
        expect(button).toBeDisabled()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    test('retains the structured delivery destination cookie country when the locale changes', async () => {
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        renderDeliveryEstimate({defaultCountryCode: 'GB'})

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
    })

    test('uses a legacy delivery ZIP code cookie', async () => {
        document.cookie = 'deliveryZipCode_site-1=94105; path=/'
        renderDeliveryEstimate()

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
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveValue('94105')
    })

    test('uses a registered shopper preferred shipping address without persisting it', async () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: true,
                addresses: [
                    {
                        addressId: 'billing-address',
                        countryCode: 'US',
                        postalCode: '10001',
                        preferred: true
                    },
                    {
                        addressId: 'shipping-address',
                        countryCode: 'CA',
                        postalCode: 'm5v3a8',
                        preferred: true
                    }
                ]
            }
        })
        renderDeliveryEstimate()

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                {
                    parameters: {
                        productIds: ['sku-a'],
                        postalCode: 'M5V 3A8',
                        countryCode: 'CA',
                        siteId: 'site-1'
                    }
                },
                expect.objectContaining({enabled: true})
            )
        })
        expect(screen.getByRole('textbox', {name: /postal code/i})).toHaveValue('M5V 3A8')
        expect(getDeliveryDestinationCookieValue()).toBeUndefined()
    })

    test('prefers a saved delivery destination over a registered shopper address', async () => {
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        useCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: true,
                addresses: [
                    {
                        addressId: 'shipping-address',
                        countryCode: 'CA',
                        postalCode: 'M5V3A8',
                        preferred: true
                    }
                ]
            }
        })
        renderDeliveryEstimate()

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
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveValue('94105')
    })

    test('does not use a guest shopper address as the delivery destination', async () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: false,
                addresses: [
                    {
                        addressId: 'guest-address',
                        countryCode: 'US',
                        postalCode: '94105'
                    }
                ]
            }
        })
        renderDeliveryEstimate()

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveValue('')
    })

    test('ignores malformed delivery destination cookies', async () => {
        document.cookie = 'deliveryZipCode_site-1=%7Bbad; path=/'
        renderDeliveryEstimate()

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
        expect(screen.getByRole('textbox', {name: /zip code/i})).toHaveValue('')
    })

    test('uses the configured cookie domain and preview cookie attributes', async () => {
        const cookieSetter = jest.spyOn(Document.prototype, 'cookie', 'set')
        try {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    commerceAPI: {...mockConfig.app.commerceAPI, cookieDomain: '.example.com'}
                }
            })
            getDefaultCookieAttributes.mockReturnValue({secure: true, sameSite: 'none'})
            const user = userEvent.setup()
            renderDeliveryEstimate()

            await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
            await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

            await waitFor(() => {
                expect(cookieSetter).toHaveBeenCalledWith(
                    expect.stringContaining('deliveryZipCode_site-1=')
                )
            })
            expect(cookieSetter).toHaveBeenLastCalledWith(
                expect.stringContaining(
                    'Domain=.example.com; Path=/; Max-Age=2592000; Secure; SameSite=none; Partitioned'
                )
            )
        } finally {
            cookieSetter.mockRestore()
        }
    })

    test('announces a successful estimate', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByRole('status')).toHaveTextContent(/arrives/i)
    })

    test('moves focus to a shopper-initiated estimate', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate()

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        await waitFor(() => {
            expect(screen.getByTestId('delivery-estimate-result')).toHaveFocus()
        })
    })

    test('normalizes postal codes and rejects values invalid for the locale country', async () => {
        const user = userEvent.setup()
        renderDeliveryEstimate({defaultCountryCode: 'GB'})

        const input = screen.getByRole('textbox', {name: /postcode/i})
        await user.type(input, 'sw1a1aa')
        expect(input).toHaveValue('SW1A 1AA')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    parameters: expect.objectContaining({postalCode: 'SW1A 1AA', countryCode: 'GB'})
                }),
                expect.objectContaining({enabled: true})
            )
        })

        await user.clear(input)
        await user.type(input, '12345')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(screen.getByText(/enter a valid postcode/i)).toBeInTheDocument()
        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
    })

    test('clears a displayed estimate when the shopper edits its destination', async () => {
        const user = userEvent.setup()
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        renderDeliveryEstimate()

        expect(await screen.findByTestId('delivery-estimate-result')).toBeInTheDocument()
        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '1')

        expect(screen.queryByTestId('delivery-estimate-result')).not.toBeInTheDocument()
        await waitFor(() => {
            expect(useDeliveryEstimates).toHaveBeenLastCalledWith(
                expect.any(Object),
                expect.objectContaining({enabled: false})
            )
        })
    })

    test('renders a completed estimate in the supplied fulfillment option container', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DeliveryEstimateResultContainerHarness />)

        const calculator = screen.getByRole('region', {name: 'Estimated Delivery Date'})
        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        const result = await screen.findByTestId('delivery-estimate-result')
        expect(screen.getByTestId('delivery-estimate-result-container')).toContainElement(result)
        expect(calculator).not.toContainElement(result)
    })

    test('reports a saved resolved destination while its calculator and result are hidden', async () => {
        const onResolvedDestination = jest.fn()
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        renderDeliveryEstimate({
            showCalculator: false,
            showResult: false,
            onResolvedDestination
        })

        expect(
            screen.queryByRole('region', {name: 'Estimated Delivery Date'})
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId('delivery-estimate-result')).not.toBeInTheDocument()

        await waitFor(() => {
            expect(onResolvedDestination).toHaveBeenCalledWith({
                countryCode: 'US',
                postalCode: '94105'
            })
        })
    })

    test('clears an estimate that does not match the newly selected variant', async () => {
        const user = userEvent.setup()
        renderWithProviders(<DeliveryEstimateVariantHarness />)

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))
        expect(await screen.findByTestId('delivery-estimate-result')).toHaveTextContent(/arrives/i)

        await user.click(screen.getByRole('button', {name: /select sku b/i}))

        expect(screen.queryByTestId('delivery-estimate-result')).not.toBeInTheDocument()
    })

    test('keeps a saved destination when the provider returns no eligible option', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {productDeliveryEstimates: []},
            isError: false,
            isLoading: false,
            isFetching: false
        })
        setDeliveryDestinationCookie({postalCode: '94105', countryCode: 'US'})
        renderDeliveryEstimate()

        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByText(/delivery dates unavailable/i)).toBeInTheDocument()
        expect(decodeURIComponent(getDeliveryDestinationCookieValue())).toBe(
            JSON.stringify({postalCode: '94105', countryCode: 'US'})
        )
    })

    test('shows unavailable guidance in the calculator when a fulfillment-option lookup returns 403', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: undefined,
            error: {response: {status: 403}},
            isError: true,
            isLoading: false,
            isFetching: false
        })
        renderDeliveryEstimate({showResult: false})

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Delivery dates unavailable. See checkout for options and costs.'
        )
    })

    test('uses the catalog delivery description for a 403 delivery-estimate response', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: undefined,
            error: {response: {status: 403}},
            isError: true,
            isLoading: false,
            isFetching: false
        })
        useProduct.mockReturnValue({
            data: {
                shippingMethods: [
                    {id: '005', c_storePickupEnabled: true, description: 'Ready for pickup today'},
                    {id: '001', description: 'Order received within 7-10 business days'}
                ]
            }
        })
        renderDeliveryEstimate({showResult: false})

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Order received within 7-10 business days'
        )
        expect(useProduct).toHaveBeenLastCalledWith(
            {
                parameters: {
                    id: 'sku-a',
                    expand: ['shipping_methods']
                }
            },
            {enabled: true}
        )
    })

    test('uses the catalog delivery description for a 500 delivery-estimate response', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: undefined,
            error: {response: {status: 500}},
            isError: true,
            isLoading: false,
            isFetching: false
        })
        useProduct.mockReturnValue({
            data: {
                shippingMethods: [
                    {id: '001', description: 'Order received within 7-10 business days'}
                ]
            }
        })
        renderDeliveryEstimate({showResult: false})

        expect(useProduct).toHaveBeenLastCalledWith(
            {
                parameters: {
                    id: undefined,
                    expand: undefined
                }
            },
            {enabled: false}
        )

        await user.type(screen.getByRole('textbox', {name: /zip code/i}), '94105')
        await user.click(screen.getByRole('button', {name: /calculate delivery estimate/i}))

        expect(await screen.findByRole('status')).toHaveTextContent(
            'Order received within 7-10 business days'
        )
        expect(useProduct).toHaveBeenLastCalledWith(
            {
                parameters: {
                    id: 'sku-a',
                    expand: ['shipping_methods']
                }
            },
            {enabled: true}
        )
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

    test('excludes non-deliverable shipping options from the modal', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {
                productDeliveryEstimates: [
                    {
                        productId: 'sku-a',
                        shippingOptions: [
                            ...deliveryResult.productDeliveryEstimates[0].shippingOptions,
                            {
                                shippingMethodId: 'unavailable',
                                name: 'Unavailable',
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
        await user.click(screen.getByRole('button', {name: 'More Delivery Options'}))

        const shippingOptions = await screen.findByRole('dialog', {name: 'Shipping Options'})
        expect(within(shippingOptions).queryByText('Unavailable')).not.toBeInTheDocument()
    })

    test('uses the active currency when an estimate omits its currency', async () => {
        const user = userEvent.setup()
        useDeliveryEstimates.mockReturnValue({
            data: {
                productDeliveryEstimates: [
                    {
                        productId: 'sku-a',
                        shippingOptions:
                            deliveryResult.productDeliveryEstimates[0].shippingOptions.map(
                                (shippingOption) => ({
                                    ...shippingOption,
                                    currency:
                                        shippingOption.shippingMethodId === 'ground'
                                            ? undefined
                                            : shippingOption.currency
                                })
                            )
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
        await user.click(screen.getByRole('button', {name: 'More Delivery Options'}))

        const shippingOptions = await screen.findByRole('dialog', {name: 'Shipping Options'})
        expect(within(shippingOptions).getByText('£5.00')).toBeInTheDocument()
    })
})
