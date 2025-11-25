/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within, act} from '@testing-library/react'
import {rest} from 'msw'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Global filter for noisy act warnings in this spec only
let globalConsoleErrorSpy
const originalConsoleError = console.error
beforeAll(() => {
    globalConsoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const msg = args?.[0]
        const isActWarning =
            typeof msg === 'string' &&
            (msg.includes('not wrapped in act') ||
                msg.includes('The current testing environment is not configured to support act'))
        if (isActWarning) return
        originalConsoleError(...args)
    })
})
afterAll(() => {
    if (globalConsoleErrorSpy) globalConsoleErrorSpy.mockRestore()
})

const mockGoToNextStep = jest.fn()
const mockGoToStep = jest.fn()
const mockUpdateShippingAddress = {mutateAsync: jest.fn()}
const mockCreateCustomerAddress = {mutateAsync: jest.fn()}
const mockUpdateCustomerAddress = {mutateAsync: jest.fn()}
const mockCreateCustomerProductList = {mutate: jest.fn(), mutateAsync: jest.fn()}
const mockRefetch = jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingAddressForShipment')
                return mockUpdateShippingAddress
            return {mutateAsync: jest.fn()}
        }),
        useShopperCustomersMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'createCustomerAddress') return mockCreateCustomerAddress
            if (mutationType === 'updateCustomerAddress') return mockUpdateCustomerAddress
            if (mutationType === 'createCustomerProductList') return mockCreateCustomerProductList
            return {mutateAsync: jest.fn()}
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            customerId: 'test-customer-id',
            isRegistered: true,
            addresses: [
                {
                    addressId: 'preferred-address',
                    address1: '123 Main St',
                    city: 'Test City',
                    countryCode: 'US',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '555-1234',
                    postalCode: '12345',
                    stateCode: 'CA',
                    preferred: true
                }
            ]
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: {
            basketId: 'test-basket-id',
            shipments: [
                {
                    shippingAddress: null
                }
            ]
        },
        derivedData: {
            hasBasket: true,
            totalItems: 1
        },
        refetch: mockRefetch
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: jest.fn().mockReturnValue({
            step: 2, // SHIPPING_ADDRESS step
            STEPS: {
                CONTACT_INFO: 0,
                PICKUP_ADDRESS: 1,
                SHIPPING_ADDRESS: 2,
                SHIPPING_OPTIONS: 3
            },
            goToStep: mockGoToStep,
            goToNextStep: mockGoToNextStep,
            contactPhone: '(727) 555-0000'
        })
    })
)

// Mock the ShippingAddressSelection component
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection',
    () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PropTypes = require('prop-types')

        function MockShippingAddressSelection({onSubmit}) {
            return (
                <div data-testid="shipping-address-selection">
                    <button
                        onClick={() =>
                            onSubmit({
                                addressId: 'test-address',
                                address1: '123 Test St',
                                city: 'Test City',
                                countryCode: 'US',
                                firstName: 'Test',
                                lastName: 'User',
                                phone: '555-0123',
                                postalCode: '12345',
                                stateCode: 'CA'
                            })
                        }
                    >
                        Continue to Shipping Method
                    </button>
                </div>
            )
        }

        MockShippingAddressSelection.propTypes = {
            onSubmit: PropTypes.func
        }

        return MockShippingAddressSelection
    }
)

// Mock the multi-address component to avoid prop-type warnings from nested cards
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-multi-address',
    () =>
        function MockMultiAddress() {
            return <div data-testid="multi-address-view" />
        }
)

beforeEach(() => {
    jest.clearAllMocks()
    // Stub background product-lists calls that can 403 and keep Jest open with retries
    global.server.use(
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json({total: 0, data: []}))
        }),
        rest.get('*/customers/:customerId/product-lists/*', (req, res, ctx) => {
            return res(ctx.json({}))
        }),
        // Stub product details background fetches
        rest.get('*/product/shopper-products/v1/organizations/:orgId/products', (req, res, ctx) => {
            return res(
                ctx.json({
                    data: [],
                    total: 0,
                    limit: 0,
                    offset: 0
                })
            )
        })
    )
})

