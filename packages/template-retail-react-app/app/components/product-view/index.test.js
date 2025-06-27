/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import mockProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
import {mockProductBundle} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import frMessages from '@salesforce/retail-react-app/app/static/translations/compiled/fr-FR.json'
import * as useDerivedProductModule from '@salesforce/retail-react-app/app/hooks/use-derived-product'

// Mock scrollIntoView for jsdom
// eslint-disable-next-line @typescript-eslint/no-empty-function
global.HTMLElement.prototype.scrollIntoView = function () {}

// Mocks must be at the very top before any imports
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            authType: 'registered',
            isRegistered: true
        }
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({
        currency: 'USD'
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    useAddToCartModalContext: () => ({
        isOpen: false,
        onOpen: jest.fn(),
        onClose: jest.fn()
    }),
    AddToCartModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal', () => ({
    useBonusProductModalContext: () => ({
        isOpen: false,
        onOpen: jest.fn(),
        onClose: jest.fn(),
        bonusProducts: [],
        addBonusProducts: jest.fn()
    }),
    BonusProductModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: () => jest.fn()
}))

// Patch useDerivedProduct for quantity tests to use real state
const originalUseDerivedProduct = jest.requireActual(
    '@salesforce/retail-react-app/app/hooks/use-derived-product'
).useDerivedProduct

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

// Set up and clean up
beforeEach(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    sessionStorage.clear()
    if (useDerivedProductModule.useDerivedProduct.mockRestore) {
        useDerivedProductModule.useDerivedProduct.mockRestore()
    }
})

test('ProductView Component renders properly', async () => {
    const addToCart = jest.fn()
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)
    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toHaveLength(2)
    expect(screen.getAllByText(/299\.99/)).toHaveLength(4)
    expect(screen.getAllByText(/Add to cart/i)).toHaveLength(2)
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3)
    expect(screen.getAllByText(/add to cart/i)).toHaveLength(2)
})

test('ProductView Component renders with addToCart event handler', async () => {
    const addToCart = jest.fn()
    await renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    const addToCartButton = screen.getAllByText(/add to cart/i)[0]
    fireEvent.click(addToCartButton)

    await waitFor(() => {
        expect(addToCart).toHaveBeenCalledTimes(1)
    })
})

test('ProductView Component renders with addToWishList event handler', async () => {
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

test('ProductView Component renders with updateWishlist event handler', async () => {
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

test('Product View can update quantity', async () => {
    const user = userEvent.setup()
    function Wrapper(props) {
        const [quantity, setQuantity] = useState('1')
        jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
            ...originalUseDerivedProduct(),
            quantity,
            setQuantity
        }))
        return <ProductView {...props} />
    }
    renderWithProviders(<Wrapper product={mockProductDetail} />)
    const quantityBox = screen.getByRole('spinbutton', {name: /quantity/i})
    await user.clear(quantityBox)
    await user.type(quantityBox, '3')
    await waitFor(() => {
        expect(quantityBox).toHaveValue('3')
    })
})

test('Product View handles invalid quantity inputs', async () => {
    const user = userEvent.setup()

    // Create a wrapper component with proper state management
    const TestWrapper = () => {
        const [quantity, setQuantity] = React.useState(3)

        // Mock useDerivedProduct to use the wrapper's state
        jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
            showLoading: false,
            showInventoryMessage: false,
            inventoryMessage: '',
            quantity,
            minOrderQuantity: 1,
            setQuantity,
            variant: {
                productId: 'test-product',
                orderable: true,
                variationValues: {}
            },
            variationParams: {},
            variationAttributes: [],
            stockLevel: 10,
            stepQuantity: 1,
            isOutOfStock: false,
            unfulfillable: false
        }))

        return (
            <MockComponent
                product={mockProductDetail}
                addToCart={jest.fn()}
                addToWishlist={jest.fn()}
            />
        )
    }

    renderWithProviders(<TestWrapper />)

    // Use a more specific selector to target only the quantity input
    const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
    expect(quantityInput).toHaveValue('3')

    // Clear the input and type an invalid value
    await user.clear(quantityInput)
    await user.type(quantityInput, '0')
    await user.tab() // Simulate blur to trigger validation

    // The input should reset to the minimum value (1)
    await waitFor(() => {
        expect(quantityInput).toHaveValue('1')
    })
})

