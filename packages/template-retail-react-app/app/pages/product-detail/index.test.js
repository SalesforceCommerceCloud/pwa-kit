/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent, screen, waitFor, within} from '@testing-library/react'
import {
    mockCustomerBaskets,
    mockedCustomerProductLists
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    basketWithProductSet,
    mockWishlistWithItem,
    einsteinRecommendation,
    masterProduct,
    productsForEinstein
} from '@salesforce/retail-react-app/app/pages/product-detail/index.mock'
import mockedProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
import {
    mockProductBundle,
    basketWithProductBundle,
    bundleProductItemsForPDP
} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import {mockStandardProductOrderable} from '@salesforce/retail-react-app/app/mocks/standard-product'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

jest.setTimeout(60000)

jest.useFakeTimers()

const mockAddToWishlist = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperCustomersMutation: (mutation) => {
            if (mutation === 'createCustomerProductListItem') {
                return {mutate: mockAddToWishlist}
            } else {
                return originalModule.useShopperCustomersMutation(mutation)
            }
        }
    }
})

// Mock Einstein hook
const mockSendAddToCart = jest.fn()
const mockSendViewProduct = jest.fn()
const mockGetRecommendations = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-einstein', () => ({
    __esModule: true,
    default: () => ({
        sendAddToCart: mockSendAddToCart,
        sendViewProduct: mockSendViewProduct,
        getRecommendations: mockGetRecommendations
    })
}))

jest.mock('@salesforce/retail-react-app/app/components/recommended-products', () => {
    const MockedRecommendedProducts = ({title}) => {
        return (
            <div data-testid="recommended-products">
                <h2>{title}</h2>
                <div>Summer Bomber Jacket</div>
            </div>
        )
    }

    MockedRecommendedProducts.propTypes = {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        title: require('prop-types').node
    }

    return MockedRecommendedProducts
})

// Mock getConfig to return test values
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        ...mockConfig,
        app: {
            ...mockConfig.app,
            storeLocatorEnabled: true,
            multishipEnabled: false
        }
    }))
}))

jest.mock('@salesforce/retail-react-app/app/constants', () => {
    const originalModule = jest.requireActual('@salesforce/retail-react-app/app/constants')
    return {
        ...originalModule,
        DEFAULT_DNT_STATE: false,
        STORE_LOCATOR_IS_ENABLED: true
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-store-locator', () => ({
    useStoreLocatorModal: jest.fn(() => ({
        isOpen: false,
        onOpen: jest.fn(),
        onClose: jest.fn()
    }))
}))

// Mock useSelectedStore hook
const mockUseSelectedStore = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: () => mockUseSelectedStore()
}))

// Mock useMultiship hook
const mockGetShipmentForItems = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-multiship', () => ({
    useMultiship: () => ({
        getShipmentIdForItems: mockGetShipmentForItems
    })
}))

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path="/uk/en-GB/product/:productId"
                render={(props) => <ProductDetail {...props} />}
            />
        </Switch>
    )
}

beforeEach(() => {
    jest.resetModules()

    // Default mock for useSelectedStore (no selected store by default)
    mockUseSelectedStore.mockImplementation(() => ({
        selectedStore: null,
        isLoading: false,
        error: null,
        hasSelectedStore: false
    }))
    mockGetShipmentForItems.mockResolvedValue('me')

    global.server.use(
        // By default, the page will be rendered with a product set
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedProductSet))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        }),
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedCustomerProductLists))
        }),
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.json(productsForEinstein))
        }),
        rest.post('*/v3/personalization/recs/EinsteinTestSite/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(einsteinRecommendation))
        })
    )

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/25517823M')
})

afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
})

