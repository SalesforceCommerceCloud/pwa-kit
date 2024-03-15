/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor} from '@testing-library/react'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
const mockProducts = {
    limit: 0,
    total: 1,
    data: [
        {
            currency: 'GBP',
            id: '701642889830M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c2304f9/images/large/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c2304f9/images/large/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        },
                        {
                            alt: 'Belted Cardigan With Studs, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23cbdec5/images/large/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23cbdec5/images/large/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c2304f9/images/large/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c2304f9/images/large/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        },
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23cbdec5/images/large/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23cbdec5/images/large/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ0NLD0'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw521c09a6/images/medium/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw521c09a6/images/medium/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        },
                        {
                            alt: 'Belted Cardigan With Studs, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb147ee45/images/medium/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb147ee45/images/medium/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw521c09a6/images/medium/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw521c09a6/images/medium/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        },
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb147ee45/images/medium/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb147ee45/images/medium/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ0NLD0'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa5ed67ee/images/small/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa5ed67ee/images/small/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        },
                        {
                            alt: 'Belted Cardigan With Studs, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2baf85f2/images/small/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2baf85f2/images/small/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa5ed67ee/images/small/PG.10215179.JJ0NLD0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa5ed67ee/images/small/PG.10215179.JJ0NLD0.PZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        },
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2baf85f2/images/small/PG.10215179.JJ0NLD0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2baf85f2/images/small/PG.10215179.JJ0NLD0.BZ.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ0NLD0'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Belted Cardigan With Studs, Laurel, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw024437d3/images/swatch/PG.10215179.JJ0NLD0.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw024437d3/images/swatch/PG.10215179.JJ0NLD0.CP.jpg',
                            title: 'Belted Cardigan With Studs, Laurel'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ0NLD0'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 68
            },
            longDescription:
                'Our best selling cardigan is now updated with a detachable belt and studs. Pair it with a Commerce Cloud Store shell and it is great for nine-to-five and beyond.',
            master: {
                masterId: '25502228M',
                orderable: true,
                price: 61.43
            },
            minOrderQuantity: 1,
            name: 'Belted Cardigan With Studs',
            pageDescription:
                'Our best selling cardigan is now updated with a detachable belt and studs. Pair it with a Commerce Cloud Store shell and it is great for nine-to-five and beyond.',
            pageTitle: 'Belted Cardigan With Studs',
            price: 61.43,
            pricePerUnit: 61.43,
            productPromotions: [
                {
                    calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                    promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
                },
                {
                    calloutMsg: '$50 Fixed Products Amount Above 100',
                    promotionId: '$50FixedProductsAmountAbove100'
                },
                {
                    calloutMsg: 'Bonus Product for Order Amounts Above 250',
                    promotionId: 'BonusProductOnOrderOfAmountABove250'
                }
            ],
            shortDescription:
                'Our best selling cardigan is now updated with a detachable belt and studs. Pair it with a Commerce Cloud Store shell and it is great for nine-to-five and beyond.',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/belted-cardigan-with-studs/701642889830M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            upc: '701642889830',
            validFrom: {
                default: '2010-11-18T05:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 61.43,
                    productId: '701642889823M',
                    variationValues: {
                        color: 'JJ0NLD0',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 61.43,
                    productId: '701642889847M',
                    variationValues: {
                        color: 'JJ0NLD0',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 61.43,
                    productId: '701642889830M',
                    variationValues: {
                        color: 'JJ0NLD0',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 61.43,
                    productId: '701642889854M',
                    variationValues: {
                        color: 'JJ0NLD0',
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
                            name: 'Laurel',
                            orderable: true,
                            value: 'JJ0NLD0'
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
            variationValues: {
                color: 'JJ0NLD0',
                size: '9MD'
            },
            c_color: 'JJ0NLD0',
            c_refinementColor: 'black',
            c_size: '9MD',
            c_width: 'Z'
        }
    ]
}

describe('UnavailableProductConfirmationModal', () => {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/products',
                res: () => {
                    return mockProducts
                }
            }
        ])
    })
    test('renders without crashing', () => {
        expect(() => {
            renderWithProviders(<UnavailableProductConfirmationModal />)
        }).not.toThrow()
    })

    test('opens confirmation modal when unavailable products are found', async () => {
        const mockProductIds = ['701642889899M', '701642889830M']
        const mockFunc = jest.fn()
        const {getByRole, user} = renderWithProviders(
            <UnavailableProductConfirmationModal
                productIds={mockProductIds}
                handleUnavailableProducts={mockFunc}
            />
        )

        await waitFor(async () => {
            const removeBtn = getByRole('button')
            expect(removeBtn).toBeInTheDocument()
            await user.click(removeBtn)
            expect(mockFunc).toHaveBeenCalled()
            expect(removeBtn).not.toBeInTheDocument()
        })
    })
})
