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

jest.mock('@salesforce/retail-react-app/app/constants', () => {
    const originalModule = jest.requireActual('@salesforce/retail-react-app/app/constants')
    return {
        ...originalModule,
        DEFAULT_DNT_STATE: false
    }
})

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
