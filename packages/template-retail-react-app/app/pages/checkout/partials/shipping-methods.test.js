/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'
import ShippingMethods from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-methods'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {
    useShippingMethodsForShipment,
    useProducts,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'

// Mock the hooks
jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/retail-react-app/app/hooks')
jest.mock('@salesforce/commerce-sdk-react')

const mockUseCheckout = useCheckout
const mockUseCurrentBasket = useCurrentBasket
const mockUseCurrency = useCurrency
const mockUseShippingMethodsForShipment = useShippingMethodsForShipment
const mockUseProducts = useProducts
const mockUseShopperBasketsMutation = useShopperBasketsMutation

// Mock data
const mockBasket = {
    basketId: 'basket-1',
    shipments: [
        {
            shipmentId: 'shipment-1',
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'Anytown',
                stateCode: 'CA',
                postalCode: '12345'
            },
            shippingMethod: {
                id: 'shipping-method-1',
                name: 'Standard Shipping',
                description: '5-7 business days'
            }
        }
    ],
    productItems: [
        {
            itemId: 'item-1',
            productId: 'product-1',
            productName: 'Test Product 1',
            quantity: 2,
            price: 29.99,
            variationValues: {
                color: 'Red',
                size: 'Medium'
            }
        },
        {
            itemId: 'item-2',
            productId: 'product-2',
            productName: 'Test Product 2',
            quantity: 1,
            price: 19.99,
            variationValues: {
                color: 'Blue',
                size: 'Large'
            }
        }
    ],
    shippingItems: [
        {
            shipmentId: 'shipment-1',
            price: 5.99,
            priceAfterItemDiscount: 5.99
        }
    ]
}

const mockShippingMethods = {
    applicableShippingMethods: [
        {
            id: 'shipping-method-1',
            name: 'Standard Shipping',
            description: '5-7 business days',
            price: 5.99
        },
        {
            id: 'shipping-method-2',
            name: 'Express Shipping',
            description: '2-3 business days',
            price: 12.99
        }
    ],
    defaultShippingMethodId: 'shipping-method-1'
}

const mockProductsMap = {
    'product-1': {
        id: 'product-1',
        name: 'Test Product 1',
        imageGroups: [
            {
                viewType: 'small',
                images: [
                    {
                        link: 'https://test-image-1.jpg',
                        disBaseLink: 'https://test-image-1.jpg'
                    }
                ]
            }
        ]
    },
    'product-2': {
        id: 'product-2',
        name: 'Test Product 2',
        imageGroups: [
            {
                viewType: 'small',
                images: [
                    {
                        link: 'https://test-image-2.jpg',
                        disBaseLink: 'https://test-image-2.jpg'
                    }
                ]
            }
        ]
    }
}

const defaultProps = {
    step: 'SHIPPING_OPTIONS',
    STEPS: {
        SHIPPING_OPTIONS: 'SHIPPING_OPTIONS'
    },
    goToStep: jest.fn(),
    goToNextStep: jest.fn()
}

const renderWithIntl = (component) => {
    return render(
        <CurrencyProvider currency="USD">
            <IntlProvider locale="en">{component}</IntlProvider>
        </CurrencyProvider>
    )
}