test('should render product details page', async () => {
    global.server.use(
        // Use a single product (and not a product set)
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(masterProduct))
        })
    )

    renderWithProviders(<MockedComponent />)

    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    await waitFor(() => {
        expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        expect(screen.getAllByText(/Long Sleeve Crew Neck/)).toHaveLength(2)
        expect(screen.getAllByText(/from £9\.59/i)).toHaveLength(2)
        expect(screen.getAllByText(/£15\.36/i)).toHaveLength(4)
        expect(screen.getAllByText(/Add to Cart/)).toHaveLength(2)
        expect(screen.getAllByText(/Add to Wishlist/)).toHaveLength(2)
        expect(screen.getAllByTestId('product-view')).toHaveLength(1)
        expect(screen.getByText(/You might also like/i)).toBeInTheDocument()
    })
})

test('should add to wishlist', async () => {
    global.server.use(
        // Use a single product (and not a product set)
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(masterProduct))
        })
    )

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    // wait for data to fully loaded before taking any action
    await waitFor(() => {
        expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        expect(screen.getAllByText(/Long Sleeve Crew Neck/)).toHaveLength(2)
        expect(screen.getByText(/You might also like/i)).toBeInTheDocument()
    })
    const wishlistButton = await screen.findByRole('button', {name: 'Add to Wishlist'})

    fireEvent.click(wishlistButton)
    await waitFor(() => {
        expect(mockAddToWishlist).toHaveBeenCalledTimes(1)
    })
})

test('should not add to wishlist if item is already in wishlist', async () => {
    global.server.use(
        // Use a product that is already in the wishlist
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(masterProduct))
        }),
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockWishlistWithItem))
        })
    )

    renderWithProviders(<MockedComponent />)
    // wait for data to fully loaded before taking any action
    await waitFor(() => {
        expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        expect(screen.getAllByText(/Long Sleeve Crew Neck/)).toHaveLength(2)
        expect(screen.getByText(/You might also like/i)).toBeInTheDocument()
    })
    const wishlistButton = await screen.findByRole('button', {name: 'Add to Wishlist'})

    fireEvent.click(wishlistButton)
    await waitFor(() => {
        expect(mockAddToWishlist).toHaveBeenCalledTimes(0)
    })
})