test('increases quantity when increment button is clicked', async () => {
    const user = userEvent.setup()
    function Wrapper(props) {
        const [quantity, setQuantity] = useState('1')
        jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
            ...originalUseDerivedProduct(),
            quantity,
            setQuantity
        }))
        return <ProductView {...props} />
    }
    renderWithProviders(<Wrapper product={mockProductDetail} />)
    const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
    const incrementButton = screen.getByTestId('quantity-increment')
    await user.click(incrementButton)
    await waitFor(() => {
        expect(quantityInput).toHaveValue('2')
    })
})

test('renders a product set properly - parent item', () => {
    const parent = mockProductSet
    // Mock useDerivedProduct to return no variation attributes for parent
    jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
        showLoading: false,
        showInventoryMessage: false,
        inventoryMessage: '',
        quantity: 1,
        minOrderQuantity: 1,
        setQuantity: jest.fn(),
        variant: null,
        variationParams: {},
        variationAttributes: [],
        stockLevel: 10,
        stepQuantity: 1,
        isOutOfStock: false,
        unfulfillable: false
    }))
    renderWithProviders(
        <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)

    const fromAtLabel = screen.getAllByText(/from/i)[0]
    const addSetToCartButton = screen.getAllByRole('button', {name: /add set to cart/i})[0]
    const addSetToWishlistButton = screen.getAllByRole('button', {name: /add set to wishlist/i})[0]
    const variationAttributes = screen.queryAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity/i})

    // What should exist:
    expect(fromAtLabel).toBeInTheDocument()
    expect(addSetToCartButton).toBeInTheDocument()
    expect(addSetToWishlistButton).toBeInTheDocument()

    // What should _not_ exist:
    expect(variationAttributes).toHaveLength(0)
    expect(quantityPicker).toBeNull()
})

test('renders a product set properly - child item', () => {
    const child = mockProductSet.setProducts[0]
    // Mock useDerivedProduct to return two variation attributes for child
    jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
        showLoading: false,
        showInventoryMessage: false,
        inventoryMessage: '',
        quantity: 1,
        minOrderQuantity: 1,
        setQuantity: jest.fn(),
        variant: {
            productId: 'child-product-id',
            orderable: true,
            variationValues: {size: 'XL', color: 'Blue'}
        },
        variationParams: {size: 'XL', color: 'Blue'},
        variationAttributes: [
            {
                id: 'size',
                name: 'Size',
                selectedValue: {name: 'XL', value: 'XL'},
                values: [
                    {name: 'M', value: 'M', orderable: true},
                    {name: 'L', value: 'L', orderable: true},
                    {name: 'XL', value: 'XL', orderable: true}
                ]
            },
            {
                id: 'color',
                name: 'Color',
                selectedValue: {name: 'Blue', value: 'Blue'},
                values: [
                    {name: 'Blue', value: 'Blue', orderable: true},
                    {name: 'Red', value: 'Red', orderable: true}
                ]
            }
        ],
        stockLevel: 10,
        stepQuantity: 1,
        isOutOfStock: false,
        unfulfillable: false
    }))
    renderWithProviders(
        <MockComponent product={child} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)

    const addToCartButton = screen.getAllByRole('button', {name: /add to cart/i})[0]
    const addToWishlistButton = screen.getAllByRole('button', {name: /add to wishlist/i})[0]
    const variationAttributes = screen.getAllByRole('radiogroup') // e.g. sizes, colors
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