describe('ShippingMethods', () => {
    beforeEach(() => {
        mockUseCheckout.mockReturnValue(defaultProps)
        mockUseCurrentBasket.mockReturnValue({
            data: mockBasket,
            derivedData: {
                totalShippingCost: 5.99
            },
            isLoading: false
        })
        mockUseCurrency.mockReturnValue({
            currency: 'USD'
        })
        mockUseShippingMethodsForShipment.mockReturnValue({
            data: mockShippingMethods,
            isLoading: false
        })
        mockUseProducts.mockReturnValue({
            data: mockProductsMap,
            isLoading: false
        })
        mockUseShopperBasketsMutation.mockReturnValue(jest.fn().mockResolvedValue({}))
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Loading States', () => {
        test('should show loading spinner when basket is loading', () => {
            mockUseCurrentBasket.mockReturnValue({
                data: null,
                derivedData: {
                    totalShippingCost: undefined
                },
                isLoading: true
            })

            renderWithIntl(<ShippingMethods />)

            expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0)
        })

        test('should show loading spinner for shipping methods when shipping methods are loading', async () => {
            mockUseShippingMethodsForShipment.mockReturnValue({
                data: null,
                isLoading: true
            })

            renderWithIntl(<ShippingMethods />)

            // Wait for the loading spinner to appear
            await waitFor(() => {
                expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0)
            })
        })

        test('should show loading spinner when multiple data sources are loading', () => {
            mockUseCurrentBasket.mockReturnValue({
                data: null,
                derivedData: {
                    totalShippingCost: undefined
                },
                isLoading: true
            })
            mockUseProducts.mockReturnValue({
                data: {},
                isLoading: true
            })
            mockUseShippingMethodsForShipment.mockReturnValue({
                data: null,
                isLoading: true
            })

            renderWithIntl(<ShippingMethods />)

            expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0)
        })
    })

    describe('Component Rendering', () => {
        test('should render shipping options when all data is loaded', () => {
            renderWithIntl(<ShippingMethods />)

            expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
            expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
            expect(screen.getByText('Express Shipping')).toBeInTheDocument()
        })

        test('should render shipping methods correctly', () => {
            renderWithIntl(<ShippingMethods />)

            expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
            expect(screen.getByText('Express Shipping')).toBeInTheDocument()
            expect(screen.getByText('5-7 business days')).toBeInTheDocument()
            expect(screen.getByText('2-3 business days')).toBeInTheDocument()
        })

        test('should render shipping methods when shipping methods are loaded', () => {
            renderWithIntl(<ShippingMethods />)

            expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
            expect(screen.getByText('Express Shipping')).toBeInTheDocument()
            expect(screen.getByText('5-7 business days')).toBeInTheDocument()
            expect(screen.getByText('2-3 business days')).toBeInTheDocument()
        })

        test('should display shipping cost from derivedData correctly', () => {
            renderWithIntl(<ShippingMethods />)
            expect(screen.getByText('$5.99')).toBeInTheDocument()
        })
    })

    describe('Form Functionality', () => {
        test('should render continue button when shipping method is selected', () => {
            renderWithIntl(<ShippingMethods />)

            const continueButton = screen.getByText('Continue to Payment')
            expect(continueButton).toBeInTheDocument()
            expect(continueButton).not.toBeDisabled()
        })

        test('should disable continue button when no shipping method is selected', () => {
            // Mock basket without shipping method
            const basketWithoutShippingMethod = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: null
                    }
                ]
            }

            mockUseCurrentBasket.mockReturnValue({
                data: basketWithoutShippingMethod,
                derivedData: {
                    totalShippingCost: 5.99
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            const continueButton = screen.getByText('Continue to Payment')
            expect(continueButton).toBeDisabled()
        })
    })

    describe('Multiple Shipments', () => {
        test('should render multiple shipments correctly', () => {
            const multiShipmentBasket = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'Anytown',
                            stateCode: 'CA',
                            postalCode: '12345'
                        },
                        shippingMethod: {
                            id: 'shipping-method-1',
                            name: 'Standard Shipping',
                            description: '5-7 business days'
                        }
                    },
                    {
                        shipmentId: 'shipment-2',
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Smith',
                            address1: '456 Oak Ave',
                            city: 'Somewhere',
                            stateCode: 'NY',
                            postalCode: '67890'
                        },
                        shippingMethod: {
                            id: 'shipping-method-2',
                            name: 'Express Shipping',
                            description: '2-3 business days'
                        }
                    }
                ]
            }

            mockUseCurrentBasket.mockReturnValue({
                data: multiShipmentBasket,
                derivedData: {
                    totalShippingCost: 18.98
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            expect(screen.getAllByText('Standard Shipping').length).toBeGreaterThan(0)
            expect(screen.getAllByText('Express Shipping').length).toBeGreaterThan(0)
        })

        test('should display correct individual shipping costs in summary mode with all relevant shipping fees - surcharge', () => {
            const multiShipmentBasketWithSurcharges = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-1',
                        shippingTotal: 15.99, // Base 5.99 + surcharge 10.00
                        shippingAddress: {
                            firstName: 'John',
                            lastName: 'Doe',
                            address1: '123 Main St',
                            city: 'Anytown',
                            stateCode: 'CA',
                            postalCode: '12345'
                        },
                        shippingMethod: {
                            id: 'shipping-method-1',
                            name: 'Ground',
                            description: 'Order received within 7-10 business days'
                        }
                    },
                    {
                        shipmentId: 'shipment-2',
                        shippingTotal: 5.99, // Base only
                        shippingAddress: {
                            firstName: 'Jane',
                            lastName: 'Smith',
                            address1: '456 Oak Ave',
                            city: 'Somewhere',
                            stateCode: 'NY',
                            postalCode: '67890'
                        },
                        shippingMethod: {
                            id: 'shipping-method-2',
                            name: 'Ground',
                            description: 'Order received within 7-10 business days'
                        }
                    }
                ],
                shippingItems: [
                    {shipmentId: 'shipment-1', price: 5.99}, // Base
                    {shipmentId: 'shipment-1', price: 10.0}, // Surcharge
                    {shipmentId: 'shipment-2', price: 5.99} // Base
                ]
            }

            mockUseCurrentBasket.mockReturnValue({
                data: multiShipmentBasketWithSurcharges,
                derivedData: {
                    totalShippingCost: 21.98 // 15.99 + 5.99
                },
                isLoading: false
            })

            // show summary mode
            mockUseCheckout.mockReturnValue({
                step: 3,
                STEPS: {SHIPPING_OPTIONS: 2},
                goToStep: jest.fn(),
                goToNextStep: jest.fn()
            })

            renderWithIntl(<ShippingMethods />)

            expect(screen.getByText('$15.99')).toBeInTheDocument() // First shipment
            expect(screen.getByText('$5.99')).toBeInTheDocument() // Second shipment
            expect(screen.getByText('$21.98')).toBeInTheDocument() // Total
        })
    })

    describe('Error Handling', () => {
        test('should handle missing basket data gracefully', () => {
            mockUseCurrentBasket.mockReturnValue({
                data: null,
                derivedData: {
                    totalShippingCost: undefined
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            // Should not crash and should show appropriate state
            expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        })

        test('should handle missing shipping address gracefully', () => {
            const basketWithoutAddress = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingAddress: null
                    }
                ]
            }

            mockUseCurrentBasket.mockReturnValue({
                data: basketWithoutAddress,
                derivedData: {
                    totalShippingCost: 5.99
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            // Should not crash and should show appropriate state
            expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
        })
    })

    describe('Product Display', () => {
        test('should render shipping options component with basic structure', () => {
            renderWithIntl(<ShippingMethods />)

            // Check that the main component structure is rendered
            expect(screen.getByText('Shipping & Gift Options')).toBeInTheDocument()
            expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
        })
    })

    describe('Shipping Promotions', () => {
        test('should display shipping promotions when available', () => {
            const shippingMethodsWithPromotions = {
                ...mockShippingMethods,
                applicableShippingMethods: [
                    {
                        ...mockShippingMethods.applicableShippingMethods[0],
                        shippingPromotions: [
                            {
                                promotionId: 'promo-1',
                                calloutMsg: 'Free shipping on orders over $50'
                            }
                        ]
                    }
                ]
            }

            mockUseShippingMethodsForShipment.mockReturnValue({
                data: shippingMethodsWithPromotions,
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            expect(screen.getByText('Free shipping on orders over $50')).toBeInTheDocument()
        })
    })

    describe('Loading State Transitions', () => {
        test('should transition from loading to loaded state smoothly', async () => {
            // Start with loading state
            mockUseCurrentBasket.mockReturnValue({
                data: null,
                derivedData: {
                    totalShippingCost: undefined
                },
                isLoading: true
            })

            const {rerender} = renderWithIntl(<ShippingMethods />)
            expect(screen.getAllByTestId('loading').length).toBeGreaterThan(0)

            // Transition to loaded state
            mockUseCurrentBasket.mockReturnValue({
                data: mockBasket,
                derivedData: {
                    totalShippingCost: 5.99
                },
                isLoading: false
            })

            rerender(
                <CurrencyProvider currency="USD">
                    <IntlProvider locale="en">
                        <ShippingMethods />
                    </IntlProvider>
                </CurrencyProvider>
            )

            await waitFor(() => {
                expect(screen.queryAllByTestId('loading')).toHaveLength(0)
            })

            expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
        })
    })

    describe('auto-submit functionality', () => {
        test('should auto-submit default shipping method when available', async () => {
            const basketWithoutMethods = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: null
                    }
                ]
            }

            const mockShippingMethods = {
                defaultShippingMethodId: 'default-shipping-method',
                applicableShippingMethods: [
                    {
                        id: 'default-shipping-method',
                        name: 'Default Shipping'
                    }
                ]
            }

            const mockMutateAsync = jest.fn().mockResolvedValue({})
            mockUseShopperBasketsMutation.mockReturnValue({
                updateShippingMethod: {mutateAsync: mockMutateAsync}
            })

            // after auto-submit, step should advance to PAYMENT (summary mode)
            mockUseCheckout.mockReturnValue({
                step: 'PAYMENT',
                STEPS: {SHIPPING_OPTIONS: 'SHIPPING_OPTIONS', PAYMENT: 'PAYMENT'},
                goToStep: jest.fn(),
                goToNextStep: jest.fn()
            })

            mockUseCurrentBasket.mockReturnValue({
                data: basketWithoutMethods,
                derivedData: {
                    totalShippingCost: 5.99,
                    isMissingShippingMethod: false
                },
                isLoading: false
            })

            mockUseShippingMethodsForShipment.mockReturnValue({
                data: mockShippingMethods,
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            // component is in SUMMARY mode (collapsed) after auto-submit
            expect(screen.getByRole('button', {name: 'Edit Shipping Options'})).toBeInTheDocument()
            expect(
                screen.queryByRole('radio', {name: 'Default Shipping $5.99'})
            ).not.toBeInTheDocument()
            expect(
                screen.queryByRole('button', {name: 'Continue to Payment'})
            ).not.toBeInTheDocument()
        })

        test('should not auto-submit if shipment already has a method', async () => {
            // Mock basket that already has a shipping method
            const basketWithMethod = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: {
                            id: 'existing-method',
                            name: 'Existing Shipping'
                        }
                    }
                ]
            }

            const mockUpdateShippingMethod = jest.fn().mockResolvedValue({})
            mockUpdateShippingMethod.mutateAsync = jest.fn().mockResolvedValue({})

            // Mock the mutation hook
            mockUseShopperBasketsMutation.mockReturnValue(mockUpdateShippingMethod)

            mockUseCurrentBasket.mockReturnValue({
                data: basketWithMethod,
                derivedData: {totalShippingCost: 0},
                isLoading: false
            })

            mockUseShippingMethodsForShipment.mockReturnValue({
                data: {
                    defaultShippingMethodId: 'default-method',
                    applicableShippingMethods: []
                },
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            // no auto-submit happens
            await waitFor(() => {
                expect(mockUpdateShippingMethod).not.toHaveBeenCalled()
            })
        })

        test('should not auto-submit if user has manually selected a different method', async () => {
            const basketWithoutMethods = {
                ...mockBasket,
                shipments: [
                    {
                        ...mockBasket.shipments[0],
                        shippingMethod: null
                    }
                ]
            }

            // Mock shipping methods with default
            const mockShippingMethods = {
                defaultShippingMethodId: 'default-method',
                applicableShippingMethods: [
                    {
                        id: 'default-method',
                        name: 'Default Shipping'
                    },
                    {
                        id: 'user-selected-method',
                        name: 'User Selected Shipping'
                    }
                ]
            }

            const mockUpdateShippingMethod = jest.fn().mockResolvedValue({})
            mockUpdateShippingMethod.mutateAsync = jest.fn().mockResolvedValue({})

            // Mock the mutation hook
            mockUseShopperBasketsMutation.mockReturnValue(mockUpdateShippingMethod)

            mockUseCurrentBasket.mockReturnValue({
                data: basketWithoutMethods,
                derivedData: {totalShippingCost: 0},
                isLoading: false
            })

            mockUseShippingMethodsForShipment.mockReturnValue({
                data: mockShippingMethods,
                isLoading: false
            })

            renderWithIntl(<ShippingMethods />)

            // no auto-submit happens because the form would have user-selected-method, not default-method)
            await waitFor(() => {
                expect(mockUpdateShippingMethod).not.toHaveBeenCalled()
            })
        })
    })
})
