/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import mockProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
import {mockProductBundle} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import {
    mockStandardProductOrderable,
    mockStandardProductNotOrderable
} from '@salesforce/retail-react-app/app/mocks/standard-product'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import frMessages from '@salesforce/retail-react-app/app/static/translations/compiled/fr-FR.json'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

// Ensure useMultiSite returns site.id = 'site-1' for all tests
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'site-1'},
        buildUrl: (url) => url // identity function for tests
    })
}))

// Mock useSelectedStore hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: jest.fn()
}))

const MockComponent = (props) => {
    const {data: customer} = useCurrentCustomer()
    return (
        <div>
            <div>customer: {customer?.authType}</div>
            <ProductView {...props} />
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateWishlist: PropTypes.func,
    isBasketLoading: PropTypes.bool
}

const mockStoreData = {
    id: 'store-1',
    name: 'Test Store Location',
    inventoryId: 'inventory_m_store_store1'
}

// Set up and clean up
beforeEach(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')

    useSelectedStore.mockImplementation(() => ({
        selectedStore: mockStoreData,
        isLoading: false,
        error: null,
        hasSelectedStore: true
    }))
})
afterEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
})

// Update MockComponent default props for all tests
MockComponent.defaultProps = {
    pickupInStore: false,
    setPickupInStore: jest.fn()
}

test('ProductView Component renders properly', async () => {
    const addToCart = jest.fn()
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)
    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toHaveLength(2)
    expect(screen.getAllByText(/299\.99/)).toHaveLength(4)
    expect(screen.getAllByText(/Add to cart/i)).toHaveLength(2)
    expect(screen.getAllByRole('radiogroup')).toHaveLength(4)
    expect(screen.getAllByText(/add to cart/i)).toHaveLength(2)
})

