/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    AddToCartModal,
    AddToCartModalContext
} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen} from '@testing-library/react'
import {rest} from 'msw'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'

const MOCK_PRODUCT = {
    currency: 'USD',
    id: '701642811398M',
    imageGroups: [
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3ce02e8b/images/large/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3ce02e8b/images/large/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdc28ed23/images/large/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdc28ed23/images/large/PG.10219685.JJ825XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ825XX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8434410d/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8434410d/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc50f7b16/images/medium/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc50f7b16/images/medium/PG.10219685.JJ825XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ825XX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8173d41b/images/small/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8173d41b/images/small/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw426088e2/images/small/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw426088e2/images/small/PG.10219685.JJ825XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ825XX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbc8a4ed/images/swatch/PG.10219685.JJ825XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbc8a4ed/images/swatch/PG.10219685.JJ825XX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ825XX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        }
    ],
    inventory: {
        ats: 89,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 89
    },
    longDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    master: {
        masterId: '25517823M',
        orderable: true,
        price: 14.99
    },
    minOrderQuantity: 1,
    name: 'Long Sleeve Crew Neck',
    pageDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    pageTitle: 'Long Sleeve Crew Neck',
    price: 14.99,
    productPromotions: [
        {
            calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
            promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
        }
    ],
    shortDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    stepQuantity: 1,
    type: {
        variant: true
    },
    upc: '701642811398',
    validFrom: {
        default: '2010-11-18T05:00:00.000Z'
    },
    variants: [
        {
            orderable: true,
            price: 14.99,
            productId: '701642811398M',
            variationValues: {
                color: 'JJ825XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841227M',
            variationValues: {
                color: 'JJ3HDXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841265M',
            variationValues: {
                color: 'JJ5QZXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811473M',
            variationValues: {
                color: 'JJI15XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811435M',
            variationValues: {
                color: 'JJG80XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811312M',
            variationValues: {
                color: 'JJ2XNXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811237M',
            variationValues: {
                color: 'JJ169XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643342570M',
            variationValues: {
                color: 'JJ3HDXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811343M',
            variationValues: {
                color: 'JJ2XNXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811404M',
            variationValues: {
                color: 'JJ825XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811336M',
            variationValues: {
                color: 'JJ2XNXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811268M',
            variationValues: {
                color: 'JJ169XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643070756M',
            variationValues: {
                color: 'JJ2XNXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811497M',
            variationValues: {
                color: 'JJI15XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811480M',
            variationValues: {
                color: 'JJI15XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811466M',
            variationValues: {
                color: 'JJG80XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811428M',
            variationValues: {
                color: 'JJ825XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643070732M',
            variationValues: {
                color: 'JJ825XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811244M',
            variationValues: {
                color: 'JJ169XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643070763M',
            variationValues: {
                color: 'JJG80XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643342587M',
            variationValues: {
                color: 'JJ5QZXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811503M',
            variationValues: {
                color: 'JJI15XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811459M',
            variationValues: {
                color: 'JJG80XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643070725M',
            variationValues: {
                color: 'JJ169XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841289M',
            variationValues: {
                color: 'JJ5QZXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841272M',
            variationValues: {
                color: 'JJ5QZXX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841241M',
            variationValues: {
                color: 'JJ3HDXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811329M',
            variationValues: {
                color: 'JJ2XNXX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811251M',
            variationValues: {
                color: 'JJ169XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701643070770M',
            variationValues: {
                color: 'JJI15XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841296M',
            variationValues: {
                color: 'JJ5QZXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841258M',
            variationValues: {
                color: 'JJ3HDXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811442M',
            variationValues: {
                color: 'JJG80XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642811411M',
            variationValues: {
                color: 'JJ825XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 14.99,
            productId: '701642841234M',
            variationValues: {
                color: 'JJ3HDXX',
                size: '9MD'
            }
        }
    ],
    variationAttributes: [
        {
            id: 'color',
            name: 'Color',
            values: [
                {
                    name: 'Black',
                    orderable: true,
                    value: 'JJ169XX'
                },
                {
                    name: 'Grey Heather',
                    orderable: true,
                    value: 'JJ2XNXX'
                },
                {
                    name: 'Meadow Violet',
                    orderable: true,
                    value: 'JJ3HDXX'
                },
                {
                    name: 'Begonia Pink',
                    orderable: true,
                    value: 'JJ5QZXX'
                },
                {
                    name: 'Fire Red',
                    orderable: true,
                    value: 'JJ825XX'
                },
                {
                    name: 'Sugar',
                    orderable: true,
                    value: 'JJG80XX'
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
                    name: 'XS',
                    orderable: true,
                    value: '9XS'
                },
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
    variationValues: {
        color: 'JJ825XX',
        size: '9LG'
    },
    c_color: 'JJ825XX',
    c_refinementColor: 'red',
    c_size: '9LG',
    c_width: 'Z'
}
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        })
    )
})

test('Renders AddToCartModal with multiple products', () => {
    const MOCK_DATA = {
        product: MOCK_PRODUCT,
        itemsAdded: [
            {
                product: MOCK_PRODUCT,
                variant: MOCK_PRODUCT.variants[0],
                id: '701642811399M',
                quantity: 22
            },
            {
                product: MOCK_PRODUCT,
                variant: MOCK_PRODUCT.variants[0],
                quantity: 1
            }
        ]
    }

    renderWithProviders(
        <AddToCartModalContext.Provider
            value={{
                isOpen: true,
                data: MOCK_DATA
            }}
        >
            <AddToCartModal />
        </AddToCartModalContext.Provider>
    )

    expect(screen.getAllByText(MOCK_PRODUCT.name)[0]).toBeInTheDocument()
    expect(screen.getByRole('dialog', {name: /23 items added to cart/i})).toBeInTheDocument()

    const numOfRowsRendered = screen.getAllByTestId('product-added').length
    expect(numOfRowsRendered).toEqual(MOCK_DATA.itemsAdded.length)
})

test('Do not render when isOpen is false', () => {
    const {queryByText} = renderWithProviders(
        <AddToCartModalContext.Provider
            value={{
                isOpen: false
            }}
        >
            <AddToCartModal />
        </AddToCartModalContext.Provider>
    )

    expect(queryByText(MOCK_PRODUCT.name)).not.toBeInTheDocument()
})
