/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, cleanup} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import PickupAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/pickup-address'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {scapiBasketWithItem} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

// Mock the hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store')
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site')

// Mock ItemAttributes component to avoid variationValues issues
jest.mock('@salesforce/retail-react-app/app/components/item-variant/item-attributes', () => {
    return function MockItemAttributes() {
        return <div data-testid="item-attributes">Item Attributes</div>
    }
})

// Mock goToNextStep function
const mockGoToNextStep = jest.fn()

// Configurable checkout state for tests
const mockCheckoutState = {
    step: 1,
    STEPS: {
        CONTACT_INFO: 0,
        PICKUP_ADDRESS: 1,
        SHIPPING_ADDRESS: 2,
        SHIPPING_OPTIONS: 3,
        PAYMENT: 4,
        REVIEW_ORDER: 5
    },
    goToStep: jest.fn(),
    goToNextStep: mockGoToNextStep
}

const mockProductsArray = [
    {
        id: 'product-1',
        name: 'Test Product 1',
        image: 'product-1-image.jpg',
        price: 29.99,
        variationAttributes: [
            {id: 'color', name: 'Color'},
            {id: 'size', name: 'Size'}
        ]
    },
    {
        id: 'product-2',
        name: 'Test Product 2',
        image: 'product-2-image.jpg',
        price: 19.99,
        variationAttributes: [
            {id: 'color', name: 'Color'},
            {id: 'size', name: 'Size'}
        ]
    }
]

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useStores: () => ({
            data: {
                data: [
                    {
                        id: 'store-1',
                        name: 'Test Store 1',
                        address1: '123 Main Street',
                        city: 'San Francisco',
                        stateCode: 'CA',
                        postalCode: '94105',
                        countryCode: 'US',
                        phone: '555-123-4567',
                        storeHours: 'Mon-Fri: 9AM-6PM',
                        storeType: 'retail'
                    },
                    {
                        id: 'store-2',
                        name: 'Test Store 2',
                        address1: '456 Oak Avenue',
                        city: 'Los Angeles',
                        stateCode: 'CA',
                        postalCode: '90210',
                        countryCode: 'US',
                        phone: '555-987-6543',
                        storeHours: 'Mon-Sat: 10AM-8PM',
                        storeType: 'retail'
                    }
                ]
            },
            isLoading: false
        }),
        useProducts: () => ({
            data: mockProductsArray,
            isLoading: false
        })
    }
})

// Ensure useMultiSite returns site.id = 'site-1' for all tests
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () =>
    jest.fn(() => ({
        site: {id: 'site-1'},
        buildUrl: jest.fn((url) => url)
    }))
)

jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context', () => ({
    useCheckout: () => mockCheckoutState
}))

const server = setupServer()

// Build derivedData consistent with useCurrentBasket
const buildDerivedData = (basket) => {
    const productItems = basket?.productItems || []
    const shipments = basket?.shipments || []
    let totalItems = 0
    const shipmentIdToTotalItems = {}
    productItems.forEach((item) => {
        const quantity = item?.quantity || 0
        totalItems += quantity
        if (item?.shipmentId) {
            shipmentIdToTotalItems[item.shipmentId] =
                (shipmentIdToTotalItems[item.shipmentId] || 0) + quantity
        }
    })
    let totalDeliveryShipments = 0
    let totalPickupShipments = 0
    const pickupStoreIds = []
    let isMissingShippingAddress = false
    let isMissingShippingMethod = false
    shipments.forEach((shipment) => {
        const hasItems = shipmentIdToTotalItems[shipment?.shipmentId] > 0
        if (!hasItems) return
        const isPickup = Boolean(shipment?.shippingMethod?.c_storePickupEnabled)
        if (isPickup) {
            totalPickupShipments += 1
            if (shipment?.c_fromStoreId) pickupStoreIds.push(shipment.c_fromStoreId)
        } else {
            totalDeliveryShipments += 1
            if (!shipment?.shippingAddress) isMissingShippingAddress = true
            if (!shipment?.shippingMethod) isMissingShippingMethod = true
        }
    })
    pickupStoreIds.sort()
    return {
        hasBasket: productItems.length > 0 || shipments.length > 0,
        totalItems,
        shipmentIdToTotalItems,
        totalDeliveryShipments,
        totalPickupShipments,
        pickupStoreIds,
        isMissingShippingAddress,
        isMissingShippingMethod
    }
}

beforeAll(() => {
    server.listen()
})

afterEach(() => {
    server.resetHandlers()
    cleanup()
    jest.clearAllMocks()
})

afterAll(() => {
    server.close()
})

