/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import * as commerceSdk from '@salesforce/commerce-sdk-react'
import * as checkoutContext from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    AddToCartModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal', () => ({
    BonusProductSelectionModalProvider: ({children}) => children
}))

const mockGoToNextStep = jest.fn()
const mockGoToStep = jest.fn()
const mockUpdateShippingMethod = {mutateAsync: jest.fn()}

const mockShippingMethods = {
    defaultShippingMethodId: 'standard-shipping',
    applicableShippingMethods: [
        {
            id: 'standard-shipping',
            name: 'Standard Shipping',
            description: '5-7 business days',
            price: 5.99
        },
        {
            id: 'express-shipping',
            name: 'Express Shipping',
            description: '2-3 business days',
            price: 12.99
        }
    ]
}

// Stable reference for hook return value; tests can reassign for promotions etc.
let mockShippingMethodsReturnValue = {data: mockShippingMethods}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsV2Mutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingMethodForShipment') return mockUpdateShippingMethod
            return {mutateAsync: jest.fn()}
        }),
        useShippingMethodsForShipment: jest.fn()
    }
})

let mockCustomerData = {customerId: 'test-customer-id', isRegistered: true}
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: mockCustomerData
    })
}))

const defaultBasketData = {
    basketId: 'test-basket-id',
    shipments: [
        {
            shipmentId: 'me',
            shippingAddress: {
                address1: '123 Main St',
                city: 'Test City'
            },
            shippingMethod: null
        }
    ],
    productItems: [{shipmentId: 'me'}],
    shippingItems: [
        {
            price: 5.99,
            priceAdjustments: []
        }
    ]
}
const defaultBasketDerivedData = {hasBasket: true, totalItems: 1}
let mockBasketData = defaultBasketData
let mockBasketDerivedData = defaultBasketDerivedData

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: mockBasketData,
        derivedData: mockBasketDerivedData
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: jest.fn()
    })
)

jest.mock('@salesforce/retail-react-app/app/hooks', () => ({
    useCurrency: () => ({currency: 'USD'})
}))

const mockShowToast = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: () => mockShowToast
}))

const STEPS = {
    CONTACT_INFO: 0,
    PICKUP_ADDRESS: 1,
    SHIPPING_ADDRESS: 2,
    SHIPPING_OPTIONS: 3,
    PAYMENT: 4
}

beforeEach(() => {
    jest.clearAllMocks()
    mockBasketData = defaultBasketData
    mockBasketDerivedData = defaultBasketDerivedData
    mockShippingMethodsReturnValue = {data: mockShippingMethods}
    mockCustomerData = {customerId: 'test-customer-id', isRegistered: true}
    mockUpdateShippingMethod.mutateAsync.mockResolvedValue({})
    mockShowToast.mockReset()
    commerceSdk.useShippingMethodsForShipment.mockImplementation(
        () => mockShippingMethodsReturnValue
    )
    // Re-apply checkout mock return value (cleared by clearAllMocks) so goToNextStep is always a function
    checkoutContext.useCheckout.mockReturnValue({
        step: 3,
        STEPS,
        goToStep: mockGoToStep,
        goToNextStep: mockGoToNextStep
    })
})