test('validateOrderability callback is called when adding a set to cart', async () => {
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

test('onVariantSelected callback is called after successfully selected a variant', async () => {
    const user = userEvent.setup()
    const onVariantSelected = jest.fn()
    const child = mockProductSet.setProducts[0]
    // Mock useDerivedProduct to return a size attribute with XL
    jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
        showLoading: false,
        showInventoryMessage: false,
        inventoryMessage: '',
        quantity: 1,
        minOrderQuantity: 1,
        setQuantity: jest.fn(),
        variant: {
            productId: 'child-product-id',
            orderable: true,
            variationValues: {size: 'XL'}
        },
        variationParams: {size: 'XL'},
        variationAttributes: [
            {
                id: 'size',
                name: 'Size',
                selectedValue: {name: 'XL', value: 'XL'},
                values: [
                    {name: 'M', value: 'M', orderable: true},
                    {name: 'L', value: 'L', orderable: true},
                    {name: 'XL', value: 'XL', orderable: true}
                ]
            }
        ],
        stockLevel: 10,
        stepQuantity: 1,
        isOutOfStock: false,
        unfulfillable: false
    }))
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

describe('add to cart button loading tests', () => {
    test('add to cart button is disabled if isBasketLoading is true', async () => {
        renderWithProviders(
            <MockComponent
                product={mockProductDetail}
                addToCart={() => {}}
                isBasketLoading={true}
            />
        )
        expect(screen.getByRole('button', {name: /add to cart/i})).toBeDisabled()
    })

    test('add to cart button is enabled if isBasketLoading is false', async () => {
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

test('renders a product bundle properly - parent item', () => {
    const parent = mockProductBundle
    renderWithProviders(
        <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)
    const addBundleToCartButton = screen.getAllByRole('button', {name: /add bundle to cart/i})[0]
    const addBundleToWishlistButton = screen.getAllByRole('button', {
        name: /add bundle to wishlist/i
    })[0]
    const quantityPicker = screen.getByRole('spinbutton', {name: /quantity/i})
    const variationAttributes = screen.queryAllByRole('radiogroup') // e.g. sizes, colors

    // What should exist:
    expect(addBundleToCartButton).toBeInTheDocument()
    expect(addBundleToWishlistButton).toBeInTheDocument()
    expect(quantityPicker).toBeInTheDocument()

    // What should _not_ exist:
    expect(variationAttributes).toHaveLength(0)
})

test('renders a product bundle properly - child item', () => {
    const child = mockProductBundle.bundledProducts[0].product

    // Mock useDerivedProduct for this test to return proper data structure
    jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
        showLoading: false,
        showInventoryMessage: false,
        inventoryMessage: '',
        quantity: 1,
        minOrderQuantity: 1,
        setQuantity: jest.fn(),
        variant: {
            productId: 'child-product-id',
            orderable: true,
            variationValues: {size: 'M', color: 'Black'}
        },
        variationParams: {size: 'M', color: 'Black'},
        variationAttributes: [
            {
                id: 'size',
                name: 'Size',
                selectedValue: {name: 'M', value: 'M'},
                values: [
                    {name: 'S', value: 'S', orderable: true},
                    {name: 'M', value: 'M', orderable: true},
                    {name: 'L', value: 'L', orderable: true}
                ]
            },
            {
                id: 'color',
                name: 'Color',
                selectedValue: {name: 'Black', value: 'Black'},
                values: [
                    {name: 'Black', value: 'Black', orderable: true},
                    {name: 'White', value: 'White', orderable: true}
                ]
            }
        ],
        stockLevel: 10,
        stepQuantity: 1,
        isOutOfStock: false,
        unfulfillable: false
    }))

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
    const variationAttributes = screen.getAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity:/i})

    // What should exist:
    expect(variationAttributes).toHaveLength(2)

    // What should _not_ exist:
    expect(addToCartButton).toBeNull()
    expect(addToWishlistButton).toBeNull()
    expect(quantityPicker).toBeNull()
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