describe('product set', () => {
    beforeEach(() => {
        global.server.use(
            // For adding items to basket
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                return res(ctx.json(basketWithProductSet))
            })
        )
    })

    test('render multi-product layout', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
            expect(screen.getAllByTestId('product-view')).toHaveLength(4) // 1 parent + 3 children
        })
    })

    test('add the set to cart successfully', async () => {
        const urlPathAfterSelectingAllVariants = `/uk/en-GB/product/winter-lookM?${new URLSearchParams(
            {
                '25518447M': 'color=JJ5FUXX&size=9MD',
                '25518704M': 'color=JJ2XNXX&size=9MD',
                '25772717M': 'color=TAUPETX&size=070&width=M'
            }
        )}`
        window.history.pushState({}, 'ProductDetail', urlPathAfterSelectingAllVariants)

        // Initial basket is necessary to add items to it
        const initialBasket = {basketId: 'valid_id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(
            () => {
                expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()

                expect(screen.getAllByText('Winter Look')[0]).toBeInTheDocument()
                expect(screen.getAllByText('Quilted Jacket')[0]).toBeInTheDocument()
                expect(screen.getAllByText('Pull On Pant')[0]).toBeInTheDocument()
                expect(screen.getAllByText('Zerrick')[0]).toBeInTheDocument()
                expect(
                    screen.getByRole('heading', {name: /you might also like/i})
                ).toBeInTheDocument()
            },
            {timeout: 5000}
        )

        const buttons = await screen.findAllByText(/add set to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(
            () => {
                const modal = screen.getByTestId('add-to-cart-modal')
                expect(within(modal).getByText(/items added to cart/i)).toBeInTheDocument()
                expect(within(modal).getByText(/Quilted Jacket/i)).toBeInTheDocument()
                expect(within(modal).getByText(/Pull On Pant/i)).toBeInTheDocument()
                expect(within(modal).getByText(/Zerrick/i)).toBeInTheDocument()
            },
            // Seems like rendering the modal takes a bit more time
            {timeout: 10000}
        )
    })

    test('add the set to cart with error messages', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(
            () => {
                expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
                expect(screen.getAllByText('Winter Look')[0]).toBeInTheDocument()
            },
            {timeout: 5000}
        )

        const buttons = await screen.findAllByText(/add set to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(() => {
            // Show error when users have not selected all the variants yet
            // 1 error for each child product
            const errorMessages = screen.getAllByText(/Please select all your options above/i)
            expect(errorMessages).toHaveLength(3)
        })
    })

    test("child products' images are lazy loaded", async () => {
        renderWithProviders(<MockedComponent />)
        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        })

        const childProducts = await screen.findAllByTestId('child-product')

        childProducts.forEach((child) => {
            const heroImage = within(child).getAllByRole('img')[0]
            expect(heroImage.getAttribute('loading')).toBe('lazy')
        })
    })

    test('pickup in store radio is enabled when all child products have inventory in selected store', async () => {
        const inventoryId = 'inventory_m_store_store1'
        const storeId = 'store-123'

        // Mock useSelectedStore to return a store with inventoryId
        mockUseSelectedStore.mockImplementation(() => ({
            selectedStore: {
                id: storeId,
                name: 'Test Store',
                inventoryId: inventoryId
            },
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))

        // Create product set with parent and child products that all have inventory in the selected store
        const productSetWithInventory = {
            ...mockedProductSet,
            setProducts: mockedProductSet.setProducts.map((childProduct) => ({
                ...childProduct,
                inventories: [
                    {
                        id: inventoryId,
                        orderable: true,
                        ats: 10,
                        stockLevel: 10
                    }
                ]
            }))
        }

        global.server.use(
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(productSetWithInventory))
            })
        )

        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        })

        // Wait for child products to load
        const childProducts = await screen.findAllByTestId('child-product')
        expect(childProducts).toHaveLength(3) // 3 child products in the winter look set

        // Check that each child product has pickup in store radio enabled
        for (const childProduct of childProducts) {
            await waitFor(() => {
                const pickupRadio = within(childProduct).getByRole('radio', {
                    name: /pick up in store/i
                })
                expect(pickupRadio).toBeEnabled()
            })
        }

        // Check that the parent product pickup in store radio is also enabled
        const allPickupRadios = await screen.findAllByRole('radio', {name: /pick up in store/i})
        // Should have 4 pickup radios total: 1 parent + 3 children
        expect(allPickupRadios).toHaveLength(4)

        // The first pickup radio should be the parent product (rendered before child products)
        const parentPickupRadio = allPickupRadios[0]
        expect(parentPickupRadio).toBeEnabled()
    })
})

describe('Recommended Products', () => {
    test('Recently Viewed gets updated when navigating between products', async () => {
        global.server.use(
            // Use a single product (and not a product set)
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(masterProduct))
            })
        )
        // const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})
        renderWithProviders(<MockedComponent />)

        // If we poll for updates immediately, the test output is flooded with errors:
        // "Warning: An update to WrappedComponent inside a test was not wrapped in act(...)."
        // If we wait to poll until the component is updated, then the errors disappear. Using a
        // timeout is clearly a suboptimal solution, but I don't know the "correct" way to fix it.
        // let done = false
        // setTimeout(() => (done = true), 200)
        // await waitFor(() => expect(done).toBeTruthy())

        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
            expect(screen.getByText(/You might also like/i)).toBeInTheDocument()
            expect(screen.getAllByText(/Long Sleeve Crew Neck/)).toHaveLength(2)
            expect(screen.getAllByText(/Summer Bomber Jacket/)).toHaveLength(3)
        })
    })
})

