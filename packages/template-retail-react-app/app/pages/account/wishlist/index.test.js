/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import AccountWishlist from '.'
import {renderWithProviders} from '../../../utils/test-utils'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import useWishlist from '../../../hooks/use-wishlist'

const mockData = {
    creationDate: '2021-09-13T23:29:23.396Z',
    customerProductListItems: [
        {
            id: '98ca9a3a9c8ee803543dc45cdc',
            priority: 1,
            productId: '25518837M',
            public: false,
            purchasedQuantity: 0,
            quantity: 4,
            type: 'product',
            product: {
                currency: 'GBP',
                id: '25518837M',
                imageGroups: [
                    {
                        images: [
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , large',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            },
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , large',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            }
                        ],
                        viewType: 'large'
                    },
                    {
                        images: [
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , medium',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            },
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , medium',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            }
                        ],
                        viewType: 'medium'
                    },
                    {
                        images: [
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , small',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            },
                            {
                                alt: 'Ruffle Front V-Neck Cardigan, , small',
                                disBaseLink:
                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                                link:
                                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                                title: 'Ruffle Front V-Neck Cardigan, '
                            }
                        ],
                        viewType: 'small'
                    }
                ],
                inventory: {
                    ats: 1597,
                    backorderable: false,
                    id: 'inventory_m',
                    orderable: true,
                    preorderable: false,
                    stockLevel: 1597
                },
                longDescription:
                    "This flirty ruffle cardigan can take you from day to night. Don't leave home with out a great pair of Commerce Cloud Store earrings.",
                master: {
                    masterId: '25518837M',
                    orderable: true,
                    price: 26.23
                },
                minOrderQuantity: 1,
                name: 'Ruffle Front V-Neck Cardigan',
                pageDescription:
                    "This flirty ruffle cardigan can take you from day to night. Don't leave home with out a great pair of Commerce Cloud Store earrings.",
                pageTitle: 'Ruffle Front V-Neck Cardigan',
                price: 26.23,
                pricePerUnit: 26.23,
                primaryCategoryId: 'womens-clothing-tops',
                productPromotions: [
                    {
                        calloutMsg: '$50 Fixed Products Amount Above 100',
                        promotionId: '$50FixedProductsAmountAbove100'
                    },
                    {
                        calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                        promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
                    }
                ],
                shortDescription:
                    "This flirty ruffle cardigan can take you from day to night. Don't leave home with out a great pair of Commerce Cloud Store earrings.",
                stepQuantity: 1,
                type: {
                    master: true
                },
                validFrom: {
                    default: '2010-11-18T05:00:00.000Z'
                },
                variants: [
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873211M',
                        variationValues: {
                            color: 'JJ169XX',
                            size: '9LG'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873334M',
                        variationValues: {
                            color: 'JJ908XX',
                            size: '9LG'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873297M',
                        variationValues: {
                            color: 'JJ8UTXX',
                            size: '9LG'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873372M',
                        variationValues: {
                            color: 'JJI15XX',
                            size: '9LG'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873402M',
                        variationValues: {
                            color: 'JJI15XX',
                            size: '9XL'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873303M',
                        variationValues: {
                            color: 'JJ8UTXX',
                            size: '9MD'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873310M',
                        variationValues: {
                            color: 'JJ8UTXX',
                            size: '9SM'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873228M',
                        variationValues: {
                            color: 'JJ169XX',
                            size: '9MD'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873235M',
                        variationValues: {
                            color: 'JJ169XX',
                            size: '9SM'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873396M',
                        variationValues: {
                            color: 'JJI15XX',
                            size: '9SM'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873389M',
                        variationValues: {
                            color: 'JJI15XX',
                            size: '9MD'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873327M',
                        variationValues: {
                            color: 'JJ8UTXX',
                            size: '9XL'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873341M',
                        variationValues: {
                            color: 'JJ908XX',
                            size: '9MD'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873358M',
                        variationValues: {
                            color: 'JJ908XX',
                            size: '9SM'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873365M',
                        variationValues: {
                            color: 'JJ908XX',
                            size: '9XL'
                        }
                    },
                    {
                        orderable: true,
                        price: 26.23,
                        productId: '701642873242M',
                        variationValues: {
                            color: 'JJ169XX',
                            size: '9XL'
                        }
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        name: 'Colour',
                        values: [
                            {
                                name: 'Black',
                                orderable: true,
                                value: 'JJ169XX'
                            },
                            {
                                name: 'Icy Mint',
                                orderable: true,
                                value: 'JJ8UTXX'
                            },
                            {
                                name: 'Grey Heather',
                                orderable: true,
                                value: 'JJ908XX'
                            },
                            {
                                name: 'White',
                                orderable: true,
                                value: 'JJI15XX'
                            }
                        ]
                    },
                    {
                        id: 'size',
                        name: 'Size',
                        values: [
                            {
                                name: 'S',
                                orderable: true,
                                value: '9SM'
                            },
                            {
                                name: 'M',
                                orderable: true,
                                value: '9MD'
                            },
                            {
                                name: 'L',
                                orderable: true,
                                value: '9LG'
                            },
                            {
                                name: 'XL',
                                orderable: true,
                                value: '9XL'
                            }
                        ]
                    }
                ],
                c_isNewtest: true,
                c_isSale: true
            }
        }
    ],
    event: {},
    id: 'eba7a6682031bfa931949708d7',
    lastModified: '2021-09-14T00:47:12.612Z',
    name: 'PWA wishlist',
    public: false,
    type: 'wish_list'
}

jest.mock('../../../hooks/use-wishlist')

beforeEach(() => {
    jest.resetModules()
})

test('Renders wishlist page', () => {
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: false,
        hasDetail: true,
        items: mockData.customerProductListItems
    })

    renderWithProviders(<AccountWishlist />)
    expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
    expect(screen.getByText(mockData.customerProductListItems[0].product.name)).toBeInTheDocument()
})

test('Can remove item from the wishlist', async () => {
    const removeItemMock = jest.fn()
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: false,
        hasDetail: true,
        items: mockData.customerProductListItems,
        removeListItem: removeItemMock
    })

    renderWithProviders(<AccountWishlist />)

    const wishlistRemoveButton = await screen.findByTestId(
        'sf-wishlist-remove-98ca9a3a9c8ee803543dc45cdc'
    )
    userEvent.click(wishlistRemoveButton)
    userEvent.click(screen.getByRole('button', {name: /yes, remove item/i}))
    expect(removeItemMock).toBeCalled()
})

test('renders no wishlist items for empty wishlist', () => {
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: true,
        hasDetail: true
    })
    renderWithProviders(<AccountWishlist />)

    expect(screen.getByText(/no wishlist items/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /continue shopping/i})).toBeInTheDocument()
})

test('renders skeleton when product list is loading', () => {
    useWishlist.mockReturnValue({
        isInitialized: false,
        isEmpty: true
    })

    renderWithProviders(<AccountWishlist />)
    expect(screen.getByTestId('sf-wishlist-skeleton')).toBeInTheDocument()
})