afterEach(() => {
    global.server.resetHandlers()
})

describe('ShippingAddress Component', () => {
    // Filter React's act warnings that are known and non-fatal in this environment
    let consoleErrorSpy
    beforeEach(() => {
        const originalError = console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
            const msg = args?.[0]
            const isActWarning =
                typeof msg === 'string' &&
                (msg.includes('not wrapped in act') ||
                    msg.includes(
                        'The current testing environment is not configured to support act'
                    ))
            if (isActWarning) {
                return
            }
            originalError(...args)
        })
    })
    afterEach(() => {
        if (consoleErrorSpy) consoleErrorSpy.mockRestore()
    })

    const waitForNotLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
        })
    }
    test('renders shipping address component', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('renders correctly for registered customers', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render successfully for registered customers
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('renders address selection component correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Should render the shipping address selection component
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('handles user interactions correctly', async () => {
        const {user} = renderWithProviders(<ShippingAddress />)
        // Scope to the first step container to avoid duplicate matches
        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        const selection = within(stepContainers[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selection).getByRole('button', {
            name: /Continue to Shipping Method/i
        })

        // Button should be clickable
        expect(submitButton).toBeInTheDocument()
        await act(async () => {
            await user.click(submitButton)
        })
        await waitForNotLoading()

        // Component should remain stable after interaction
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })

    test('renders form elements correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render form elements
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('component integrates with address selection correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Should render and integrate with the address selection component
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        expect(screen.getByText('Continue to Shipping Method')).toBeInTheDocument()
    })

    test('handles submission errors gracefully', async () => {
        mockUpdateShippingAddress.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {user} = renderWithProviders(<ShippingAddress />)

        const submitButton = screen.getByText('Continue to Shipping Method')
        await act(async () => {
            await user.click(submitButton)
        })

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()

        // The component should handle the error and not call goToNextStep
        expect(mockGoToNextStep).not.toHaveBeenCalled()
    })

    test('targets delivery shipment id when saving address in mixed cart', async () => {
        jest.resetModules()
        const deliveryId = 'delivery-1'
        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
            useCurrentBasket: () => ({
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        // Pickup shipment
                        {
                            shipmentId: 'pickup-1',
                            shippingAddress: null,
                            shippingMethod: {c_storePickupEnabled: true}
                        },
                        // Delivery shipment
                        {
                            shipmentId: deliveryId,
                            shippingAddress: null,
                            shippingMethod: {c_storePickupEnabled: false}
                        }
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 1},
                refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
            })
        }))
        const {renderWithProviders: localRenderWithProviders} = await import(
            '@salesforce/retail-react-app/app/utils/test-utils'
        )
        const module = await import(
            '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
        )
        const Component = module.default
        const {user} = localRenderWithProviders(<Component />)
        await user.click(screen.getByText('Continue to Shipping Method'))
        const last = mockUpdateShippingAddress.mutateAsync.mock.calls.pop()?.[0]
        expect(last.parameters).toMatchObject({shipmentId: deliveryId})
    })

    test('shows loading state during address submission', async () => {
        // Mock a delayed response
        mockUpdateShippingAddress.mutateAsync.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        )

        const {user} = renderWithProviders(<ShippingAddress />)

        const submitButton = screen.getByText('Continue to Shipping Method')
        await act(async () => {
            await user.click(submitButton)
        })

        // The ToggleCard should show loading state
        // This would require checking for loading indicators in the UI
        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        await waitForNotLoading()
    })

    test('submits shipping address with phone for registered user (from address/customer)', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        const {user} = renderWithProviders(<ShippingAddress />)
        await act(async () => {
            await user.click(screen.getByText('Continue to Shipping Method'))
        })
        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()
        expect(mockRefetch).toHaveBeenCalled()
        const lastCall = mockUpdateShippingAddress.mutateAsync.mock.calls.pop()
        const body = lastCall?.[0]?.body
        expect(body).toHaveProperty('phone')
        expect(body.phone).toBeDefined()
    })

    test('submits shipping address with phone for guest (from contact info context)', async () => {
        jest.resetModules()
        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
            useCurrentCustomer: () => ({
                data: {
                    customerId: null,
                    isRegistered: false
                }
            })
        }))
        // Re-mock current basket after reset to provide basket id and shipments
        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
            useCurrentBasket: () => ({
                data: {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shippingAddress: null
                        }
                    ]
                },
                derivedData: {
                    hasBasket: true,
                    totalItems: 1
                },
                refetch: mockRefetch
            })
        }))
        // Re-mock the inner ShippingAddressSelection component to ensure onSubmit path is deterministic
        jest.doMock(
            '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection',
            () => {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const PropTypes = require('prop-types')
                function MockShippingAddressSelection({onSubmit}) {
                    return (
                        <div data-testid="shipping-address-selection">
                            <button
                                onClick={() =>
                                    onSubmit({
                                        addressId: 'test-address',
                                        address1: '123 Test St',
                                        city: 'Test City',
                                        countryCode: 'US',
                                        firstName: 'Test',
                                        lastName: 'User',
                                        phone: '555-0123',
                                        postalCode: '12345',
                                        stateCode: 'CA'
                                    })
                                }
                            >
                                Continue to Shipping Method
                            </button>
                        </div>
                    )
                }
                MockShippingAddressSelection.propTypes = {onSubmit: PropTypes.func}
                return MockShippingAddressSelection
            }
        )
        // Ensure mutation resolves for this test
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        jest.doMock(
            '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
            () => ({
                useCheckout: jest.fn().mockReturnValue({
                    step: 2,
                    STEPS: {
                        CONTACT_INFO: 0,
                        PICKUP_ADDRESS: 1,
                        SHIPPING_ADDRESS: 2,
                        SHIPPING_OPTIONS: 3
                    },
                    goToStep: mockGoToStep,
                    goToNextStep: mockGoToNextStep,
                    contactPhone: '(727) 555-9999'
                })
            })
        )
        const {renderWithProviders: localRenderWithProviders} = await import(
            '@salesforce/retail-react-app/app/utils/test-utils'
        )
        const module = await import(
            '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
        )
        const Component = module.default
        const {user} = localRenderWithProviders(<Component />)
        // Scope click to the first step container to avoid duplicates
        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        const submitBtn = within(stepContainers[0]).getByText('Continue to Shipping Method')
        await act(async () => {
            await user.click(submitBtn)
        })
        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        const lastCall = mockUpdateShippingAddress.mutateAsync.mock.calls.pop()
        const body = lastCall?.[0]?.body
        expect(body).toHaveProperty('phone', '(727) 555-9999')
    })

    test('component handles different user states correctly', () => {
        renderWithProviders(<ShippingAddress />)

        // Component should render successfully regardless of user state
        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        expect(stepContainers.length).toBeGreaterThan(0)
        // Scope the heading assertion to the first step container to avoid duplicate matches
        expect(
            within(stepContainers[0]).getByRole('heading', {name: 'Shipping Address'})
        ).toBeInTheDocument()
        expect(
            within(stepContainers[0]).getByTestId('shipping-address-selection')
        ).toBeInTheDocument()
    })

    test('renders component without errors', () => {
        renderWithProviders(<ShippingAddress />)

        // Basic rendering test - component should render main elements
        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })

    test('shows multiship header action and toggles to multi-address view', async () => {
        jest.resetModules()
        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
            useCurrentBasket: () => ({
                data: {
                    basketId: 'test-basket-id',
                    productItems: [{itemId: 'i1'}, {itemId: 'i2'}],
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingAddress: null
                        }
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2},
                refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
            })
        }))
        const {renderWithProviders: localRenderWithProviders} = await import(
            '@salesforce/retail-react-app/app/utils/test-utils'
        )
        const module = await import(
            '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
        )
        const Component = module.default

        const {user} = localRenderWithProviders(<Component />)

        const multishipLink = screen.getByRole('button', {
            name: 'Ship to multiple addresses'
        })
        expect(multishipLink).toBeInTheDocument()

        await act(async () => {
            await user.click(multishipLink)
        })

        expect(screen.getByRole('button', {name: 'Ship items to one address'})).toBeInTheDocument()
    })
})