describe('product bundles', () => {
    let hasUpdatedBundleChildren = false
    beforeEach(() => {
        hasUpdatedBundleChildren = false
        global.server.use(
            // Use product bundle instead of product set
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundle))
            }),
            rest.get('*/products', (req, res, ctx) => {
                let inventoryLevel = 0
                let bundleChildVariantId = '701643473915M'
                if (req.url.toString().includes('701643473908M')) {
                    bundleChildVariantId = '701643473908M'
                    inventoryLevel = 3
                }
                const bundleChildVariantData = {
                    data: [
                        {
                            id: bundleChildVariantId,
                            inventory: {
                                ats: inventoryLevel,
                                backorderable: false,
                                id: 'inventory_m',
                                orderable: false,
                                preorderable: false,
                                stockLevel: inventoryLevel
                            },
                            master: {
                                masterId: '25565139M',
                                orderable: true
                            }
                        }
                    ]
                }
                return res(ctx.delay(0), ctx.status(200), ctx.json(bundleChildVariantData))
            }),
            // For adding items to basket
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                const basketWithBundle = {
                    ...basketWithProductBundle,
                    productItems: bundleProductItemsForPDP
                }
                return res(ctx.json(basketWithBundle))
            }),
            // Follow up call to update child bundle variant selections
            rest.patch('*/baskets/:basketId/items', (req, res, ctx) => {
                hasUpdatedBundleChildren = true
                return res(ctx.json(basketWithProductBundle))
            })
        )
    })

    test('renders multi-product layout', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(screen.getAllByTestId('product-view')).toHaveLength(4) // 1 parent + 3 children
        })
    })

    test('add the bundle to cart successfully', async () => {
        const urlPathAfterSelectingAllVariants = `uk/en-GB/product/test-bundle?${new URLSearchParams(
            {
                '25592770M': 'color=JJGN9A0&size=006',
                '25565139M': 'color=JJ169XX&size=9SM',
                '25565094M': 'color=JJ0CZXX&size=9XS'
            }
        )}`
        window.history.pushState({}, 'ProductDetail', urlPathAfterSelectingAllVariants)

        // Initial basket is necessary to add items to it
        const initialBasket = {basketId: 'valid_id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(() => {
            expect(screen.getAllByText("Women's clothing test bundle")[0]).toBeInTheDocument()
            expect(hasUpdatedBundleChildren).toBe(false)
        })

        const buttons = await screen.findAllByText(/add bundle to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(
            () => {
                const modal = screen.getByTestId('add-to-cart-modal')
                expect(within(modal).getByText(/1 item added to cart/i)).toBeInTheDocument()
                expect(hasUpdatedBundleChildren).toBe(true)
            },
            // Seems like rendering the modal takes a bit more time
            {timeout: 10000}
        )
    })

    test('add the bundle to cart with error messages', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(screen.getAllByText("Women's clothing test bundle")[0]).toBeInTheDocument()
        })

        const buttons = await screen.findAllByText(/add bundle to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(() => {
            // Show error when users have not selected all the variants yet
            // 1 error for each child product
            const errorMessages = screen.getAllByText(/Please select all your options above/i)
            expect(errorMessages).toHaveLength(3)
        })
    })

    test('child product images are lazy loaded', async () => {
        renderWithProviders(<MockedComponent />)

        const childProducts = await screen.findAllByTestId('child-product')

        childProducts.forEach((child) => {
            const heroImage = within(child).getAllByRole('img')[0]
            expect(heroImage.getAttribute('loading')).toBe('lazy')
        })
    })

    test('add to cart button is disabled when child is out of stock', async () => {
        renderWithProviders(<MockedComponent />)
        await waitFor(() => {
            expect(screen.getAllByText("Women's clothing test bundle")[0]).toBeInTheDocument()
        })
        const childProducts = screen.getAllByTestId('child-product')
        expect(childProducts).toHaveLength(3)

        const swingTankProduct = childProducts[1]
        const colorSelectionBtn = within(swingTankProduct).getByLabelText('Black')
        const sizeSelectionBtn = within(swingTankProduct).getByLabelText('M')

        expect(swingTankProduct).toBeInTheDocument()
        expect(colorSelectionBtn).toBeInTheDocument()
        expect(sizeSelectionBtn).toBeInTheDocument()

        fireEvent.click(colorSelectionBtn)
        fireEvent.click(sizeSelectionBtn)

        await waitFor(() => {
            expect(screen.getByText('Out of stock')).toBeInTheDocument()
            const addBundleToCartBtn = screen.getByRole('button', {name: /add bundle to cart/i})
            expect(addBundleToCartBtn).toBeInTheDocument()
            expect(addBundleToCartBtn).toBeDisabled()
        })
    })

    test('add to cart button is disabled when quantity exceeds child stock level', async () => {
        renderWithProviders(<MockedComponent />)
        await waitFor(() => {
            expect(screen.getAllByText("Women's clothing test bundle")[0]).toBeInTheDocument()
        })
        const childProducts = screen.getAllByTestId('child-product')
        expect(childProducts).toHaveLength(3)

        const swingTankProduct = childProducts[1]
        const colorSelectionBtn = within(swingTankProduct).getByLabelText('Black')
        const sizeSelectionBtn = within(swingTankProduct).getByLabelText('L')

        expect(swingTankProduct).toBeInTheDocument()
        expect(colorSelectionBtn).toBeInTheDocument()
        expect(sizeSelectionBtn).toBeInTheDocument()

        fireEvent.click(colorSelectionBtn)
        fireEvent.click(sizeSelectionBtn)

        const addBundleToCartBtn = screen.getByRole('button', {name: /add bundle to cart/i})

        await waitFor(() => {
            expect(addBundleToCartBtn).toBeInTheDocument()
            expect(addBundleToCartBtn).toBeEnabled()
        })

        // Set product bundle quantity selection to 4
        const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
        quantityInput.focus()
        fireEvent.change(quantityInput, {target: {value: '4'}})

        await waitFor(() => {
            expect(screen.getByRole('spinbutton', {name: /quantity/i})).toHaveValue('4')
            expect(screen.getByText('Only 3 left!')).toBeInTheDocument()
            expect(addBundleToCartBtn).toBeDisabled()
        })
    })
})

