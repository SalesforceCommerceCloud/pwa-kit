/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import CartItemVariant from '../../../../components/cart-item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistSecondaryButtonGroup from './wishlist-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import useWishlist from '../../../../hooks/use-wishlist'

const mockData = {
    creationDate: '2021-09-13T23:29:23.396Z',
    customerProductListItems: [
        {
            currency: 'GBP',
            id: '7847846d4562e4b4b1c658886d',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe33f0bf7/images/large/PG.10206908.JJS91A5.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe33f0bf7/images/large/PG.10206908.JJS91A5.PZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        },
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd86c8e3e/images/large/PG.10206908.JJS91A5.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd86c8e3e/images/large/PG.10206908.JJS91A5.BZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJS91A5'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8bcf8941/images/medium/PG.10206908.JJS91A5.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8bcf8941/images/medium/PG.10206908.JJS91A5.PZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        },
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2623bc6f/images/medium/PG.10206908.JJS91A5.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2623bc6f/images/medium/PG.10206908.JJS91A5.BZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJS91A5'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbd2b4434/images/small/PG.10206908.JJS91A5.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbd2b4434/images/small/PG.10206908.JJS91A5.PZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        },
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8a687afe/images/small/PG.10206908.JJS91A5.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8a687afe/images/small/PG.10206908.JJS91A5.BZ.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJS91A5'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Long Center Seam Skirt, Zinc Heather, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9ee14b8/images/swatch/PG.10206908.JJS91A5.CP.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9ee14b8/images/swatch/PG.10206908.JJS91A5.CP.jpg',
                            title: 'Long Center Seam Skirt, Zinc Heather'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJS91A5'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 100,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 100
            },
            longDescription:
                'This long center seam skirt is stunning.  It is perfect for nine-to-five and beyond.',
            master: {
                masterId: '25493613M',
                orderable: true,
                price: 53.11
            },
            minOrderQuantity: 1,
            name: 'Long Center Seam Skirt',
            pageDescription:
                'This long center seam skirt is stunning.  It is perfect for nine-to-five and beyond.',
            pageTitle: 'Long Center Seam Skirt',
            price: 53.11,
            pricePerUnit: 53.11,
            productPromotions: [
                {
                    calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                    promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
                }
            ],
            shortDescription:
                'This long center seam skirt is stunning.  It is perfect for nine-to-five and beyond.',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            upc: '701642842620',
            validFrom: {
                default: '2010-10-21T04:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842682M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '008'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842668M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '004'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842675M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '006'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842637M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '012'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842644M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '014'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842651M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '016'
                    }
                },
                {
                    orderable: true,
                    price: 53.11,
                    productId: '701642842620M',
                    variationValues: {
                        color: 'JJS91A5',
                        size: '010'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Zinc Heather',
                            orderable: true,
                            value: 'JJS91A5'
                        }
                    ]
                },
                {
                    id: 'size',
                    name: 'Size',
                    values: [
                        {
                            name: '4',
                            orderable: true,
                            value: '004'
                        },
                        {
                            name: '6',
                            orderable: true,
                            value: '006'
                        },
                        {
                            name: '8',
                            orderable: true,
                            value: '008'
                        },
                        {
                            name: '10',
                            orderable: true,
                            value: '010'
                        },
                        {
                            name: '12',
                            orderable: true,
                            value: '012'
                        },
                        {
                            name: '14',
                            orderable: true,
                            value: '014'
                        },
                        {
                            name: '16',
                            orderable: true,
                            value: '016'
                        }
                    ]
                }
            ],
            variationValues: {
                color: 'JJS91A5',
                size: '010'
            },
            c_color: 'JJS91A5',
            c_isNew: true,
            c_isNewtest: true,
            c_refinementColor: 'grey',
            c_size: '010',
            c_width: 'Z',
            priority: 1,
            productId: '701642842620M',
            public: false,
            purchasedQuantity: 0,
            quantity: 1
        }
    ],
    event: {},
    id: 'eba7a6682031bfa931949708d7',
    lastModified: '2021-09-14T00:47:12.612Z',
    name: 'PWA wishlist',
    public: false,
    type: 'wish_list'
}

jest.mock('../../../../hooks/use-wishlist')

const MockedComponent = () => {
    const product = mockData.customerProductListItems[0]
    return (
        <CartItemVariant variant={{...product, productName: product.name}}>
            <WishlistSecondaryButtonGroup />
        </CartItemVariant>
    )
}

beforeEach(() => {
    jest.resetModules()
})

test('can remove item', async () => {
    const removeItemMock = jest.fn().mockResolvedValue(true)
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: false,
        data: mockData,
        removeItem: removeItemMock
    })
    renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
    user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })

    user.click(confirmButton)
    expect(removeItemMock).toHaveBeenCalled()
})