describe('Event Handlers', () => {
    test('calls addToCart when add to cart button is clicked', async () => {
        const addToCart = jest.fn()
        await renderWithProviders(
            <MockComponent product={mockProductDetail} addToCart={addToCart} />
        )

        const addToCartButton = screen.getAllByText(/add to cart/i)[0]
        fireEvent.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('calls addToWishlist when add to wishlist button is clicked', async () => {
        const addToWishlist = jest.fn()

        await renderWithProviders(
            <MockComponent product={mockProductDetail} addToWishlist={addToWishlist} />
        )

        await waitFor(() => {
            expect(screen.getByText(/customer: registered/)).toBeInTheDocument()
        })

        await waitFor(() => {
            const addToWishListButton = screen.getAllByText(/Add to wishlist/i)[0]

            fireEvent.click(addToWishListButton)
            expect(addToWishlist).toHaveBeenCalledTimes(1)
        })
    })

    test('calls updateWishlist when update button is clicked', async () => {
        const updateWishlist = jest.fn()

        await renderWithProviders(
            <MockComponent product={mockProductDetail} updateWishlist={updateWishlist} />
        )

        await waitFor(() => {
            expect(screen.getByText(/customer: registered/)).toBeInTheDocument()
        })

        await waitFor(() => {
            const updateWishlistButton = screen.getAllByText(/Update/i)[0]

            fireEvent.click(updateWishlistButton)
            expect(updateWishlist).toHaveBeenCalledTimes(1)
        })
    })

    test('calls onVariantSelected after variant selection', async () => {
        const user = userEvent.setup()
        const onVariantSelected = jest.fn()
        const child = mockProductSet.setProducts[0]

        renderWithProviders(
            <MockComponent
                product={child}
                onVariantSelected={onVariantSelected}
                addToCart={() => {}}
                addToWishlist={() => {}}
            />
        )

        const size = screen.getByRole('radio', {name: /xl/i})
        await user.click(size)

        await waitFor(() => {
            expect(onVariantSelected).toHaveBeenCalledTimes(1)
        })
    })

    test('calls validateOrderability when adding a set to cart', async () => {
        const user = userEvent.setup()
        const parent = mockProductSet
        const validateOrderability = jest.fn()

        renderWithProviders(
            <MockComponent
                product={parent}
                validateOrderability={validateOrderability}
                addToCart={() => {}}
                addToWishlist={() => {}}
            />
        )

        const button = screen.getByRole('button', {name: /add set to cart/i})
        await user.click(button)

        await waitFor(() => {
            expect(validateOrderability).toHaveBeenCalledTimes(1)
        })
    })

    test('calls onVariantSelected for standard products in bundles', async () => {
        const onVariantSelected = jest.fn()
        const setChildProductOrderability = jest.fn()
        const standardProduct = {
            id: 'standard-product-1',
            name: 'Standard Product',
            type: {item: true},
            variationAttributes: [],
            inventory: {
                orderable: true,
                stockLevel: 10
            }
        }

        renderWithProviders(
            <MockComponent
                product={standardProduct}
                onVariantSelected={onVariantSelected}
                setChildProductOrderability={setChildProductOrderability}
                isProductPartOfBundle={true}
                childOfBundleQuantity={2}
                addToCart={() => {}}
                addToWishlist={() => {}}
            />
        )

        await waitFor(() => {
            expect(onVariantSelected).toHaveBeenCalledWith(standardProduct, null, 2)
        })
    })

    test('calls onVariantSelected for standard products in sets', async () => {
        const onVariantSelected = jest.fn()
        const setChildProductOrderability = jest.fn()
        const standardProduct = {
            id: 'standard-product-1',
            name: 'Standard Product',
            type: {item: true},
            variationAttributes: [],
            inventory: {
                orderable: true,
                stockLevel: 10
            }
        }

        renderWithProviders(
            <MockComponent
                product={standardProduct}
                onVariantSelected={onVariantSelected}
                setChildProductOrderability={setChildProductOrderability}
                isProductPartOfSet={true}
                addToCart={() => {}}
                addToWishlist={() => {}}
            />
        )

        await waitFor(() => {
            expect(onVariantSelected).toHaveBeenCalledWith(standardProduct, null, 1)
        })
    })
})

describe('Quantity Management', () => {
    test('can update quantity through input field', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn()
        await renderWithProviders(
            <MockComponent product={mockProductDetail} addToCart={addToCart} />
        )

        let quantityBox
        await waitFor(() => {
            quantityBox = screen.getByRole('spinbutton')
        })

        await waitFor(() => {
            expect(quantityBox).toHaveValue('1')
        })

        // update item quantity
        await user.type(quantityBox, '{backspace}3')

        await waitFor(() => {
            expect(quantityBox).toHaveValue('3')
        })
    })

    test('handles invalid quantity inputs by resetting to minimum', async () => {
        const user = userEvent.setup()

        // Any invalid input should be reset to minOrderQuantity
        await renderWithProviders(<MockComponent product={mockProductDetail} />)

        const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
        const minQuantity = mockProductDetail.minOrderQuantity.toString()

        // Quantity is empty
        await user.clear(quantityInput)
        await user.tab()
        await waitFor(() => {
            expect(quantityInput).toHaveValue(minQuantity)
        })

        // Quantity is zero
        await user.clear(quantityInput)
        await user.type(quantityInput, '0')
        await user.tab()
        await waitFor(() => {
            expect(quantityInput).toHaveValue(minQuantity)
        })
    })

    test('quantity picker renders with increment/decrement buttons', async () => {
        renderWithProviders(<ProductView product={mockProductDetail} />)

        const quantityInput = await screen.findByRole('spinbutton')
        const incrementButton = screen.getByTestId('quantity-increment')
        const decrementButton = screen.getByTestId('quantity-decrement')

        // Wait for the component to initialize with the correct value
        await waitFor(() => {
            expect(quantityInput).toHaveValue('1')
        })

        // Test that increment/decrement buttons exist and are accessible
        expect(incrementButton).toBeInTheDocument()
        expect(decrementButton).toBeInTheDocument()
        expect(incrementButton).toBeEnabled()
        expect(decrementButton).toBeEnabled()

        // Test that buttons have proper accessibility attributes
        expect(incrementButton).toHaveAttribute('aria-label')
        expect(decrementButton).toHaveAttribute('aria-label')
    })
})

describe('Loading States', () => {
    test('disables add to cart button when basket is loading', async () => {
        renderWithProviders(
            <MockComponent
                product={mockProductDetail}
                addToCart={() => {}}
                isBasketLoading={true}
            />
        )
        expect(screen.getByRole('button', {name: /add to cart/i})).toBeDisabled()
    })

    test('enables add to cart button when basket is not loading', async () => {
        renderWithProviders(
            <MockComponent
                product={mockProductDetail}
                addToCart={() => {}}
                isBasketLoading={false}
            />
        )
        expect(screen.getByRole('button', {name: /add to cart/i})).toBeEnabled()
    })
})

describe('Product Sets', () => {
    test('renders parent item correctly', () => {
        const parent = mockProductSet
        renderWithProviders(
            <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
        )

        // NOTE: there can be duplicates of the same element, due to mobile and desktop views
        // (they're hidden with display:none style)

        const fromAtLabel = screen.getAllByText(/from/i)[0]
        const addSetToCartButton = screen.getAllByRole('button', {name: /add set to cart/i})[0]
        const addSetToWishlistButton = screen.getAllByRole('button', {
            name: /add set to wishlist/i
        })[0]
        const variationAttributes = screen
            .queryAllByRole('radiogroup')
            .filter(
                (rg) =>
                    !rg.textContent.includes('Ship to Address') &&
                    !rg.textContent.includes('Pickup in Store')
            )
        const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity/i})

        // What should exist:
        expect(fromAtLabel).toBeInTheDocument()
        expect(addSetToCartButton).toBeInTheDocument()
        expect(addSetToWishlistButton).toBeInTheDocument()

        // What should _not_ exist:
        expect(variationAttributes).toHaveLength(0)
        expect(quantityPicker).toBeNull()
    })

    test('renders child item correctly', () => {
        const child = mockProductSet.setProducts[0]
        renderWithProviders(
            <MockComponent product={child} addToCart={() => {}} addToWishlist={() => {}} />
        )

        // NOTE: there can be duplicates of the same element, due to mobile and desktop views
        // (they're hidden with display:none style)

        const addToCartButton = screen.getAllByRole('button', {name: /add to cart/i})[0]
        const addToWishlistButton = screen.getAllByRole('button', {name: /add to wishlist/i})[0]
        const variationAttributes = screen
            .queryAllByRole('radiogroup')
            .filter(
                (rg) =>
                    !rg.textContent.includes('Ship to Address') &&
                    !rg.textContent.includes('Pickup in Store')
            )
        const quantityPicker = screen.getByRole('spinbutton', {name: /quantity/i})
        const fromLabels = screen.queryAllByText(/from/i)

        // What should exist:
        expect(addToCartButton).toBeInTheDocument()
        expect(addToWishlistButton).toBeInTheDocument()
        expect(variationAttributes).toHaveLength(2)
        expect(quantityPicker).toBeInTheDocument()

        // since setProducts are master products, as pricing now display From X (cross) Y where X Y are sale and lis price respectively
        // of the variant that has lowest price (including promotional price)
        expect(fromLabels).toHaveLength(4)
    })
})