describe('Delivery Options Restrictions', () => {
    const inventoryId = 'inventory_m_store_store1'
    const storeId = 'store-123'

    const pickupShippingMethod = {c_storePickupEnabled: true}
    const shipToAddressShippingMethod = {
        id: 'shipping',
        name: 'Ship to Address',
        methodType: 'shipping'
    }
    const baseBasket = {
        ...mockCustomerBaskets.baskets[0],
        shipments: [
            {
                ...mockCustomerBaskets.baskets[0].shipments[0],
                shippingMethod: shipToAddressShippingMethod
            }
        ]
    }
    const pickupBasket = {
        ...mockCustomerBaskets.baskets[0],
        shipments: [
            {
                ...mockCustomerBaskets.baskets[0].shipments[0],
                shippingMethod: pickupShippingMethod
            }
        ]
    }

    // Create a product with a matching, orderable inventory
    const masterProductWithInventory = {
        ...masterProduct,
        inventories: [
            {
                id: inventoryId,
                orderable: true,
                ats: 10,
                stockLevel: 10
            }
        ]
    }

    test('shows error when adding pickup item to basket with non-pickup shipping method', async () => {
        // Mock useSelectedStore to return a store with inventoryId
        mockUseSelectedStore.mockImplementation(() => ({
            selectedStore: {
                id: storeId,
                name: 'Test Store',
                inventoryId: inventoryId
            },
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))

        global.server.use(
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(masterProductWithInventory))
            }),
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(ctx.json({baskets: [baseBasket], total: 1}))
            })
        )

        // Navigate to specific variant before adding to cart
        window.history.pushState(
            {},
            'ProductDetail',
            '/uk/en-GB/product/25517823M?color=JJG80XX&size=9LG'
        )

        renderWithProviders(<MockedComponent />)
        // Wait for page to load
        expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
        // Wait for the page to fully load
        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        })
        // Select "Pick Up in Store"
        const pickupLabel = await screen.findByLabelText(/Pick Up in Store/i)
        fireEvent.click(pickupLabel)

        // Click Add to Cart
        const addToCartButton = await screen.findByRole('button', {name: /add to cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Select 'Ship to Address' to match the delivery method for the items in your cart."
                )
            ).toBeInTheDocument()
        })
    })

    test('Add to Cart with Pickup configures shipment when basket has no shipping method', async () => {
        // Mock useSelectedStore to return a store with inventoryId
        mockUseSelectedStore.mockImplementation(() => ({
            selectedStore: {
                id: storeId,
                name: 'Test Store',
                inventoryId: inventoryId
            },
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))

        let shipmentUpdateRequest = null

        // Mock the product to be a simple master product with inventory
        global.server.use(
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(masterProductWithInventory))
            }),
            rest.post('*/baskets/:basketId/items', async (req, res, ctx) => {
                const body = await req.json()
                // Assert: inventoryId is included in the request body
                expect(body[0].inventoryId).toBe(inventoryId)
                return res(
                    ctx.json({
                        basketId: 'test-basket-id',
                        shipments: [
                            {
                                shipmentId: 'me'
                                // No shippingMethod property - this triggers updatePickupShipment
                            }
                        ]
                    })
                )
            }),
            // Mock the shipment update call that updatePickupShipment makes
            rest.patch('*/baskets/:basketId/shipments/:shipmentId', async (req, res, ctx) => {
                shipmentUpdateRequest = await req.json()

                // Verify the correct parameters are passed to updatePickupShipment
                expect(req.params.basketId).toBe('test-basket-id')
                expect(req.params.shipmentId).toBe('me')
                expect(shipmentUpdateRequest.shippingMethod.id).toBe('GBP005')
                expect(shipmentUpdateRequest.c_fromStoreId).toBe(storeId)

                return res(
                    ctx.json({
                        basketId: 'test-basket-id',
                        shipments: [
                            {
                                shipmentId: 'me',
                                shippingMethod: {
                                    id: 'GBP005'
                                }
                            }
                        ]
                    })
                )
            }),
            // Mock the shipping methods GET request
            rest.get(
                '*/baskets/:basketId/shipments/:shipmentId/shipping-methods',
                (req, res, ctx) => {
                    return res(
                        ctx.json({
                            applicableShippingMethods: [
                                {
                                    id: 'GBP005',
                                    name: 'Store Pickup',
                                    price: 0
                                }
                            ]
                        })
                    )
                }
            )
        )

        // Navigate to specific variant before adding to cart
        window.history.pushState(
            {},
            'ProductDetail',
            '/uk/en-GB/product/25517823M?color=JJG80XX&size=9LG'
        )

        renderWithProviders(<MockedComponent />)

        // Wait for page to load
        expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()

        // Wait for the page to fully load
        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        })

        // Select "Pick Up in Store"
        const pickupLabel = await screen.findByLabelText(/Pick Up in Store/i)
        fireEvent.click(pickupLabel)

        // Click Add to Cart
        const addToCartButton = await screen.findByRole('button', {name: /add to cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Select 'Ship to Address' to match the delivery method for the items in your cart."
                )
            ).toBeInTheDocument()
        })
    })

    test('shows error when adding non-pickup item to basket with pickup shipping method', async () => {
        // Mock useSelectedStore to return a store with inventoryId
        mockUseSelectedStore.mockImplementation(() => ({
            selectedStore: {
                id: storeId,
                name: 'Test Store',
                inventoryId: inventoryId
            },
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))
        // Mock the product to be a simple master product with inventory
        global.server.use(
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(masterProductWithInventory))
            }),
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(ctx.json({baskets: [pickupBasket], total: 1}))
            })
        )

        // Navigate to specific variant before adding to cart
        window.history.pushState(
            {},
            'ProductDetail',
            '/uk/en-GB/product/25517823M?color=JJG80XX&size=9LG'
        )

        renderWithProviders(<MockedComponent />)

        // Wait for page to load
        expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
        // Wait for the page to fully load
        await waitFor(() => {
            expect(screen.getByRole('link', {name: /mens/i})).toBeInTheDocument()
        })
        // Select "Ship to Address" (not pickup)
        const shipToAddressLabel = await screen.findByLabelText(/Ship to Address/i)
        fireEvent.click(shipToAddressLabel)

        // Click Add to Cart
        const addToCartButton = await screen.findByRole('button', {name: /add to cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(
                screen.getByText(
                    "Select 'Pick Up in Store' to match the delivery method for the items in your cart."
                )
            ).toBeInTheDocument()
        })
    })
})

