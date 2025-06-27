/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Mocks must be at the very top before any imports
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-search', () => ({
    __esModule: true,
    useBonusProductSearch: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            authType: 'registered',
            isRegistered: true
        }
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal', () => {
    const MockProvider = ({children}) => children
    return {
        useBonusProductModalContext: () => ({
            isOpen: false,
            onOpen: jest.fn(),
            onClose: jest.fn(),
            bonusProducts: [],
            addBonusProducts: jest.fn()
        }),
        BonusProductModalProvider: MockProvider
    }
})

import React from 'react'
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
import * as bonusProductSearchModule from '@salesforce/retail-react-app/app/hooks/use-bonus-product-search'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'

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

    // Reset and set default mock for useBonusProductSearch
    bonusProductSearchModule.useBonusProductSearch.mockReset()
    bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
        data: null
    })
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    sessionStorage.clear()
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
    const addToCart = jest.fn()
    await renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

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

test('Product View handles invalid quantity inputs', async () => {
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

describe('ProductView Component', () => {
    test('increases quantity when increment button is clicked', async () => {
        const user = userEvent.setup()
        renderWithProviders(<ProductView product={mockProductDetail} />)

        const quantityInput = await screen.findByRole('spinbutton')
        const incrementButton = screen.getByTestId('quantity-increment')
        const decrementButton = screen.getByTestId('quantity-decrement')

        // Click increment
        await user.click(incrementButton)
        await waitFor(() => {
            expect(quantityInput).toHaveValue('2')
        })

        // Click decrement
        await user.click(decrementButton)
        await waitFor(() => {
            expect(quantityInput).toHaveValue('1')
        })
    })
})

test('renders a product set properly - parent item', () => {
    const parent = mockProductSet
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

describe('ProductView Bonus Product Integration', () => {
    test('should have useBonusProductSearch hook available', () => {
        expect(bonusProductSearchModule.useBonusProductSearch).toBeDefined()
        expect(typeof bonusProductSearchModule.useBonusProductSearch).toBe('function')
    })

    test('should have useBonusProductModalContext hook available', () => {
        expect(useBonusProductModalContext).toBeDefined()
        expect(typeof useBonusProductModalContext).toBe('function')
    })

    test('should handle rule-based promotions correctly', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                    // No bonusProducts array = rule-based promotion
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: [
                    {
                        productId: 'prod1',
                        productName: 'Bonus Product 1',
                        c_productUrl: '/product/prod1'
                    }
                ]
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle list-based promotions correctly', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo456',
                    bonusProducts: [
                        {
                            productId: 'prod2',
                            productName: 'List Bonus Product',
                            title: 'Free Gift'
                        }
                    ]
                }
            ]
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle multiple rule-based promotions', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                    // No bonusProducts array = rule-based promotion
                },
                {
                    id: 'bonus2',
                    promotionId: 'promo456'
                    // No bonusProducts array = rule-based promotion
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: [
                    {
                        productId: 'prod1',
                        productName: 'Bonus Product 1',
                        c_productUrl: '/product/prod1'
                    }
                ]
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle mixed rule-based and list-based promotions', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                    // No bonusProducts array = rule-based promotion
                },
                {
                    id: 'bonus2',
                    promotionId: 'promo456',
                    bonusProducts: [
                        {
                            productId: 'prod2',
                            productName: 'List Bonus Product',
                            title: 'Free Gift'
                        }
                    ]
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: [
                    {
                        productId: 'prod1',
                        productName: 'Rule-based Bonus Product',
                        c_productUrl: '/product/prod1'
                    }
                ]
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should create correct promotion ID to ID mapping for rule-based promotions', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                },
                {
                    id: 'bonus2',
                    promotionId: 'promo456'
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: [
                    {
                        productId: 'prod1',
                        productName: 'Bonus Product 1',
                        c_productUrl: '/product/prod1'
                    }
                ]
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should format rule-based bonus products correctly', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: [
                    {
                        productId: 'prod1',
                        productName: 'Bonus Product 1',
                        c_productUrl: '/product/prod1'
                    },
                    {
                        productId: 'prod2',
                        productName: 'Bonus Product 2',
                        c_productUrl: '/product/prod2'
                    }
                ]
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle empty bonus product results', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: {
                hits: []
            }
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle null bonus product results', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [
                {
                    id: 'bonus1',
                    promotionId: 'promo123'
                }
            ]
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: null
        })

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })

    test('should handle addToCart without bonus products', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [
                {
                    id: 'item1',
                    product: {
                        id: 'prod1',
                        name: 'Test Product',
                        imageGroups: [
                            {
                                viewType: 'small',
                                images: [
                                    {
                                        link: 'test-image.jpg',
                                        alt: 'Test Image'
                                    }
                                ]
                            }
                        ]
                    },
                    variant: {
                        productId: 'prod1',
                        variationValues: {}
                    },
                    quantity: 1
                }
            ]
            // No bonusDiscountLineItems = no bonus products
        })

        bonusProductSearchModule.useBonusProductSearch.mockReturnValue({
            data: null
        })

        renderWithProviders(
            <ProductView
                product={mockProductDetail}
                addToCart={addToCart}
                isProductLoading={false}
            />
        )

        const addToCartButtons = screen.getAllByText(/add to cart/i)
        await user.click(addToCartButtons[0])

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledWith(expect.any(Object), 1)
        })

        // Should only be called with null or falsy values
        expect(bonusProductSearchModule.useBonusProductSearch).toHaveBeenCalled()
        expect(
            bonusProductSearchModule.useBonusProductSearch.mock.calls.every(([arg]) => !arg)
        ).toBe(true)
    })

    test('should handle addToCart error gracefully', async () => {
        const user = userEvent.setup()
        const addToCart = jest.fn().mockRejectedValue(new Error('API Error'))

        renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

        const addToCartButton = screen.getByRole('button', {name: /add to cart/i})
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(addToCart).toHaveBeenCalledTimes(1)
        })
    })
})