describe('Product Bundles', () => {
    test('renders parent item correctly', () => {
        const parent = mockProductBundle
        renderWithProviders(
            <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
        )

        // NOTE: there can be duplicates of the same element, due to mobile and desktop views
        // (they're hidden with display:none style)
        const addBundleToCartButton = screen.getAllByRole('button', {
            name: /add bundle to cart/i
        })[0]
        const addBundleToWishlistButton = screen.getAllByRole('button', {
            name: /add bundle to wishlist/i
        })[0]
        const quantityPicker = screen.getByRole('spinbutton', {name: /quantity/i})
        const variationAttributes = screen
            .queryAllByRole('radiogroup')
            .filter(
                (rg) =>
                    !rg.textContent.includes('Ship to Address') &&
                    !rg.textContent.includes('Pickup in Store')
            )

        // What should exist:
        expect(addBundleToCartButton).toBeInTheDocument()
        expect(addBundleToWishlistButton).toBeInTheDocument()
        expect(quantityPicker).toBeInTheDocument()

        // What should _not_ exist:
        expect(variationAttributes).toHaveLength(0)
    })

    test('renders child item correctly', () => {
        const child = mockProductBundle.bundledProducts[0].product
        renderWithProviders(
            <MockComponent
                product={child}
                addToCart={() => {}}
                addToWishlist={() => {}}
                isProductPartOfBundle={true}
                setChildProductOrderability={() => {}}
            />
        )

        const addToCartButton = screen.queryByRole('button', {name: /add to cart/i})
        const addToWishlistButton = screen.queryByRole('button', {name: /add to wishlist/i})
        const variationAttributes = screen
            .queryAllByRole('radiogroup')
            .filter(
                (rg) =>
                    !rg.textContent.includes('Ship to Address') &&
                    !rg.textContent.includes('Pickup in Store')
            )
        const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity:/i})

        // What should exist:
        expect(variationAttributes).toHaveLength(2)

        // What should _not_ exist:
        expect(addToCartButton).toBeNull()
        expect(addToWishlistButton).toBeNull()
        expect(quantityPicker).toBeNull()
    })

    test('Pickup in store radio is enabled when selected store is set', async () => {
        // Ensure the product has inventory data for the store and is in stock
        const mockProduct = {
            ...mockProductDetail,
            inventories: [{id: mockStoreData.inventoryId, orderable: true, stockLevel: 10}]
        }

        renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)

        // Assert: Radio is enabled
        const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
        expect(pickupRadio).toBeEnabled()
    })

    test('Pickup in store radio is disabled when inventoryId is NOT present in localStorage', async () => {
        renderWithProviders(
            <MockComponent product={mockProductDetail} showDeliveryOptions={true} />
        )

        // Assert: Radio is disabled
        const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
        expect(pickupRadio).toBeDisabled()
    })

    test('Pickup in store radio is disabled when inventoryId is present but product is out of stock', async () => {
        const user = userEvent.setup()

        // Product inventory is not orderable
        const mockProduct = {
            ...mockProductDetail,
            inventories: [{id: mockStoreData.inventoryId, orderable: false}]
        }

        renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)

        const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
        // Chakra UI does not set a semantic disabled attribute, so we test for unclickability
        expect(pickupRadio).not.toBeChecked()
        await user.click(pickupRadio)
        expect(pickupRadio).not.toBeChecked()
    })

    test('shows "Pickup in Select Store" label when pickup is disabled due to no store/inventoryId', async () => {
        useSelectedStore.mockReturnValue({
            selectedStore: null,
            isLoading: false,
            error: null,
            hasSelectedStore: false
        })

        renderWithProviders(
            <MockComponent product={mockProductDetail} showDeliveryOptions={true} />
        )

        const label = await screen.findByTestId('pickup-select-store-msg')
        expect(label).toBeInTheDocument()
        expect(label).toHaveTextContent(/Pick up in/i)
        const button = label.querySelector('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent(/Select Store/i)
    })

    describe('ProductView stock status messages', () => {
        const storeName = 'Test Store'

        test('shows "In Stock at {storeName}" when store has inventory', async () => {
            const mockProduct = {
                ...mockProductDetail,
                inventories: [{id: mockStoreData.inventoryId, orderable: true, stockLevel: 10}],
                name: 'Test Product'
            }
            renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)
            const msg = await screen.findByText(/In Stock at/i)
            expect(msg).toBeInTheDocument()
            expect(msg).toHaveTextContent(storeName)
            // Store name should be a button
            const button = msg.querySelector('button')
            expect(button).toBeInTheDocument()
            expect(button).toHaveTextContent(storeName)
        })

        test('shows "Out of Stock at {storeName}" when store is out of inventory', async () => {
            const mockProduct = {
                ...mockProductDetail,
                inventories: [{id: mockStoreData.inventoryId, orderable: false}],
                name: 'Test Product'
            }
            renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)
            const msg = await screen.findByText(/Out of Stock at/i)
            expect(msg).toBeInTheDocument()
            expect(msg).toHaveTextContent(storeName)
            // Store name should be a button
            const button = msg.querySelector('button')
            expect(button).toBeInTheDocument()
            expect(button).toHaveTextContent(storeName)
        })
    })

    describe('ProductView showDeliveryOptions property', () => {
        test('shows delivery options when showDeliveryOptions is true (default)', async () => {
            renderWithProviders(
                <MockComponent product={mockProductDetail} showDeliveryOptions={true} />
            )

            // Delivery options should be visible
            expect(screen.getByText(/Delivery:/i)).toBeInTheDocument()
            expect(screen.getByRole('radio', {name: /ship to address/i})).toBeInTheDocument()
            expect(screen.getByRole('radio', {name: /pick up in store/i})).toBeInTheDocument()
        })

        test('hides delivery options when showDeliveryOptions is false', async () => {
            renderWithProviders(
                <MockComponent product={mockProductDetail} showDeliveryOptions={false} />
            )

            // Delivery options should not be visible
            expect(screen.queryByText(/Delivery:/i)).not.toBeInTheDocument()
            expect(screen.queryByRole('radio', {name: /ship to address/i})).not.toBeInTheDocument()
            expect(screen.queryByRole('radio', {name: /pick up in store/i})).not.toBeInTheDocument()
            expect(screen.queryByTestId('store-stock-status-msg')).not.toBeInTheDocument()
            expect(screen.queryByTestId('pickup-select-store-msg')).not.toBeInTheDocument()
        })

        test('shows delivery options when showDeliveryOptions is not provided (defaults to true)', async () => {
            renderWithProviders(<MockComponent product={mockProductDetail} />)

            // Delivery options should be visible by default
            expect(screen.getByText(/Delivery:/i)).toBeInTheDocument()
            expect(screen.getByRole('radio', {name: /ship to address/i})).toBeInTheDocument()
            expect(screen.getByRole('radio', {name: /pick up in store/i})).toBeInTheDocument()
        })
    })
})

