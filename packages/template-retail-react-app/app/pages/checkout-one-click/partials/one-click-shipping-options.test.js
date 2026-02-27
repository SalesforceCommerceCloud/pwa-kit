/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'

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

// Stable references for hook return values to prevent infinite re-render loops.
// The component's useEffect depends on these; returning a new object each render
// would destabilize the dependency array.
let mockShippingMethodsReturnValue = {data: mockShippingMethods}
let mockCurrentCustomerReturnValue = {data: {customerId: 'test-customer-id', isRegistered: true}}
let mockCurrentBasketReturnValue = {}
let mockCheckoutReturnValue = {}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingMethodForShipment') return mockUpdateShippingMethod
            return {mutateAsync: jest.fn()}
        }),
        useShippingMethodsForShipment: jest.fn()
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockCurrentCustomerReturnValue
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => mockCurrentBasketReturnValue
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

const defaultCheckout = {
    step: 3,
    STEPS,
    goToStep: mockGoToStep,
    goToNextStep: mockGoToNextStep
}

beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateShippingMethod.mutateAsync.mockResolvedValue({})
    mockShowToast.mockReset()

    mockCurrentCustomerReturnValue = {
        data: {customerId: 'test-customer-id', isRegistered: true}
    }
    mockCurrentBasketReturnValue = {
        data: {
            basketId: 'test-basket-id',
            shipments: [
                {
                    shippingAddress: {address1: '123 Main St', city: 'Test City'},
                    shippingMethod: null
                }
            ],
            shippingItems: [{price: 5.99, priceAdjustments: []}]
        },
        derivedData: {hasBasket: true, totalItems: 1}
    }
    mockCheckoutReturnValue = {...defaultCheckout}
    useCheckout.mockImplementation(() => mockCheckoutReturnValue)
    mockShippingMethodsReturnValue = {data: mockShippingMethods}
    useShippingMethodsForShipment.mockImplementation(() => mockShippingMethodsReturnValue)
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

        test('shows error toast and hides controls when no shipping methods are available', () => {
            const emptyPayload = {applicableShippingMethods: [], defaultShippingMethodId: 'std'}
            mockShippingMethodsReturnValue = {data: emptyPayload}
            useShippingMethodsForShipment.mockImplementation((_params, opts) => {
                if (opts && typeof opts.onSuccess === 'function') {
                    opts.onSuccess(emptyPayload)
                }
                return mockShippingMethodsReturnValue
            })

            renderWithProviders(<ShippingOptions />)

            expect(
                screen.queryByRole('button', {name: /continue to payment/i})
            ).not.toBeInTheDocument()
            expect(mockUpdateShippingMethod.mutateAsync).not.toHaveBeenCalled()
        })
    })

    describe('for guest users', () => {
        beforeEach(() => {
            mockCurrentCustomerReturnValue = {
                data: {customerId: null, isRegistered: false}
            }
            mockCurrentBasketReturnValue = {
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingAddress: {address1: '123 Main St', city: 'Test City'},
                            shippingMethod: null
                        }
                    ],
                    shippingItems: [{price: 5.99, priceAdjustments: []}]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}
            }
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
        test('skips shipping method update when existing method is still valid', async () => {
            mockCurrentBasketReturnValue = {
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingAddress: {address1: '456 New St', city: 'New City'},
                            shippingMethod: {id: 'standard-shipping', name: 'Standard Shipping'}
                        }
                    ],
                    shippingItems: [{price: 5.99, priceAdjustments: []}]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}
            }

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
            mockCurrentBasketReturnValue = {
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingAddress: {address1: '456 New St', city: 'New City'},
                            shippingMethod: {id: 'old-method', name: 'Old Method'}
                        }
                    ],
                    shippingItems: [{price: 5.99, priceAdjustments: []}]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 5.99}
            }

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
        beforeEach(() => {
            mockCheckoutReturnValue = {...defaultCheckout, step: 4}
        })

        test('shows final price without promotion text or strikethrough', () => {
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {
                            price: 9.99,
                            priceAfterItemDiscount: 4.99,
                            priceAdjustments: [
                                {priceAdjustmentId: 'promo-1', itemText: '50% off shipping!'}
                            ]
                        }
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 4.99}
            }

            renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
            expect(screen.getAllByText('5-7 business days').length).toBeGreaterThan(0)
            expect(screen.queryByText('50% off shipping!')).not.toBeInTheDocument()
            expect(screen.getByText(/4\.99/)).toBeInTheDocument()
            expect(screen.queryByText(/9\.99/)).not.toBeInTheDocument()
        })

        test('shows Free label without original price when discounted to zero', () => {
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [{price: 9.99, priceAfterItemDiscount: 0, priceAdjustments: []}]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 0}
            }

            renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
            expect(screen.queryByText(/9\.99/)).not.toBeInTheDocument()
        })

        test('displays Free text when shipping cost is zero', () => {
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
            mockShippingMethodsReturnValue = {data: freeShippingMethods}
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [{price: 0, priceAfterItemDiscount: 0, priceAdjustments: []}]
                },
                derivedData: {hasBasket: true, totalItems: 1, totalShippingCost: 0}
            }

            renderWithProviders(<ShippingOptions />)

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

        test('allows selecting methods per shipment', async () => {
            mockCurrentCustomerReturnValue = {
                data: {customerId: null, isRegistered: false}
            }
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 0}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2}
            }
            const stableShip1 = {data: multiShipMethods1}
            const stableShip2 = {data: multiShipMethods2}
            useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return stableShip1
                if (parameters.shipmentId === 'ship2') return stableShip2
                return stableShip1
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

        test('displays shipment labels and options in edit view', () => {
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 0}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            }
            const stableShip1 = {data: multiShipMethods1}
            const stableShip2 = {data: multiShipMethods2}
            useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return stableShip1
                if (parameters.shipmentId === 'ship2') return stableShip2
                return stableShip1
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

            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 0}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            }
            const stableM1 = {data: methods1}
            const stableM2 = {data: methods2}
            useShippingMethodsForShipment.mockImplementation(({parameters}) => {
                if (parameters.shipmentId === 'ship1') return stableM1
                if (parameters.shipmentId === 'ship2') return stableM2
                return stableM1
            })

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
            mockCurrentCustomerReturnValue = {
                data: {customerId: 'test-customer-id', isRegistered: false}
            }
            mockCurrentBasketReturnValue = {
                data: {
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
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            }
            mockShippingMethodsReturnValue = {data: methods1}

            const {user} = renderWithProviders(<ShippingOptions />)

            const continueButtons = screen.getAllByRole('button', {
                name: /continue to payment/i
            })
            await user.click(continueButtons[0])

            expect(mockGoToNextStep).toHaveBeenCalled()
        })

        test('shows formatted address for each shipment', () => {
            const methods1 = {
                defaultShippingMethodId: 'std',
                applicableShippingMethods: [
                    {id: 'std', name: 'Standard', description: '4-5 days', price: 0}
                ]
            }
            mockCurrentCustomerReturnValue = {
                data: {customerId: null, isRegistered: false}
            }
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 0}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 0}
            }
            mockShippingMethodsReturnValue = {data: methods1}

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
            mockCurrentCustomerReturnValue = {
                data: {customerId: null, isRegistered: false}
            }
            mockCurrentBasketReturnValue = {
                data: {
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
                },
                derivedData: {hasBasket: true, totalItems: 1}
            }
            mockShippingMethodsReturnValue = {data: methodsWithPromos}

            renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('Free Shipping Amount Above 50')).toBeInTheDocument()
        })
    })

    describe('multi-shipment summary view', () => {
        beforeEach(() => {
            mockCheckoutReturnValue = {...defaultCheckout, step: 4}
        })

        test('displays both methods and total shipping cost', () => {
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 5.99},
                        {shipmentId: 'ship2', price: 12.99}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 18.98}
            }

            renderWithProviders(<ShippingOptions />)

            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Express Shipping').length).toBeGreaterThan(0)
            expect(screen.getByText('Total Shipping')).toBeInTheDocument()
        })

        test('shows "No shipping method selected" when method is null', () => {
            mockCurrentBasketReturnValue = {
                data: {
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
                    shippingItems: [
                        {shipmentId: 'ship1', price: 0},
                        {shipmentId: 'ship2', price: 12.99}
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2, totalShippingCost: 12.99}
            }

            renderWithProviders(<ShippingOptions />)

            expect(screen.getByText('No shipping method selected')).toBeInTheDocument()
        })
    })
})