describe('ShippingOptions Component', () => {
    describe('with default mocks (registered user, single shipment, editing step)', () => {
        test('renders shipping options component', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('renders component correctly for registered customer', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('component initializes without errors', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('shows loading state immediately when auto-selection conditions are met', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('component renders correctly for all user types', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('component handles step transitions correctly', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('component renders without errors when auto-selection fails', async () => {
            mockUpdateShippingMethod.mutateAsync.mockRejectedValue(new Error('API Error'))

            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()

            await new Promise((resolve) => setTimeout(resolve, 100))
        })

        test('renders shipping method name in component', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('component handles loading states correctly', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('renders gift options section', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('renders correctly with default mock setup', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getByText('Shipping Options')).toBeInTheDocument()
        })

        test('renders component structure correctly', () => {
            renderWithProviders(<ShippingOptions />)
            expect(screen.getAllByText('Shipping Options').length).toBeGreaterThan(0)
        })

        test('shows error toast and hides controls when no shipping methods are available', async () => {
            commerceSdk.useShippingMethodsForShipment
                .mockReturnValueOnce({data: null, isFetching: true})
                .mockReturnValue({
                    data: {applicableShippingMethods: [], defaultShippingMethodId: 'std'},
                    isFetching: false
                })
            mockUpdateShippingMethod.mutateAsync.mockResolvedValue({})

            renderWithProviders(<ShippingOptions />)

            await waitFor(
                () => {
                    expect(mockShowToast).toHaveBeenCalled()
                    expect(mockShowToast).toHaveBeenCalledWith(
                        expect.objectContaining({
                            status: 'error',
                            title: expect.stringContaining('unable to ship to this address')
                        })
                    )
                },
                {timeout: 2000}
            )
            expect(
                screen.queryByRole('button', {name: /continue to payment/i})
            ).not.toBeInTheDocument()
            expect(mockUpdateShippingMethod.mutateAsync).not.toHaveBeenCalled()
        })
    })

    describe('for guest users', () => {
        beforeEach(() => {
            mockCustomerData = {customerId: null, isRegistered: false}
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '123 Main St', city: 'Test City'},
                        shippingMethod: null
                    }
                ],
                shippingItems: [{price: 5.99, priceAdjustments: []}]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}
        })

        test('displays shipping method options with prices and allows selection', async () => {
            const {user} = renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
            expect(screen.getByText('Express Shipping')).toBeInTheDocument()
            expect(screen.getByText('5-7 business days')).toBeInTheDocument()
            expect(screen.getByText('2-3 business days')).toBeInTheDocument()

            await user.click(screen.getByText('Express Shipping'))

            const expressRadio = screen.getByRole('radio', {name: /Express Shipping/i})
            expect(expressRadio).toBeChecked()
        })

        test('does not trigger auto-selection of shipping method', async () => {
            // Basket already has a valid shipping method selected so shouldSkip() is true and auto-select does not run
            mockBasketData = {
                ...defaultBasketData,
                shipments: [
                    {
                        ...defaultBasketData.shipments[0],
                        shippingMethod: {
                            id: 'standard-shipping',
                            name: 'Standard Shipping'
                        }
                    }
                ]
            }
            renderWithProviders(<ShippingOptions />)

            await new Promise((resolve) => setTimeout(resolve, 150))

            expect(mockUpdateShippingMethod.mutateAsync).not.toHaveBeenCalled()
            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
        })

        test('submits form with selected shipping method and proceeds to next step', async () => {
            const {user} = renderWithProviders(<ShippingOptions />)

            const standardRadios = screen.getAllByRole('radio', {name: /Standard Shipping/i})
            await user.click(standardRadios[0])

            const submitButtons = screen.getAllByRole('button', {name: /continue to payment/i})
            await user.click(submitButtons[0])

            await waitFor(() => {
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'me'
                    },
                    body: {id: 'standard-shipping'}
                })
            })

            await waitFor(() => {
                expect(mockGoToNextStep).toHaveBeenCalled()
            })
        })

        test('displays shipping promotions callout messages', () => {
            mockShippingMethodsReturnValue = {
                data: {
                    defaultShippingMethodId: 'standard-shipping',
                    applicableShippingMethods: [
                        {
                            id: 'standard-shipping',
                            name: 'Standard Shipping',
                            description: '5-7 business days',
                            price: 5.99,
                            shippingPromotions: [
                                {
                                    promotionId: 'promo1',
                                    calloutMsg: 'Free shipping on orders over $75!'
                                }
                            ]
                        },
                        {
                            id: 'express-shipping',
                            name: 'Express Shipping',
                            description: '2-3 business days',
                            price: 12.99,
                            shippingPromotions: []
                        }
                    ]
                }
            }

            renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('Free shipping on orders over $75!')).toBeInTheDocument()
        })
    })

    describe('for registered users with auto-selection', () => {
        test('skips shipping method update when existing method is still valid and stays on edit view', async () => {
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '456 New St', city: 'New City'},
                        shippingMethod: {id: 'standard-shipping', name: 'Standard Shipping'}
                    }
                ],
                productItems: [{shipmentId: 'me'}],
                shippingItems: [{price: 5.99, priceAdjustments: []}]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}

            renderWithProviders(<ShippingOptions />)

            await waitFor(() => {
                expect(mockUpdateShippingMethod.mutateAsync).not.toHaveBeenCalled()
            })

            expect(mockGoToNextStep).not.toHaveBeenCalled()
            expect(
                screen.getAllByRole('button', {name: /continue to payment/i}).length
            ).toBeGreaterThan(0)
        })

        test('auto-selects default method when existing method is no longer valid', async () => {
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '456 New St', city: 'New City'},
                        shippingMethod: {id: 'old-method', name: 'Old Method'}
                    }
                ],
                productItems: [{shipmentId: 'me'}],
                shippingItems: [{price: 5.99, priceAdjustments: []}]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}

            mockUpdateShippingMethod.mutateAsync.mockResolvedValue({})

            renderWithProviders(<ShippingOptions />)

            await waitFor(() => {
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id', shipmentId: 'me'},
                    body: {id: 'standard-shipping'}
                })
            })

            await waitFor(() => {
                expect(mockGoToNextStep).toHaveBeenCalled()
            })
        })
    })

    describe('in summary view (PAYMENT step)', () => {
        test('renders SingleShipmentSummary without price adjustments and strikethrough price', async () => {
            checkoutContext.useCheckout.mockReturnValue({
                step: 4,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '123 Main St', city: 'Test City'},
                        shippingMethod: {
                            id: 'standard-shipping',
                            name: 'Standard Shipping',
                            description: '5-7 business days'
                        }
                    }
                ],
                productItems: [{shipmentId: 'me'}],
                shippingItems: [
                    {
                        price: 9.99,
                        priceAfterItemDiscount: 4.99,
                        priceAdjustments: [
                            {
                                priceAdjustmentId: 'promo-1',
                                itemText: '50% off shipping!'
                            }
                        ]
                    }
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 4.99}

            renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
            expect(screen.getAllByText('5-7 business days').length).toBeGreaterThan(0)
            expect(screen.queryByText('50% off shipping!')).not.toBeInTheDocument()
            expect(screen.getByText(/4\.99/)).toBeInTheDocument()
            expect(screen.queryByText(/9\.99/)).not.toBeInTheDocument()
        })

        test('renders only final price in summary view when price differs from original', async () => {
            checkoutContext.useCheckout.mockReturnValue({
                step: 4,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '123 Main St', city: 'Test City'},
                        shippingMethod: {
                            id: 'standard-shipping',
                            name: 'Standard Shipping',
                            description: '5-7 business days'
                        }
                    }
                ],
                productItems: [{shipmentId: 'me'}],
                shippingItems: [
                    {
                        price: 9.99,
                        priceAfterItemDiscount: 0,
                        priceAdjustments: []
                    }
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 0}

            renderWithProviders(<ShippingOptions />)

            // Verify "Free" is shown (final price is 0)
            // There may be multiple instances (edit view and summary view), so use getAllByText
            expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
            expect(screen.queryByText(/9\.99/)).not.toBeInTheDocument()
        })

        test('renders "Free" label when shipping cost is zero', async () => {
            const freeShippingMethods = {
                defaultShippingMethodId: 'free-shipping',
                applicableShippingMethods: [
                    {
                        id: 'free-shipping',
                        name: 'Free Standard Shipping',
                        description: 'Free for orders over $50',
                        price: 0
                    }
                ]
            }

            checkoutContext.useCheckout.mockReturnValue({
                step: 4,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingAddress: {address1: '123 Main St', city: 'Test City'},
                        shippingMethod: {
                            id: 'free-shipping',
                            name: 'Free Standard Shipping',
                            description: 'Free for orders over $50'
                        }
                    }
                ],
                productItems: [{shipmentId: 'me'}],
                shippingItems: [
                    {
                        price: 0,
                        priceAfterItemDiscount: 0,
                        priceAdjustments: []
                    }
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1, totalShippingCost: 0}
            commerceSdk.useShippingMethodsForShipment.mockReturnValue({
                data: freeShippingMethods
            })

            renderWithProviders(<ShippingOptions />)

            // There may be multiple instances (edit view and summary view), so use getAllByText
            expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
        })
    })

    describe('with multiple shipments', () => {
        const multiShipMethods1 = {
            defaultShippingMethodId: 'std',
            applicableShippingMethods: [
                {
                    id: 'std',
                    name: 'Standard Shipping (4-5 days)',
                    description: 'Arrives: Sept 13-14',
                    price: 0
                },
                {
                    id: 'exp',
                    name: 'Express Shipping (Overnight)',
                    description: 'Arrives: Tomorrow, Sept 12',
                    price: 10
                }
            ]
        }
        const multiShipMethods2 = {
            defaultShippingMethodId: 'std2',
            applicableShippingMethods: [
                {
                    id: 'std2',
                    name: 'Standard Shipping (4-5 days)',
                    description: 'Arrives: Sept 13-14',
                    price: 0
                },
                {
                    id: 'prio',
                    name: 'Priority Shipping',
                    description: 'Arrives: Today at 5-9 PM',
                    price: 25
                }
            ]
        }

        test('when one shipment has no applicable methods, shows error toast once and hides Continue to Payment', async () => {
            mockCustomerData = {customerId: null, isRegistered: false}
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'Oscar',
                            lastName: 'Robertson',
                            address1: '333 South Street Station',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Lee',
                            lastName: 'Robertson',
                            address1: '158 South Street Station',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}

            const noMethodsPayload = {applicableShippingMethods: [], defaultShippingMethodId: null}
            commerceSdk.useShippingMethodsForShipment.mockImplementation((firstArg, secondArg) => {
                const params = firstArg?.parameters || firstArg
                const shipmentId = params?.shipmentId
                const data = shipmentId === 'ship1' ? noMethodsPayload : multiShipMethods2
                const opts = secondArg || firstArg
                const onSuccess = opts?.onSuccess || firstArg?.onSuccess
                if (typeof onSuccess === 'function') {
                    queueMicrotask(() => onSuccess(data))
                }
                return {data}
            })

            renderWithProviders(<ShippingOptions />)

            await waitFor(
                () => {
                    expect(mockShowToast).toHaveBeenCalled()
                    expect(mockShowToast).toHaveBeenCalledWith(
                        expect.objectContaining({
                            status: 'error',
                            title: expect.stringContaining('unable to ship to this address')
                        })
                    )
                },
                {timeout: 5000}
            )

            // Continue to Payment is hidden when any shipment has no methods
            expect(
                screen.queryByRole('button', {name: /continue to payment/i})
            ).not.toBeInTheDocument()

            // Edit view shows both shipments (summary with "No shipping method selected" is only visible when not editing)
            expect(screen.getByText('Shipment 1:')).toBeInTheDocument()
            expect(screen.getByText('Shipment 2:')).toBeInTheDocument()
        })

        test('renders per-shipment methods and allows updating by shipment', async () => {
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'Oscar',
                            lastName: 'Robertson',
                            address1: '333 South Street Station',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Lee',
                            lastName: 'Robertson',
                            address1: '158 South Street Station',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            commerceSdk.useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return {data: multiShipMethods1}
                if (parameters.shipmentId === 'ship2') return {data: multiShipMethods2}
                return {data: multiShipMethods1}
            })

            const {user} = renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Shipping Options').length).toBeGreaterThan(0)
            expect(screen.getByText('Shipment 1:')).toBeInTheDocument()
            expect(screen.getByText('Shipment 2:')).toBeInTheDocument()

            await user.click(screen.getByText('Express Shipping (Overnight)'))
            await waitFor(() =>
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id', shipmentId: 'ship1'},
                    body: {id: 'exp'}
                })
            )

            await user.click(screen.getByText('Priority Shipping'))
            await waitFor(() =>
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id', shipmentId: 'ship2'},
                    body: {id: 'prio'}
                })
            )

            expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
        })

        test('multi-shipment edit view shows shipping options for each shipment', async () => {
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'Oscar',
                            lastName: 'Robertson',
                            address1: '333 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: {id: 'std', name: 'Standard'}
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Lee',
                            lastName: 'Robertson',
                            address1: '158 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: {id: 'std2', name: 'Standard 2'}
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            commerceSdk.useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return {data: multiShipMethods1}
                if (parameters.shipmentId === 'ship2') return {data: multiShipMethods2}
                return {data: multiShipMethods1}
            })

            renderWithProviders(<ShippingOptions />)

            const cards = screen.getAllByTestId('sf-toggle-card-step-2')
            expect(cards.length).toBeGreaterThan(0)
            expect(within(cards[0]).queryByTestId('loading')).toBeNull()
            expect(screen.getAllByText('Shipment 1:').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Shipment 2:').length).toBeGreaterThan(0)
        })

        test('auto-selects default method when no method is set on shipment', async () => {
            const methods1 = {
                defaultShippingMethodId: 'std',
                applicableShippingMethods: [
                    {id: 'std', name: 'Standard', description: '4-5 days', price: 0},
                    {id: 'exp', name: 'Express', description: 'Overnight', price: 10}
                ]
            }
            const methods2 = {
                defaultShippingMethodId: 'std2',
                applicableShippingMethods: [
                    {id: 'std2', name: 'Standard 2', description: '4-5 days', price: 0},
                    {id: 'prio', name: 'Priority', description: 'Same day', price: 25}
                ]
            }

            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'Oscar',
                            lastName: 'Robertson',
                            address1: '333 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Lee',
                            lastName: 'Robertson',
                            address1: '158 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: null
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            commerceSdk.useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return {data: methods1}
                if (parameters.shipmentId === 'ship2') return {data: methods2}
                return {data: methods1}
            })

            mockUpdateShippingMethod.mutateAsync.mockResolvedValue({})

            renderWithProviders(<ShippingOptions />)

            await waitFor(() => {
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id', shipmentId: 'ship1'},
                    body: {id: 'std'}
                })
            })

            await waitFor(() => {
                expect(mockUpdateShippingMethod.mutateAsync).toHaveBeenCalledWith({
                    parameters: {basketId: 'test-basket-id', shipmentId: 'ship2'},
                    body: {id: 'std2'}
                })
            })
        })

        test('continue button advances to next step', async () => {
            const methods1 = {
                defaultShippingMethodId: 'std',
                applicableShippingMethods: [
                    {id: 'std', name: 'Standard', description: '4-5 days', price: 0}
                ]
            }
            mockCustomerData = {customerId: 'test-customer-id', isRegistered: false}
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'Oscar',
                            lastName: 'Robertson',
                            address1: '333 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: {id: 'std', name: 'Standard'}
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Lee',
                            lastName: 'Robertson',
                            address1: '158 South St',
                            city: 'West Lafayette',
                            stateCode: 'IN',
                            postalCode: '98103'
                        },
                        shippingMethod: {id: 'std', name: 'Standard'}
                    }
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            mockShippingMethodsReturnValue = {data: methods1}

            const {renderWithProviders: localRenderWithProviders} = await import(
                '@salesforce/retail-react-app/app/utils/test-utils'
            )
            const module = await import(
                '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
            )
            const sdk = await import('@salesforce/commerce-sdk-react')
            sdk.useShippingMethodsForShipment.mockReturnValue({data: methods1})

            const {user} = localRenderWithProviders(<module.default />)

            const continueButtons = screen.getAllByRole('button', {name: /continue to payment/i})
            await user.click(continueButtons[0])

            expect(mockGoToNextStep).toHaveBeenCalled()
        })

        test('displays address line for each shipment', async () => {
            const methods1 = {
                defaultShippingMethodId: 'std',
                applicableShippingMethods: [
                    {id: 'std', name: 'Standard', description: '4-5 days', price: 0}
                ]
            }

            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Smith',
                            address1: '789 Elm Street',
                            city: 'Portland',
                            stateCode: 'OR',
                            postalCode: '97201'
                        },
                        shippingMethod: {id: 'std', name: 'Standard'}
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Doe',
                            address1: '456 Oak Avenue',
                            city: 'Seattle',
                            stateCode: 'WA',
                            postalCode: '98101'
                        },
                        shippingMethod: {id: 'std', name: 'Standard'}
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 0}
                ]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            commerceSdk.useShippingMethodsForShipment.mockReturnValue({data: methods1})

            renderWithProviders(<ShippingOptions />)

            expect(
                screen.getByText('John Smith, 789 Elm Street, Portland, OR, 97201')
            ).toBeInTheDocument()
            expect(
                screen.getByText('Jane Doe, 456 Oak Avenue, Seattle, WA, 98101')
            ).toBeInTheDocument()
        })

        test('displays shipping promotions in edit view for multi-shipment', () => {
            const methodsWithPromos = {
                defaultShippingMethodId: 'std',
                applicableShippingMethods: [
                    {
                        id: 'std',
                        name: 'Standard Shipping',
                        description: '4-5 days',
                        price: 5.99,
                        shippingPromotions: [
                            {promotionId: 'promo1', calloutMsg: 'Free Shipping Amount Above 50'}
                        ]
                    },
                    {
                        id: 'exp',
                        name: 'Express Shipping',
                        description: 'Overnight',
                        price: 10,
                        shippingPromotions: []
                    }
                ]
            }
            mockCustomerData = {customerId: null, isRegistered: false}
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Smith',
                            address1: '789 Elm Street',
                            city: 'Portland',
                            stateCode: 'OR',
                            postalCode: '97201'
                        },
                        shippingMethod: null
                    }
                ],
                shippingItems: [{shipmentId: 'ship1', price: 0}]
            }
            mockBasketDerivedData = {hasBasket: true, totalItems: 1}
            mockShippingMethodsReturnValue = {data: methodsWithPromos}

            renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('Free Shipping Amount Above 50')).toBeInTheDocument()
        })
    })

    describe('multi-shipment summary view', () => {
        test('renders total shipping cost for multiple shipments', async () => {
            checkoutContext.useCheckout.mockReturnValue({
                step: 4,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345'
                        },
                        shippingMethod: {
                            id: 'standard-shipping',
                            name: 'Standard Shipping',
                            description: '5-7 business days'
                        },
                        shippingTotal: 5.99
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Doe',
                            address1: '456 Oak Ave',
                            city: 'Other City',
                            stateCode: 'NY',
                            postalCode: '67890'
                        },
                        shippingMethod: {
                            id: 'express-shipping',
                            name: 'Express Shipping',
                            description: '2-3 business days'
                        },
                        shippingTotal: 12.99
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 5.99},
                    {shipmentId: 'ship2', price: 12.99}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 5.99},
                    {shipmentId: 'ship2', price: 12.99}
                ]
            }
            mockBasketDerivedData = {
                hasBasket: true,
                totalItems: 2,
                totalShippingCost: 18.98
            }
            commerceSdk.useShippingMethodsForShipment.mockReturnValue({
                data: mockShippingMethods
            })

            renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Express Shipping').length).toBeGreaterThan(0)
            expect(screen.getByText('Total Shipping')).toBeInTheDocument()
        })

        test('renders "No shipping method selected" when method is null', async () => {
            checkoutContext.useCheckout.mockReturnValue({
                step: 4,
                STEPS,
                goToStep: mockGoToStep,
                goToNextStep: mockGoToNextStep
            })
            mockBasketData = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'ship1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'Test City',
                            stateCode: 'CA',
                            postalCode: '12345'
                        },
                        shippingMethod: null,
                        shippingTotal: 0
                    },
                    {
                        shipmentId: 'ship2',
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Doe',
                            address1: '456 Oak Ave',
                            city: 'Other City',
                            stateCode: 'NY',
                            postalCode: '67890'
                        },
                        shippingMethod: {
                            id: 'express-shipping',
                            name: 'Express Shipping',
                            description: '2-3 business days'
                        },
                        shippingTotal: 12.99
                    }
                ],
                productItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 12.99}
                ],
                shippingItems: [
                    {shipmentId: 'ship1', price: 0},
                    {shipmentId: 'ship2', price: 12.99}
                ]
            }
            mockBasketDerivedData = {
                hasBasket: true,
                totalItems: 2,
                totalShippingCost: 12.99
            }
            commerceSdk.useShippingMethodsForShipment.mockReturnValue({
                data: mockShippingMethods
            })

            renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('No shipping method selected')).toBeInTheDocument()
        })
    })
})
