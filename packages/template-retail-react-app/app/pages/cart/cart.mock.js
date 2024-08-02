/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// mock data for removing unavailable products flow
export const baskets = {
    baskets: [
        {
            adjustedMerchandizeTotalTax: 14.3,
            adjustedShippingTotalTax: 2.38,
            agentBasket: false,
            basketId: '10cf6aa40edba4fcfcc6915594',
            billingAddress: {
                address1: '123 Main St',
                city: 'SF',
                countryCode: 'US',
                firstName: 'Alex',
                fullName: 'Alex V',
                id: 'd0bbbacfaabfaad9bc171173f4',
                lastName: 'V',
                phone: '(434) 343-4343',
                postalCode: '12345',
                stateCode: 'CA'
            },
            channelType: 'storefront',
            creationDate: '2024-07-02T21:13:21.078Z',
            currency: 'GBP',
            customerInfo: {
                customerId: 'abmrkVwXwUmbARmes2lWYYlHAU',
                email: 'test@gmail.com'
            },
            groupedTaxItems: [
                {
                    taxRate: 0.05,
                    taxValue: 16.68
                }
            ],
            lastModified: '2024-07-02T23:33:30.658Z',
            merchandizeTotalTax: 14.3,
            notes: {},
            orderTotal: 350.15,
            paymentInstruments: [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Visa',
                        creditCardExpired: false,
                        expirationMonth: 4,
                        expirationYear: 2029,
                        holder: 'TEst ',
                        maskedNumber: '************4242',
                        numberLastDigits: '4242'
                    },
                    paymentInstrumentId: 'e350d16b3350837b1155bc35da',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ],
            productItems: [
                {
                    adjustedTax: 3.05,
                    basePrice: 12.8,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '7b1a03848f0807f99f37ea93e4',
                    itemText: 'Worn Gold Dangle Earring',
                    price: 64,
                    priceAfterItemDiscount: 64,
                    priceAfterOrderDiscount: 64,
                    productId: '013742335262M',
                    productName: 'Worn Gold Dangle Earring',
                    quantity: 5,
                    shipmentId: 'me',
                    shippingItemId: '247699907591b6b94c9f38cf08',
                    tax: 3.05,
                    taxBasis: 64,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 5.94,
                    basePrice: 124.8,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: 'cf917f98d7917f79bd7fb32ff3',
                    itemText: 'Straight Leg Trousers',
                    price: 124.8,
                    priceAfterItemDiscount: 124.8,
                    priceAfterOrderDiscount: 124.8,
                    productId: '883360519685M',
                    productName: 'Straight Leg Trousers',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 5.94,
                    taxBasis: 124.8,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 3.63,
                    basePrice: 76.16,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '798cb148035590a2c0bf18e338',
                    itemText: 'Wide Leg Pant.',
                    price: 76.16,
                    priceAfterItemDiscount: 76.16,
                    priceAfterOrderDiscount: 76.16,
                    productId: '701644334888M',
                    productName: 'Wide Leg Pant.',
                    quantity: 6,
                    shipmentId: 'me',
                    tax: 3.63,
                    taxBasis: 76.16,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 1.68,
                    basePrice: 35.19,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '77fc9016530e7e2c3e607a405e',
                    itemText: 'Sleeveless Pleated Floral Front Blouse',
                    price: 35.19,
                    priceAfterItemDiscount: 35.19,
                    priceAfterOrderDiscount: 35.19,
                    productId: '701644044220M',
                    productName: 'Sleeveless Pleated Floral Front Blouse',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 1.68,
                    taxBasis: 35.19,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            productSubTotal: 300.15,
            productTotal: 300.15,
            shipments: [
                {
                    adjustedMerchandizeTotalTax: 14.3,
                    adjustedShippingTotalTax: 2.38,
                    gift: false,
                    merchandizeTotalTax: 14.3,
                    productSubTotal: 300.15,
                    productTotal: 300.15,
                    shipmentId: 'me',
                    shipmentTotal: 350.15,
                    shippingAddress: {
                        address1: '123 Main St',
                        city: 'SF',
                        countryCode: 'US',
                        firstName: 'Alex',
                        fullName: 'Alex V',
                        id: 'ff3c9f1ce5e4026c439f190931',
                        lastName: 'V',
                        phone: '(434) 343-4343',
                        postalCode: '12345',
                        stateCode: 'CA'
                    },
                    shippingMethod: {
                        description: 'Order received within 7-10 business days',
                        id: 'GBP001',
                        name: 'Ground',
                        price: 59.99,
                        shippingPromotions: [
                            {
                                calloutMsg: 'Free Shipping Amount Above 50',
                                promotionId: 'FreeShippingAmountAbove50',
                                promotionName: 'Free Shipping Amount Above 50'
                            }
                        ],
                        c_estimatedArrivalTime: '7-10 Business Days'
                    },
                    shippingStatus: 'not_shipped',
                    shippingTotal: 50,
                    shippingTotalTax: 2.86,
                    taxTotal: 16.68
                }
            ],
            shippingItems: [
                {
                    adjustedTax: 0,
                    basePrice: 9.99,
                    itemId: '0099168d63187ee0c10fa0e578',
                    itemText: 'Shipping',
                    price: 9.99,
                    priceAdjustments: [
                        {
                            appliedDiscount: {
                                amount: 1,
                                type: 'free'
                            },
                            creationDate: '2024-07-02T21:13:39.658Z',
                            custom: false,
                            itemText: 'Free Shipping Amount Above 50',
                            lastModified: '2024-07-02T23:33:30.658Z',
                            manual: false,
                            price: -9.99,
                            priceAdjustmentId: '0f49bbadd8121aecde7d2fc199',
                            promotionId: 'FreeShippingAmountAbove50'
                        }
                    ],
                    priceAfterItemDiscount: 0,
                    shipmentId: 'me',
                    tax: 0.48,
                    taxBasis: 9.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 2.38,
                    basePrice: 10,
                    itemId: '247699907591b6b94c9f38cf08',
                    itemText: 'Item Shipping Cost (Surcharge)',
                    price: 10,
                    priceAfterItemDiscount: 50,
                    shipmentId: 'me',
                    tax: 2.38,
                    taxBasis: 50,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            shippingTotal: 50,
            shippingTotalTax: 2.86,
            taxation: 'gross',
            taxRoundedAtGroup: false,
            taxTotal: 16.68,
            temporaryBasket: false
        }
    ],
    total: 1
}

export const products = {
    limit: 3,
    data: [
        {
            currency: 'GBP',
            id: '013742335262M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0131a99a/images/large/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0131a99a/images/large/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, Gold, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0131a99a/images/large/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0131a99a/images/large/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, Gold'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJB84A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw373e475f/images/medium/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw373e475f/images/medium/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, Gold, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw373e475f/images/medium/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw373e475f/images/medium/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, Gold'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJB84A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7694f4dc/images/small/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7694f4dc/images/small/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, Gold, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7694f4dc/images/small/PG.79942169.JJB84A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7694f4dc/images/small/PG.79942169.JJB84A0.PZ.jpg',
                            title: 'Worn Gold Dangle Earring, Gold'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJB84A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Worn Gold Dangle Earring, Gold, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3e876932/images/swatch/PG.79942169.JJB84A0.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3e876932/images/swatch/PG.79942169.JJB84A0.CP.jpg',
                            title: 'Worn Gold Dangle Earring, Gold'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJB84A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 28,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 28
            },
            longDescription:
                'These earrings are sophisticated and fun. Looks great with a dark colour shirt.',
            master: {
                masterId: '25534901M',
                orderable: true,
                price: 12.8
            },
            minOrderQuantity: 1,
            name: 'Worn Gold Dangle Earring',
            pageDescription:
                'These earrings are sophisticated and fun. Looks great with a dark colour shirt.',
            pageTitle: 'Worn Gold Dangle Earring',
            price: 12.8,
            pricePerUnit: 12.8,
            shortDescription:
                'These earrings are sophisticated and fun. Looks great with a dark colour shirt.',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/worn-gold-dangle-earring/013742335262M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            upc: '013742335262',
            validFrom: {
                default: '2011-03-25T04:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 12.8,
                    productId: '013742335262M',
                    variationValues: {
                        color: 'JJB84A0'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Gold',
                            orderable: true,
                            value: 'JJB84A0'
                        }
                    ]
                }
            ],
            variationValues: {
                color: 'JJB84A0'
            },
            c_color: 'JJB84A0',
            c_refinementColor: 'yellow',
            c_size: '010',
            c_width: 'H'
        },
        {
            currency: 'GBP',
            id: '883360519685M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf27d4dd7/images/large/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf27d4dd7/images/large/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw04a3d6f7/images/large/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw04a3d6f7/images/large/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe16aa55c/images/large/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe16aa55c/images/large/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, Navy, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf27d4dd7/images/large/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf27d4dd7/images/large/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw04a3d6f7/images/large/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw04a3d6f7/images/large/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe16aa55c/images/large/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe16aa55c/images/large/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'GYX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf236c9a2/images/medium/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf236c9a2/images/medium/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaf2d045f/images/medium/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaf2d045f/images/medium/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5b3052/images/medium/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5b3052/images/medium/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, Navy, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf236c9a2/images/medium/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf236c9a2/images/medium/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaf2d045f/images/medium/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaf2d045f/images/medium/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5b3052/images/medium/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5b3052/images/medium/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'GYX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw842b6c64/images/small/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw842b6c64/images/small/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01ea27fb/images/small/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01ea27fb/images/small/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, '
                        },
                        {
                            alt: 'Straight Leg Trousers, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe7e0830b/images/small/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe7e0830b/images/small/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, Navy, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw842b6c64/images/small/B0274206_GYX_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw842b6c64/images/small/B0274206_GYX_0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01ea27fb/images/small/B0274206_GYX_B0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01ea27fb/images/small/B0274206_GYX_B0.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        },
                        {
                            alt: 'Straight Leg Trousers, Navy, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe7e0830b/images/small/B0274206_GYX_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe7e0830b/images/small/B0274206_GYX_L1.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'GYX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, , swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw046f72f0/images/swatch/B0274206_GYX_sw.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw046f72f0/images/swatch/B0274206_GYX_sw.jpg',
                            title: 'Straight Leg Trousers, '
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Straight Leg Trousers, Navy, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw046f72f0/images/swatch/B0274206_GYX_sw.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw046f72f0/images/swatch/B0274206_GYX_sw.jpg',
                            title: 'Straight Leg Trousers, Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'GYX'
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
                orderable: false,
                preorderable: false,
                stockLevel: 0
            },
            longDescription:
                '<ul>\n    <li>80% cotton, 15% nylon, 5% elastane</li>\n    <li>straight leg</li>\n    <li>clean cut</li>\n<li>front rise 10 1/4 inches</li>\n<li>back rise 14 3/4 inches</li>\n<li>leg opening 15 1/2 inches</li>\n<li>inseam 34 1/4 inches</li>\n<li>measurements taken from a size 32</li>\n    <li>dry clean only</li>         </ul>',
            master: {
                masterId: '12416789M',
                orderable: true,
                price: 124.8
            },
            minOrderQuantity: 1,
            name: 'Straight Leg Trousers',
            pageDescription:
                'A menswear favorite, these straight leg trousers are to the point when it comes to business dressing. Made in our lightweight combed stretch cotton suiting with pinstripe pattern.',
            pageTitle: 'straight-leg-trousers',
            price: 124.8,
            pricePerUnit: 124.8,
            shortDescription:
                'A menswear favorite, these straight leg trousers are to the point when it comes to business dressing. Made in our lightweight combed stretch cotton suiting with pinstripe pattern.',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/mens-pants-straight-leg-trousers/883360519685M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            variants: [
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519722M',
                    variationValues: {
                        color: 'GYX',
                        size: '33'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519678M',
                    variationValues: {
                        color: 'GYX',
                        size: '28'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519715M',
                    variationValues: {
                        color: 'GYX',
                        size: '32'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519685M',
                    variationValues: {
                        color: 'GYX',
                        size: '29'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519739M',
                    variationValues: {
                        color: 'GYX',
                        size: '34'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519708M',
                    variationValues: {
                        color: 'GYX',
                        size: '31'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519692M',
                    variationValues: {
                        color: 'GYX',
                        size: '30'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519760M',
                    variationValues: {
                        color: 'GYX',
                        size: '40'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519753M',
                    variationValues: {
                        color: 'GYX',
                        size: '38'
                    }
                },
                {
                    orderable: true,
                    price: 124.8,
                    productId: '883360519746M',
                    variationValues: {
                        color: 'GYX',
                        size: '36'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Navy',
                            orderable: true,
                            value: 'GYX'
                        }
                    ]
                },
                {
                    id: 'size',
                    name: 'Size',
                    values: [
                        {
                            name: '28',
                            orderable: true,
                            value: '28'
                        },
                        {
                            name: '29',
                            orderable: true,
                            value: '29'
                        },
                        {
                            name: '30',
                            orderable: true,
                            value: '30'
                        },
                        {
                            name: '31',
                            orderable: true,
                            value: '31'
                        },
                        {
                            name: '32',
                            orderable: true,
                            value: '32'
                        },
                        {
                            name: '33',
                            orderable: true,
                            value: '33'
                        },
                        {
                            name: '34',
                            orderable: true,
                            value: '34'
                        },
                        {
                            name: '36',
                            orderable: true,
                            value: '36'
                        },
                        {
                            name: '38',
                            orderable: true,
                            value: '38'
                        },
                        {
                            name: '40',
                            orderable: true,
                            value: '40'
                        }
                    ]
                }
            ],
            variationValues: {
                color: 'GYX',
                size: '29'
            },
            c_availableForInStorePickup: true,
            c_color: 'GYX',
            c_isNew: true,
            c_isNewtest: true,
            c_isSale: true,
            c_refinementColor: 'blue',
            c_size: '29',
            c_styleNumber: 'B0274206'
        },
        {
            currency: 'GBP',
            id: '701644334888M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw35aa5777/images/large/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw35aa5777/images/large/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., '
                        },
                        {
                            alt: 'Wide Leg Pant., , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw151d06ba/images/large/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw151d06ba/images/large/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., Black Multi, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw35aa5777/images/large/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw35aa5777/images/large/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        },
                        {
                            alt: 'Wide Leg Pant., Black Multi, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw151d06ba/images/large/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw151d06ba/images/large/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ3WDXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d017a19/images/medium/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d017a19/images/medium/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., '
                        },
                        {
                            alt: 'Wide Leg Pant., , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfba8d336/images/medium/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfba8d336/images/medium/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., Black Multi, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d017a19/images/medium/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d017a19/images/medium/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        },
                        {
                            alt: 'Wide Leg Pant., Black Multi, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfba8d336/images/medium/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfba8d336/images/medium/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ3WDXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw788a29bf/images/small/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw788a29bf/images/small/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., '
                        },
                        {
                            alt: 'Wide Leg Pant., , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd284baec/images/small/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd284baec/images/small/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., Black Multi, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw788a29bf/images/small/PG.10245233.JJ3WDXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw788a29bf/images/small/PG.10245233.JJ3WDXX.PZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        },
                        {
                            alt: 'Wide Leg Pant., Black Multi, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd284baec/images/small/PG.10245233.JJ3WDXX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd284baec/images/small/PG.10245233.JJ3WDXX.BZ.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ3WDXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Wide Leg Pant., Black Multi, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcb9c3fd9/images/swatch/PG.10245233.JJ3WDXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcb9c3fd9/images/swatch/PG.10245233.JJ3WDXX.CP.jpg',
                            title: 'Wide Leg Pant., Black Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ3WDXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 0,
                backorderable: false,
                id: 'inventory_m',
                inStockDate: '2024-07-05T00:00:00.000Z',
                orderable: true,
                preorderable: false,
                stockLevel: 1
            },
            longDescription:
                'Wide leg pants are a great way to update your wardrobe; they elongate the leg and can be worn in many ways. You will look stunning when you pair this pant with a Commerce Cloud Store  jacket and scoop neck top. ',
            master: {
                masterId: '25696685M',
                orderable: true,
                price: 76.16
            },
            minOrderQuantity: 1,
            name: 'Wide Leg Pant.',
            pageDescription:
                'Wide leg pants are a great way to update your wardrobe; they elongate the leg and can be worn in many ways. You will look stunning when you pair this pant with a Commerce Cloud Store  jacket and scoop neck top. ',
            pageTitle: 'Wide Leg Pant.',
            price: 76.16,
            pricePerUnit: 76.16,
            shortDescription:
                'Wide leg pants are a great way to update your wardrobe; they elongate the leg and can be worn in many ways. You will look stunning when you pair this pant with a Commerce Cloud Store  jacket and scoop neck top. ',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/wide-leg-pant/701644334888M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            upc: '701644334888',
            variants: [
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334871M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '016'
                    }
                },
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334895M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '006'
                    }
                },
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334864M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '014'
                    }
                },
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334901M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '008'
                    }
                },
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334840M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '010'
                    }
                },
                {
                    orderable: true,
                    price: 76.16,
                    productId: '701644334857M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '012'
                    }
                },
                {
                    orderable: false,
                    price: 76.16,
                    productId: '701644334888M',
                    variationValues: {
                        color: 'JJ3WDXX',
                        size: '004'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Black Multi',
                            orderable: false,
                            value: 'JJ3WDXX'
                        }
                    ]
                },
                {
                    id: 'size',
                    name: 'Size',
                    values: [
                        {
                            name: '4',
                            orderable: false,
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
                color: 'JJ3WDXX',
                size: '004'
            },
            c_color: 'JJ3WDXX',
            c_isNewtest: true,
            c_refinementColor: 'black',
            c_size: '004',
            c_width: 'Z'
        }
    ],
    total: 3
}