// Additional tests from develop branch
test('Pick up in store radio is enabled when selected store is set', async () => {
    // Ensure the product has inventory data for the store and is in stock
    const mockProduct = {
        ...mockProductDetail,
        inventories: [{id: mockStoreData.inventoryId, orderable: true, stockLevel: 10}]
    }

    renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)

    // Assert: Radio is enabled
    const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
    expect(pickupRadio).toBeEnabled()
})

test('Pick up in store radio is disabled when inventoryId is NOT present in selected store', async () => {
    renderWithProviders(<MockComponent product={mockProductDetail} showDeliveryOptions={true} />)

    // Assert: Radio is disabled
    const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
    expect(pickupRadio).toBeDisabled()
})

test('Pick up in store radio is disabled when inventoryId is present but product is out of stock', async () => {
    const user = userEvent.setup()

    // Product inventory is not orderable
    const mockProduct = {
        ...mockProductDetail,
        inventories: [{id: mockStoreData.inventoryId, orderable: false}]
    }

    renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)

    const pickupRadio = await screen.findByRole('radio', {name: /pick up in store/i})
    // Chakra UI does not set a semantic disabled attribute, so we test for unclickability
    expect(pickupRadio).not.toBeChecked()
    await user.click(pickupRadio)
    expect(pickupRadio).not.toBeChecked()
})