describe('PickupAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGoToNextStep.mockClear()
        // default to editing mode for pickup address
        mockCheckoutState.step = mockCheckoutState.STEPS.PICKUP_ADDRESS
    })

    test('displays pickup address when available', async () => {
        const pickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    shipmentId: 'shipment-1'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: pickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(pickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        expect(screen.getByText(/continue to payment/i)).toBeInTheDocument()

        expect(screen.getByText('Store Information')).toBeInTheDocument()
        expect(screen.getByText('Test Store 1')).toBeInTheDocument()
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA 94105')).toBeInTheDocument()
    })

    test('renders product cards for products ready for pickup from one store', async () => {
        const singleStoreBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 1,
                    productName: 'Pickup Product 1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-1',
                    productId: 'product-2',
                    quantity: 2,
                    productName: 'Pickup Product 2'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: singleStoreBasket,
            isLoading: false,
            derivedData: buildDerivedData(singleStoreBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        // Product cards show product names and quantities
        expect(screen.getByText('Pickup Product 1')).toBeInTheDocument()
        expect(screen.getByText('Pickup Product 2')).toBeInTheDocument()
        expect(screen.getByText('Qty: 1')).toBeInTheDocument()
        expect(screen.getByText('Qty: 2')).toBeInTheDocument()
    })

    test('shows "Show Products" edit label button when not editing', async () => {
        // Switch out of editing mode to summary mode
        mockCheckoutState.step = mockCheckoutState.STEPS.SHIPPING_ADDRESS

        const singlePickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 1,
                    productName: 'Pickup Product 1'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: singlePickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(singlePickupBasket)
        })

        useSelectedStore.mockReturnValue({selectedStore: null})

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        // ToggleCard's edit button label
        expect(screen.getByRole('button', {name: 'Show Products'})).toBeInTheDocument()
    })

    test('continues to payment when button is clicked', async () => {
        const pickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    shipmentId: 'shipment-1'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: pickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(pickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText(/continue to payment/i)).toBeInTheDocument()
        })

        await user.click(screen.getByText(/continue to payment/i))

        await waitFor(() => {
            expect(mockGoToNextStep).toHaveBeenCalled()
        })
    })

    test('displays multiple pickup locations for multi-pickup orders', async () => {
        const multiPickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-2'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 2,
                    productName: 'Test Product 1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2',
                    productId: 'product-2',
                    quantity: 1,
                    productName: 'Test Product 2'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: multiPickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(multiPickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            },
                            {
                                id: 'store-2',
                                name: 'Test Store 2',
                                address1: '456 Oak Avenue',
                                city: 'Los Angeles',
                                stateCode: 'CA',
                                postalCode: '90210',
                                countryCode: 'US',
                                phone: '555-987-6543',
                                storeHours: 'Mon-Sat: 10AM-8PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        const storeInfoSections = screen.getAllByText('Store Information')
        expect(storeInfoSections).toHaveLength(2)

        // Check that both store names are displayed
        expect(screen.getByText('Test Store 1')).toBeInTheDocument()
        expect(screen.getByText('Test Store 2')).toBeInTheDocument()

        // store addresses are displayed
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA 94105')).toBeInTheDocument()
        expect(screen.getByText('Los Angeles, CA 90210')).toBeInTheDocument()
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText(/continue to payment/i)).toBeInTheDocument()
    })

    test('shows "Continue to Shipping Address" for mixed orders', async () => {
        const mixedBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: false}
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    shipmentId: 'shipment-1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: mixedBasket,
            isLoading: false,
            derivedData: buildDerivedData(mixedBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        expect(screen.getByText(/continue to shipping address/i)).toBeInTheDocument()
    })

    test('continues to payment for multi pickup orders', async () => {
        const multiPickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-2'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 2,
                    productName: 'Test Product 1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2',
                    productId: 'product-2',
                    quantity: 1,
                    productName: 'Test Product 2'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: multiPickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(multiPickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            },
                            {
                                id: 'store-2',
                                name: 'Test Store 2',
                                address1: '456 Oak Avenue',
                                city: 'Los Angeles',
                                stateCode: 'CA',
                                postalCode: '90210',
                                countryCode: 'US',
                                phone: '555-987-6543',
                                storeHours: 'Mon-Sat: 10AM-8PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText(/continue to payment/i)).toBeInTheDocument()
        })
        await user.click(screen.getByText(/continue to payment/i))
        await waitFor(() => {
            expect(mockGoToNextStep).toHaveBeenCalled()
        })
    })

    test('continues to payment for single pickup order', async () => {
        const singlePickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    shipmentId: 'shipment-1'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: singlePickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(singlePickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText(/continue to payment/i)).toBeInTheDocument()
        })
        await user.click(screen.getByText(/continue to payment/i))
        await waitFor(() => {
            expect(mockGoToNextStep).toHaveBeenCalled()
        })
    })

    test('continues to shipping address for mixed pickup and delivery orders', async () => {
        const mixedBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-2'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-3',
                    shippingMethod: {c_storePickupEnabled: false}
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 1,
                    productName: 'Pickup Product 1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2',
                    productId: 'product-2',
                    quantity: 1,
                    productName: 'Pickup Product 2'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-3',
                    shipmentId: 'shipment-3',
                    productId: 'product-3',
                    quantity: 1,
                    productName: 'Delivery Product'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: mixedBasket,
            isLoading: false,
            derivedData: buildDerivedData(mixedBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            },
                            {
                                id: 'store-2',
                                name: 'Test Store 2',
                                address1: '456 Oak Avenue',
                                city: 'Los Angeles',
                                stateCode: 'CA',
                                postalCode: '90210',
                                countryCode: 'US',
                                phone: '555-987-6543',
                                storeHours: 'Mon-Sat: 10AM-8PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        const {user} = renderWithProviders(<PickupAddress />)
        await waitFor(() => {
            expect(screen.getByText(/continue to shipping address/i)).toBeInTheDocument()
        })
        await user.click(screen.getByText(/continue to shipping address/i))
        await waitFor(() => {
            expect(mockGoToNextStep).toHaveBeenCalled()
        })
    })

    test('renders product items are rendered in a mixed basket 1 pickup', async () => {
        const pickupBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: false}
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 2,
                    productName: 'Test Product 1'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: pickupBasket,
            isLoading: false,
            derivedData: buildDerivedData(pickupBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )
        renderWithProviders(<PickupAddress />)
        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Qty: 2')).toBeInTheDocument()
    })

    test('renders multiple products in mixed basket 1 pickup', async () => {
        const multiProductBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: false}
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 1,
                    productName: 'Regular Product 1'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-1',
                    productId: 'product-2',
                    quantity: 3,
                    productName: 'Regular Product 2'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-3',
                    shipmentId: 'shipment-1',
                    productId: 'bonus-1',
                    quantity: 1,
                    productName: 'Bonus Product 1',
                    bonusProductLineItem: true
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: multiProductBasket,
            isLoading: false,
            derivedData: buildDerivedData(multiProductBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)
        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        expect(screen.getByText('Regular Product 1')).toBeInTheDocument()
        expect(screen.getByText('Regular Product 2')).toBeInTheDocument()
        expect(screen.getByText('Bonus Items')).toBeInTheDocument()
        expect(screen.getByText('Bonus Product 1')).toBeInTheDocument()
    })

    test('product rendering on multiple pickup stores in checkout', async () => {
        const multiStoreBasket = {
            ...scapiBasketWithItem,
            shipments: [
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-1',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-1'
                },
                {
                    ...scapiBasketWithItem.shipments[0],
                    shipmentId: 'shipment-2',
                    shippingMethod: {c_storePickupEnabled: true},
                    c_fromStoreId: 'store-2'
                }
            ],
            productItems: [
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-1',
                    shipmentId: 'shipment-1',
                    productId: 'product-1',
                    quantity: 2,
                    productName: 'Store 1 Product'
                },
                {
                    ...scapiBasketWithItem.productItems[0],
                    itemId: 'item-2',
                    shipmentId: 'shipment-2',
                    productId: 'product-2',
                    quantity: 1,
                    productName: 'Store 2 Product'
                }
            ]
        }

        useCurrentBasket.mockReturnValue({
            data: multiStoreBasket,
            isLoading: false,
            derivedData: buildDerivedData(multiStoreBasket)
        })

        useSelectedStore.mockReturnValue({
            selectedStore: null
        })

        global.server.use(
            rest.get('*/stores', (req, res, ctx) => {
                return res(
                    ctx.json({
                        data: [
                            {
                                id: 'store-1',
                                name: 'Test Store 1',
                                address1: '123 Main Street',
                                city: 'San Francisco',
                                stateCode: 'CA',
                                postalCode: '94105',
                                countryCode: 'US',
                                phone: '555-123-4567',
                                storeHours: 'Mon-Fri: 9AM-6PM',
                                storeType: 'retail'
                            },
                            {
                                id: 'store-2',
                                name: 'Test Store 2',
                                address1: '456 Oak Avenue',
                                city: 'Los Angeles',
                                stateCode: 'CA',
                                postalCode: '90210',
                                countryCode: 'US',
                                phone: '555-987-6543',
                                storeHours: 'Mon-Sat: 10AM-8PM',
                                storeType: 'retail'
                            }
                        ]
                    })
                )
            })
        )

        renderWithProviders(<PickupAddress />)
        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })
        // both stores
        const storeInfoSections = screen.getAllByText('Store Information')
        expect(storeInfoSections).toHaveLength(2)
        expect(screen.getByText('Test Store 1')).toBeInTheDocument()
        expect(screen.getByText('Test Store 2')).toBeInTheDocument()
        // each store pdts
        expect(screen.getByText('Store 1 Product')).toBeInTheDocument()
        expect(screen.getByText('Store 2 Product')).toBeInTheDocument()
    })
})
