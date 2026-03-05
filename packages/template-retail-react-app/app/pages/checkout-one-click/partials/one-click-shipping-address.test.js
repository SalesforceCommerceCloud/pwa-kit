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
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'

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
        useShopperBasketsV2Mutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateShippingAddressForShipment')
                return mockUpdateShippingAddress
            return {mutateAsync: jest.fn()}
        }),
        useShopperCustomersMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'createCustomerAddress') return mockCreateCustomerAddress
            if (mutationType === 'updateCustomerAddress') return mockUpdateCustomerAddress
            if (mutationType === 'createCustomerProductList') return mockCreateCustomerProductList
            return {mutateAsync: jest.fn()}
        }),
        useShippingMethodsForShipment: jest.fn().mockReturnValue({
            refetch: jest.fn().mockResolvedValue({
                data: {
                    applicableShippingMethods: []
                }
            })
        })
    }
})

const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: (...args) => mockUseCurrentCustomer(...args)
}))

const mockUseCurrentBasket = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: (...args) => mockUseCurrentBasket(...args)
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
            contactPhone: '(727) 555-0000',
            setConsolidationLock: jest.fn()
        })
    })
)

let mockSubmitAddress = {
    addressId: 'test-address',
    address1: '123 Test St',
    city: 'Test City',
    countryCode: 'US',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-0123',
    postalCode: '12345',
    stateCode: 'CA'
}

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection',
    () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PropTypes = require('prop-types')

        function MockShippingAddressSelection({onSubmit}) {
            return (
                <div data-testid="shipping-address-selection">
                    <button onClick={() => onSubmit(mockSubmitAddress)}>
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

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-multi-address',
    () =>
        function MockMultiAddress() {
            return <div data-testid="multi-address-view" />
        }
)

const mockRemoveEmptyShipments = jest.fn().mockResolvedValue({})
const mockUpdateItemsToDeliveryShipment = jest.fn().mockResolvedValue({})

jest.mock('@salesforce/retail-react-app/app/hooks/use-multiship', () => ({
    useMultiship: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-item-shipment-management', () => ({
    useItemShipmentManagement: jest.fn()
}))

const defaultCustomer = {
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

const defaultBasket = {
    basketId: 'test-basket-id',
    shipments: [{shippingAddress: null}]
}

const defaultCheckout = {
    step: 2,
    STEPS: {
        CONTACT_INFO: 0,
        PICKUP_ADDRESS: 1,
        SHIPPING_ADDRESS: 2,
        SHIPPING_OPTIONS: 3
    },
    goToStep: mockGoToStep,
    goToNextStep: mockGoToNextStep,
    contactPhone: '(727) 555-0000',
    setConsolidationLock: jest.fn()
}

beforeEach(() => {
    jest.clearAllMocks()

    mockSubmitAddress = {
        addressId: 'test-address',
        address1: '123 Test St',
        city: 'Test City',
        countryCode: 'US',
        firstName: 'Test',
        lastName: 'User',
        phone: '555-0123',
        postalCode: '12345',
        stateCode: 'CA'
    }
    mockUseCurrentCustomer.mockReturnValue({data: defaultCustomer})
    mockUseCurrentBasket.mockReturnValue({
        data: defaultBasket,
        derivedData: {hasBasket: true, totalItems: 1},
        refetch: mockRefetch
    })
    useCheckout.mockReturnValue(defaultCheckout)
    useMultiship.mockReturnValue({removeEmptyShipments: mockRemoveEmptyShipments})
    useItemShipmentManagement.mockReturnValue({
        updateItemsToDeliveryShipment: mockUpdateItemsToDeliveryShipment
    })

    global.server.use(
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json({total: 0, data: []}))
        }),
        rest.get('*/customers/:customerId/product-lists/*', (req, res, ctx) => {
            return res(ctx.json({}))
        }),
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

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        const stepContainersA = screen.getAllByTestId('sf-toggle-card-step-1')
        const selectionA = within(stepContainersA[0]).getByTestId('shipping-address-selection')
        expect(
            within(selectionA).getByRole('button', {name: /Continue to Shipping Method/i})
        ).toBeInTheDocument()
    })

    test('renders address selection component correctly', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
    })

    test('handles user interactions correctly', async () => {
        const {user} = renderWithProviders(<ShippingAddress />)
        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        const selection = within(stepContainers[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selection).getByRole('button', {
            name: /Continue to Shipping Method/i
        })

        expect(submitButton).toBeInTheDocument()
        await act(async () => {
            await user.click(submitButton)
        })
        await waitForNotLoading()

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })

    test('renders form elements correctly', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        const stepContainersB = screen.getAllByTestId('sf-toggle-card-step-1')
        const selectionB = within(stepContainersB[0]).getByTestId('shipping-address-selection')
        expect(
            within(selectionB).getByRole('button', {name: /Continue to Shipping Method/i})
        ).toBeInTheDocument()
    })

    test('component integrates with address selection correctly', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
        expect(screen.getByTestId('shipping-address-selection')).toBeInTheDocument()
        const stepContainersC = screen.getAllByTestId('sf-toggle-card-step-1')
        const selectionC = within(stepContainersC[0]).getByTestId('shipping-address-selection')
        expect(
            within(selectionC).getByRole('button', {name: /Continue to Shipping Method/i})
        ).toBeInTheDocument()
    })

    test('does not run auto-select when isShipmentCleanupComplete is false', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        renderWithProviders(<ShippingAddress isShipmentCleanupComplete={false} />)
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
        })
        expect(mockUpdateShippingAddress.mutateAsync).not.toHaveBeenCalled()
    })

    test('runs auto-select when isShipmentCleanupComplete is true', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        renderWithProviders(<ShippingAddress isShipmentCleanupComplete={true} />)
        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()
    })

    test('handles submission errors gracefully', async () => {
        mockUpdateShippingAddress.mutateAsync.mockRejectedValue(new Error('API Error'))

        const {user} = renderWithProviders(<ShippingAddress />)

        const stepContainersD = screen.getAllByTestId('sf-toggle-card-step-1')
        const selectionD = within(stepContainersD[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selectionD).getByRole('button', {
            name: /Continue to Shipping Method/i
        })
        await act(async () => {
            await user.click(submitButton)
        })

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()

        expect(mockGoToNextStep).not.toHaveBeenCalled()
    })

    test('targets delivery shipment id when saving address in mixed cart', async () => {
        const deliveryId = 'delivery-1'
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'pickup-1',
                        shippingAddress: null,
                        shippingMethod: {c_storePickupEnabled: true}
                    },
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

        const {user} = renderWithProviders(<ShippingAddress />)
        const steps = screen.getAllByTestId('sf-toggle-card-step-1')
        const sel = within(steps[0]).getByTestId('shipping-address-selection')
        await user.click(within(sel).getByRole('button', {name: /Continue to Shipping Method/i}))
        const last = mockUpdateShippingAddress.mutateAsync.mock.calls.pop()?.[0]
        expect(last.parameters).toMatchObject({shipmentId: deliveryId})
    })

    test('shows loading state during address submission', async () => {
        mockUpdateShippingAddress.mutateAsync.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        )

        const {user} = renderWithProviders(<ShippingAddress />)

        const stepContainersE = screen.getAllByTestId('sf-toggle-card-step-1')
        const selectionE = within(stepContainersE[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selectionE).getByRole('button', {
            name: /Continue to Shipping Method/i
        })
        await act(async () => {
            await user.click(submitButton)
        })

        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        await waitForNotLoading()
    })

    test('submits shipping address with phone for registered user (from address/customer)', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        const {user} = renderWithProviders(<ShippingAddress />)
        await act(async () => {
            const steps = screen.getAllByTestId('sf-toggle-card-step-1')
            const sel = within(steps[0]).getByTestId('shipping-address-selection')
            await user.click(
                within(sel).getByRole('button', {name: /Continue to Shipping Method/i})
            )
        })
        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()
        const lastCall = mockUpdateShippingAddress.mutateAsync.mock.calls.pop()
        const body = lastCall?.[0]?.body
        expect(body).toHaveProperty('phone')
        expect(body.phone).toBeDefined()
    })

    test('submits shipping address with contactPhone for guest user', async () => {
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: null, isRegistered: false}
        })
        useCheckout.mockReturnValue({...defaultCheckout, contactPhone: '(727) 555-9999'})
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
                    contactPhone: '(727) 555-9999',
                    setConsolidationLock: jest.fn()
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

        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        expect(stepContainers.length).toBeGreaterThan(0)
        expect(
            within(stepContainers[0]).getByRole('heading', {name: 'Shipping Address'})
        ).toBeInTheDocument()
        expect(
            within(stepContainers[0]).getByTestId('shipping-address-selection')
        ).toBeInTheDocument()
    })

    test('renders component without errors', () => {
        renderWithProviders(<ShippingAddress />)

        expect(screen.getByText('Shipping Address')).toBeInTheDocument()
    })

    test('toggles between single and multi-address views', async () => {
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                productItems: [
                    {itemId: 'i1', shipmentId: 'me'},
                    {itemId: 'i2', shipmentId: 'me'}
                ],
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    }
                ]
            },
            derivedData: {hasBasket: true, totalItems: 2},
            refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
        })

        const {user} = renderWithProviders(<ShippingAddress />)

        const multishipLink = screen.getByRole('button', {
            name: 'Ship to multiple addresses'
        })
        expect(multishipLink).toBeInTheDocument()

        await act(async () => {
            await user.click(multishipLink)
        })

        expect(screen.getByRole('button', {name: 'Ship items to one address'})).toBeInTheDocument()
    })
    test('consolidates multiple shipments when shipping to single address', async () => {
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                productItems: [
                    {itemId: 'i1', shipmentId: 'me'},
                    {itemId: 'i2', shipmentId: 'delivery-shipment'}
                ],
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    },
                    {
                        shipmentId: 'delivery-shipment',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    }
                ]
            },
            derivedData: {hasBasket: true, totalItems: 2},
            refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
        })

        const {user} = renderWithProviders(<ShippingAddress />)

        // With multiple delivery shipments the component shows multi-address view first.
        // Click "Ship items to one address" to switch to single-address form.
        const shipToOneAddressButtons = screen.getAllByRole('button', {
            name: 'Ship items to one address'
        })
        await act(async () => {
            await user.click(shipToOneAddressButtons[0])
        })

        const continueButtons = screen.getAllByRole('button', {
            name: 'Continue to Shipping Method'
        })
        const continueButton = continueButtons[0]
        await act(async () => {
            await user.click(continueButton)
        })

        // Wait for async submit flow (address update -> optional customer address -> remove empty)
        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(mockRemoveEmptyShipments).toHaveBeenCalled()
        })
    })

    test('hides multiship option when only one delivery item exists with pickup items', () => {
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                productItems: [
                    {itemId: 'i1', shipmentId: 'delivery-shipment'},
                    {itemId: 'i2', shipmentId: 'pickup-shipment'}
                ],
                shipments: [
                    {
                        shipmentId: 'delivery-shipment',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    },
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {c_storePickupEnabled: true},
                        c_fromStoreId: 'store-123'
                    }
                ]
            },
            derivedData: {hasBasket: true, totalItems: 2},
            refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
        })

        renderWithProviders(<ShippingAddress />)
        expect(screen.queryByTestId('edit-action-button')).not.toBeInTheDocument()
    })

    test('auto-selects preferred address for multi-shipment orders and consolidates items', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        mockUpdateItemsToDeliveryShipment.mockResolvedValue({
            basketId: 'test-basket-id',
            shipments: [
                {
                    shipmentId: 'me',
                    shippingAddress: {address1: '123 Main St', city: 'Test City'}
                }
            ]
        })
        mockRemoveEmptyShipments.mockResolvedValue({})

        const preferredAddress = {
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

        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
            useCurrentCustomer: () => ({
                data: {
                    customerId: 'test-customer-id',
                    isRegistered: true,
                    addresses: [preferredAddress]
                }
            })
        }))

        jest.doMock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
            useCurrentBasket: () => ({
                data: {
                    basketId: 'test-basket-id',
                    productItems: [
                        {itemId: 'i1', shipmentId: 'me'},
                        {itemId: 'i2', shipmentId: 'delivery-shipment-2'}
                    ],
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {
                                c_storePickupEnabled: false
                            },
                            shippingAddress: null
                        },
                        {
                            shipmentId: 'delivery-shipment-2',
                            shippingMethod: {
                                c_storePickupEnabled: false
                            },
                            shippingAddress: null
                        }
                    ]
                },
                derivedData: {hasBasket: true, totalItems: 2},
                refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
            })
        }))

        jest.doMock(
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
                    contactPhone: '(727) 555-0000',
                    setConsolidationLock: jest.fn()
                })
            })
        )

        jest.doMock('@salesforce/retail-react-app/app/hooks/use-multiship', () => ({
            useMultiship: jest.fn(() => ({
                removeEmptyShipments: mockRemoveEmptyShipments
            }))
        }))

        jest.doMock('@salesforce/retail-react-app/app/hooks/use-item-shipment-management', () => ({
            useItemShipmentManagement: jest.fn(() => ({
                updateItemsToDeliveryShipment: mockUpdateItemsToDeliveryShipment
            }))
        }))

        jest.doMock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
            getConfig: jest.fn(() => ({
                app: {
                    ...mockConfig.app,
                    multishipEnabled: true
                }
            }))
        }))

        jest.doMock('@salesforce/commerce-sdk-react', () => {
            const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
            return {
                ...originalModule,
                useShopperBasketsV2Mutation: jest.fn().mockImplementation((mutationType) => {
                    if (mutationType === 'updateShippingAddressForShipment')
                        return mockUpdateShippingAddress
                    return {mutateAsync: jest.fn()}
                }),
                useShopperCustomersMutation: jest.fn().mockImplementation((mutationType) => {
                    if (mutationType === 'createCustomerAddress') return mockCreateCustomerAddress
                    if (mutationType === 'updateCustomerAddress') return mockUpdateCustomerAddress
                    if (mutationType === 'createCustomerProductList')
                        return mockCreateCustomerProductList
                    return {mutateAsync: jest.fn()}
                }),
                useShippingMethodsForShipment: jest.fn().mockReturnValue({
                    refetch: jest.fn().mockResolvedValue({
                        data: {
                            applicableShippingMethods: []
                        }
                    })
                })
            }
        })

        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                productItems: [
                    {itemId: 'i1', shipmentId: 'me'},
                    {itemId: 'i2', shipmentId: 'delivery-shipment-2'}
                ],
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    },
                    {
                        shipmentId: 'delivery-shipment-2',
                        shippingMethod: {c_storePickupEnabled: false},
                        shippingAddress: null
                    }
                ]
            },
            derivedData: {hasBasket: true, totalItems: 2},
            refetch: jest.fn().mockResolvedValue({data: {basketId: 'test-basket-id'}})
        })

        renderWithProviders(<ShippingAddress />)

        await waitFor(
            () => {
                expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalledWith(
                    expect.objectContaining({
                        parameters: expect.objectContaining({
                            basketId: 'test-basket-id',
                            shipmentId: expect.any(String)
                        }),
                        body: expect.objectContaining({
                            address1: '123 Main St',
                            city: 'Test City',
                            countryCode: 'US',
                            firstName: 'John',
                            lastName: 'Doe',
                            postalCode: '12345',
                            stateCode: 'CA'
                        })
                    })
                )
            },
            {timeout: 3000}
        )

        await waitFor(() => {
            expect(mockUpdateItemsToDeliveryShipment).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(mockRemoveEmptyShipments).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(mockGoToNextStep).toHaveBeenCalled()
        })
    })

    test('does not save address for newly registered users when enableUserRegistration is true', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        const {user} = renderWithProviders(<ShippingAddress enableUserRegistration={true} />)

        // Wait for the address selection form to be visible (may race with auto-select)
        const selection = await waitFor(() => screen.getByTestId('shipping-address-selection'), {
            timeout: 2000
        })
        const submitButton = within(selection).getByRole('button', {
            name: /Continue to Shipping Method/i
        })

        await act(async () => {
            await user.click(submitButton)
        })

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()

        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        expect(mockCreateCustomerAddress.mutateAsync).not.toHaveBeenCalled()
    })

    test('saves address for existing registered users when enableUserRegistration is false', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        mockCreateCustomerAddress.mutateAsync.mockResolvedValue({})
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: 'test-customer-id', isRegistered: true, addresses: []}
        })
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                shipments: [{shipmentId: 'me', shippingAddress: null}],
                productItems: [{shipmentId: 'me'}]
            },
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: mockRefetch
        })
        // Submit new address (no addressId) so component creates customer address and updates basket
        mockSubmitAddress = {
            address1: '123 Test St',
            city: 'Test City',
            countryCode: 'US',
            firstName: 'Test',
            lastName: 'User',
            phone: '555-0123',
            postalCode: '12345',
            stateCode: 'CA'
        }

        const {user} = renderWithProviders(<ShippingAddress enableUserRegistration={false} />)

        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        const selection = within(stepContainers[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selection).getByRole('button', {
            name: /Continue to Shipping Method/i
        })

        await act(async () => {
            await user.click(submitButton)
        })

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()

        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        expect(mockCreateCustomerAddress.mutateAsync).toHaveBeenCalled()
    })

    test('saves address for existing registered users when enableUserRegistration prop is not provided', async () => {
        mockUpdateShippingAddress.mutateAsync.mockResolvedValue({})
        mockCreateCustomerAddress.mutateAsync.mockResolvedValue({})
        mockUseCurrentCustomer.mockReturnValue({
            data: {customerId: 'test-customer-id', isRegistered: true, addresses: []}
        })
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                shipments: [{shipmentId: 'me', shippingAddress: null}],
                productItems: [{shipmentId: 'me'}]
            },
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: mockRefetch
        })
        // Submit new address (no addressId) so component creates customer address and updates basket
        mockSubmitAddress = {
            address1: '123 Test St',
            city: 'Test City',
            countryCode: 'US',
            firstName: 'Test',
            lastName: 'User',
            phone: '555-0123',
            postalCode: '12345',
            stateCode: 'CA'
        }

        const {user} = renderWithProviders(<ShippingAddress />)

        const stepContainers = screen.getAllByTestId('sf-toggle-card-step-1')
        const selection = within(stepContainers[0]).getByTestId('shipping-address-selection')
        const submitButton = within(selection).getByRole('button', {
            name: /Continue to Shipping Method/i
        })

        await act(async () => {
            await user.click(submitButton)
        })

        await waitFor(() => {
            expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        })
        await waitForNotLoading()

        expect(mockUpdateShippingAddress.mutateAsync).toHaveBeenCalled()
        expect(mockCreateCustomerAddress.mutateAsync).toHaveBeenCalled()
    })
})