test('fetches product with inventoryIds when store is selected', async () => {
    // Mock useSelectedStore to return a store with inventoryId
    const inventoryId = 'inventory_m_store_store1'
    mockUseSelectedStore.mockImplementation(() => ({
        selectedStore: {
            id: 'store-123',
            name: 'Test Store',
            inventoryId: inventoryId
        },
        isLoading: false,
        error: null,
        hasSelectedStore: true
    }))

    // Mock the product API to check for inventoryIds param
    let inventoryIdsParam
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            inventoryIdsParam = req.url.searchParams.get('inventoryIds')
            return res(ctx.json(masterProduct))
        })
    )

    renderWithProviders(<MockedComponent />)

    // Assert: Product page loads and inventoryIds param was sent
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(inventoryIdsParam).toBe(inventoryId)
})

test('Add to Cart (Pick Up in Store) includes inventoryId for the selected variant', async () => {
    // Mock useSelectedStore to return a store with inventoryId
    const inventoryId = 'inventory_m_store_store1'
    mockUseSelectedStore.mockImplementation(() => ({
        selectedStore: {
            id: 'store-123',
            name: 'Test Store',
            inventoryId: inventoryId
        },
        isLoading: false,
        error: null,
        hasSelectedStore: true
    }))

    // Create a product with a matching, orderable inventory
    const masterProductWithInventory = {
        ...masterProduct,
        inventories: [
            {
                id: inventoryId,
                orderable: true,
                ats: 10,
                stockLevel: 10
            }
        ]
    }

    // Mock the product to be a simple master product with inventory
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(masterProductWithInventory))
        }),
        rest.post('*/baskets/:basketId/items', async (req, res, ctx) => {
            const body = await req.json()
            // Assert: inventoryId is included in the request body
            expect(body[0].inventoryId).toBe(inventoryId)
            return res(ctx.json({}))
        })
    )

    renderWithProviders(<MockedComponent />)

    // Wait for page to load
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()

    // Select "Pick Up in Store"
    const pickupLabel = await screen.findByLabelText(/Pick Up in Store/i)
    fireEvent.click(pickupLabel)

    // Click Add to Cart
    const addToCartButton = await screen.findByRole('button', {name: /add to cart/i})
    fireEvent.click(addToCartButton)

    // Wait for the POST to be called and assertion to run
    await waitFor(() => {
        // The assertion is inside the mock POST handler above
    })
})