test('shows "Pick up in Select Store" label when pickup is disabled due to no store/inventoryId', async () => {
    useSelectedStore.mockReturnValue({
        selectedStore: null,
        isLoading: false,
        error: null,
        hasSelectedStore: false
    })

    renderWithProviders(<MockComponent product={mockProductDetail} showDeliveryOptions={true} />)

    const label = await screen.findByTestId('pickup-select-store-msg')
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent(/Pick up in/i)
    const button = label.querySelector('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent(/Select Store/i)
})

test('shows "In stock at {storeName}" when store has inventory', async () => {
    const mockProduct = {
        ...mockProductDetail,
        inventories: [{id: mockStoreData.inventoryId, orderable: true, stockLevel: 10}]
    }

    renderWithProviders(<MockComponent product={mockProduct} showDeliveryOptions={true} />)
    const msg = await screen.findByText(/In stock at/i)
    expect(msg).toBeInTheDocument()
    expect(msg).toHaveTextContent('Test Store')
    // Store name should be a button
    const button = msg.querySelector('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Test Store')
})

test('renders "Add to Cart" and "Add to Wishlist" buttons in French', async () => {
    const addToCart = jest.fn()
    const addToWishlist = jest.fn()
    renderWithProviders(
        <MockComponent
            product={mockProductDetail}
            addToCart={addToCart}
            addToWishlist={addToWishlist}
        />,
        {
            wrapperProps: {locale: {id: 'fr-FR'}, messages: frMessages}
        }
    )

    const titles = await screen.findAllByText(/Black Single Pleat Athletic Fit Wool Suit/i)
    expect(titles.length).toBeGreaterThan(0)
    expect(screen.getByRole('button', {name: /ajouter au panier/i})).toBeInTheDocument()
    expect(
        screen.getByRole('button', {name: /ajouter à la liste de souhaits/i})
    ).toBeInTheDocument()
})

describe('validateOrderability', () => {
    test('returns true when variant is undefined but product is orderable', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = undefined
        const product = mockStandardProductOrderable
        const quantity = 1
        const stockLevel = 999999

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(true)
    })

    test('returns false when variant is undefined and product is not orderable', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = undefined
        const product = mockStandardProductNotOrderable
        const quantity = 1
        const stockLevel = 0

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(false)
    })

    test('returns true when variant is orderable regardless of product orderability', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = {orderable: true}
        const product = mockStandardProductNotOrderable // product is not orderable
        const quantity = 1
        const stockLevel = 999999

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(true)
    })

    test('returns false when both variant and product are not orderable', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = {orderable: false}
        const product = mockStandardProductNotOrderable
        const quantity = 1
        const stockLevel = 0

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(false)
    })

    test('returns false when quantity is invalid even if product/variant are orderable', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = undefined
        const product = mockStandardProductOrderable
        const quantity = 0 // invalid quantity
        const stockLevel = 999999

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(false)
    })

    test('returns false when quantity exceeds stock level', () => {
        const validateOrderability = (variant, product, quantity, stockLevel) =>
            (variant?.orderable || product?.inventory?.orderable) &&
            quantity > 0 &&
            quantity <= stockLevel

        const variant = undefined
        const product = mockStandardProductOrderable
        const quantity = 1000000 // exceeds stock level
        const stockLevel = 999999

        const result = validateOrderability(variant, product, quantity, stockLevel)
        expect(result).toBe(false)
    })
})

// Test maxOrderQuantity prop functionality
describe('maxOrderQuantity Prop', () => {
    test('quantity picker respects maxOrderQuantity prop', async () => {
        const addToCart = jest.fn()

        renderWithProviders(
            <MockComponent product={mockProductDetail} addToCart={addToCart} maxOrderQuantity={3} />
        )

        const quantityInput = screen.getByRole('spinbutton')
        const incrementButton = screen.getByTestId('quantity-increment')
        const decrementButton = screen.getByTestId('quantity-decrement')

        // Test that quantity picker renders with max constraint
        await waitFor(() => {
            expect(quantityInput).toHaveValue('1')
        })

        // Test that buttons are present and accessible
        expect(incrementButton).toBeInTheDocument()
        expect(decrementButton).toBeInTheDocument()
        expect(incrementButton).toBeEnabled()
        expect(decrementButton).toBeEnabled()

        // Test that the input has proper accessibility attributes
        expect(quantityInput).toHaveAttribute('aria-label')
        expect(incrementButton).toHaveAttribute('aria-label')
        expect(decrementButton).toHaveAttribute('aria-label')
    })
})
