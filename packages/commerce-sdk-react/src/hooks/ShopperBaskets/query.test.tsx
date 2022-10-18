/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {
    useBasket,
    usePaymentMethodsForBasket,
    useShippingMethodsForShipment,
    useTaxesFromBasket
} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const BasketComponent = ({basketId}: {basketId: string}): ReactElement => {
    const {data, isLoading, error} = useBasket({basketId})

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <>
                    <div>customerId: {data?.customerInfo?.customerId}</div>
                    <p>currency: {data?.currency}</p>
                    <p>product total: {data?.productTotal}</p>
                </>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const PaymentMethodsForBasketComponent = ({basketId}: {basketId: string}): ReactElement => {
    const {data, isLoading, error} = usePaymentMethodsForBasket({basketId})

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <>
                    <p>payment methods:</p>
                    <ul>
                        {data?.applicablePaymentMethods?.map((paymentMethod) => (
                            <li key={paymentMethod.id}>{paymentMethod.id}</li>
                        ))}
                    </ul>
                </>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const ShippingMethodsForShipmentComponent = ({
    basketId,
    shipmentId
}: {
    basketId: string
    shipmentId: string
}): ReactElement => {
    const {data, isLoading, error} = useShippingMethodsForShipment({basketId, shipmentId})

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <>
                    <p>shipping methods:</p>
                    <ul>
                        {data?.applicableShippingMethods?.map((shippingMethod, i) => (
                            <li key={i}>{shippingMethod.name}</li>
                        ))}
                    </ul>
                </>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const TaxesFromBasketComponent = ({basketId}: {basketId: string}): ReactElement => {
    const {data, isLoading, error} = useTaxesFromBasket({basketId})

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <>
                    <p>taxes:</p>
                    <ul>
                        {Object.keys(data?.taxes).map((taxItemId) => (
                            <li key={taxItemId}>{taxItemId}</li>
                        ))}
                    </ul>
                </>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const tests = [
    {
        hook: 'useBasket',
        cases: [
            {
                name: 'returns basket',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<BasketComponent basketId={basketId} />)
                    const customerId = 'abc123'
                    const currency = 'USD'
                    const productTotal = 599.97

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('customerId'))
                    expect(screen.getByText('customerId: ' + customerId)).toBeInTheDocument()
                    expect(screen.getByText('product total: ' + productTotal)).toBeInTheDocument()
                    expect(screen.getByText('currency: ' + currency)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error if basket not found',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<BasketComponent basketId={basketId} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'usePaymentMethodsForBasket',
        cases: [
            {
                name: 'returns payment methods for basket',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<PaymentMethodsForBasketComponent basketId={basketId} />)
                    const paymentMethodIds = ['GIFT_CERTIFICATE', 'PayPal', 'BML']

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(paymentMethodIds[0]))
                    expect(screen.getByText(paymentMethodIds[0])).toBeInTheDocument()
                    expect(screen.getByText(paymentMethodIds[1])).toBeInTheDocument()
                    expect(screen.getByText(paymentMethodIds[2])).toBeInTheDocument()
                })
            },
            {
                name: 'returns error if basket not found',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<PaymentMethodsForBasketComponent basketId={basketId} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'useShippingMethodsForShipment',
        cases: [
            {
                name: 'returns shipping methods for shipment',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    const shipmentId = 'ship123'
                    renderWithProviders(
                        <ShippingMethodsForShipmentComponent
                            basketId={basketId}
                            shipmentId={shipmentId}
                        />
                    )
                    const shipmentMethods = ['Ground', '2-Day Express', 'Overnight']

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(shipmentMethods[0]))
                    expect(screen.getByText(shipmentMethods[0])).toBeInTheDocument()
                    expect(screen.getByText(shipmentMethods[1])).toBeInTheDocument()
                    expect(screen.getByText(shipmentMethods[2])).toBeInTheDocument()
                })
            },
            {
                name: 'returns error if basket not found',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    const shipmentId = 'ship123'
                    renderWithProviders(
                        <ShippingMethodsForShipmentComponent
                            basketId={basketId}
                            shipmentId={shipmentId}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'useTaxesFromBasket',
        cases: [
            {
                name: 'returns taxes from basket',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<TaxesFromBasketComponent basketId={basketId} />)
                    const taxItemIds = ['abc123', 'xyz456']

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(taxItemIds[0]))
                    expect(screen.getByText(taxItemIds[0])).toBeInTheDocument()
                    expect(screen.getByText(taxItemIds[1])).toBeInTheDocument()
                })
            },
            {
                name: 'returns error if basket not found',
                assertions: withMocks(async () => {
                    const basketId = '123'
                    renderWithProviders(<TaxesFromBasketComponent basketId={basketId} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