describe('standard product', () => {
    let mockAddToCart = jest.fn()

    beforeEach(() => {
        mockAddToCart = jest.fn()
        global.server.use(
            // Use standard product without variants
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStandardProductOrderable))
            }),
            // Mock the add to cart API call to capture the request
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                const requestBody = req.body
                mockAddToCart(requestBody)
                return res(
                    ctx.json({
                        basketId: 'test-basket-id',
                        productItems: [
                            {
                                productId: requestBody[0].productId,
                                price: requestBody[0].price,
                                quantity: requestBody[0].quantity,
                                itemId: 'test-item-id',
                                productName: 'Test Product'
                            }
                        ],
                        productSubTotal: requestBody[0].price * requestBody[0].quantity,
                        productTotal: requestBody[0].price * requestBody[0].quantity,
                        orderTotal: requestBody[0].price * requestBody[0].quantity,
                        shipments: [
                            {
                                shippingMethod: {
                                    id: '001',
                                    name: 'Ground'
                                }
                            }
                        ]
                    })
                )
            }),
            // Mock shipping methods API call
            rest.get(
                '*/baskets/:basketId/shipments/:shipmentId/shipping-methods',
                (req, res, ctx) => {
                    return res(
                        ctx.json({
                            applicableShippingMethods: [
                                {
                                    id: '001',
                                    name: 'Ground',
                                    price: 15.99
                                }
                            ],
                            defaultShippingMethodId: '001'
                        })
                    )
                }
            ),
            // Mock update shipment API call
            rest.patch('*/baskets/:basketId/shipments/:shipmentId', (req, res, ctx) => {
                return res(ctx.json({}))
            })
        )
    })

    test('should be successfully added to cart', async () => {
        window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/a-standard-dress')

        const initialBasket = {basketId: 'test-basket-id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(() => {
            expect(screen.getAllByText('White and Black Tone')[0]).toBeInTheDocument()
            expect(screen.getByRole('button', {name: /add to cart/i})).toBeInTheDocument()
        })

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(mockAddToCart).toHaveBeenCalledWith([
                {
                    productId: mockStandardProductOrderable.id,
                    price: mockStandardProductOrderable.price,
                    quantity: 1,
                    shipmentId: 'me'
                }
            ])
        })
    })

    test('should handle quantity change before adding to cart', async () => {
        window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/a-standard-dress')

        const initialBasket = {basketId: 'test-basket-id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(() => {
            expect(screen.getAllByText('White and Black Tone')[0]).toBeInTheDocument()
            expect(screen.getByRole('spinbutton', {name: /quantity/i})).toBeInTheDocument()
        })

        // Change quantity to 3
        const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
        fireEvent.change(quantityInput, {target: {value: '3'}})

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            // Verify that the correct quantity is passed when variant is undefined
            expect(mockAddToCart).toHaveBeenCalledWith([
                {
                    productId: mockStandardProductOrderable.id,
                    price: mockStandardProductOrderable.price,
                    quantity: 3,
                    shipmentId: 'me'
                }
            ])
        })
    })

    test('renders bundle containing standard products without errors when master property is not provided', async () => {
        global.server.use(
            // Mock bundle with standard products
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.json(mockProductBundle))
            }),
            rest.get('*/products', (req, res, ctx) => {
                const ids = req.url.searchParams.get('ids')
                if (ids) {
                    const products = ids.split(',').map((id) => ({
                        id,
                        inventory: {
                            stockLevel: 5,
                            orderable: true
                        }
                    }))
                    return res(ctx.json({data: products}))
                }
                return res(ctx.json({data: []}))
            }),
            // Add items to basket
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                return res(ctx.json(basketWithProductBundle))
            }),
            // Update basket items
            rest.patch('*/baskets/:basketId/items', (req, res, ctx) => {
                return res(ctx.json(basketWithProductBundle))
            })
        )

        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(screen.getByTestId('product-details-page')).toBeInTheDocument()
        })

        await waitFor(() => {
            expect(screen.getAllByTestId('product-view')).toHaveLength(4) // 1 parent + 3 children
        })
    })

    test('adding to cart should send einstein event', async () => {
        window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/a-standard-dress')

        const initialBasket = {basketId: 'test-basket-id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(() => {
            expect(screen.getAllByText('White and Black Tone')[0]).toBeInTheDocument()
            expect(screen.getByRole('button', {name: /add to cart/i})).toBeInTheDocument()
        })

        const addToCartButton = screen.getByRole('button', {name: /Add to Cart/i})
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(mockAddToCart).toHaveBeenCalledTimes(1)
            expect(mockSendAddToCart).toHaveBeenCalledTimes(1)

            const addToCartArgs = mockSendAddToCart.mock.calls[0][0]
            expect(addToCartArgs).toHaveLength(1)
            const item = addToCartArgs[0]

            expect(item).toEqual(
                expect.objectContaining({
                    product: expect.objectContaining({
                        id: mockStandardProductOrderable.id
                    }),
                    productId: mockStandardProductOrderable.id,
                    price: mockStandardProductOrderable.price,
                    quantity: 1
                })
            )

            // Verify that all required properties are defined and have correct types
            // These are the properties that _constructEinsteinItem expects
            expect(item.productId).toBeDefined()
            expect(item.price).toBeDefined()
            expect(item.quantity).toBeDefined()
            expect(typeof item.productId).toBe('string')
            expect(typeof item.price).toBe('number')
            expect(typeof item.quantity).toBe('number')

            // Specifically verify the values match the standard product
            expect(item.productId).toBe('a-standard-dress')
            expect(item.price).toBe(4)
            expect(item.quantity).toBe(1)
        })
    })
})
