/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const mockOrder = {
    adjustedMerchandizeTotalTax: 9.5,
    adjustedShippingTotalTax: 0.0,
    billingAddress: {
        address1: '123 Walnut Place',
        city: 'Coquitlam',
        countryCode: 'CA',
        firstName: 'Test',
        fullName: 'Test',
        id: 'b00586d85f0b5c514bffe45efa',
        lastName: 'Test',
        phone: '(778) 888-8888',
        postalCode: 'V3J 888',
        stateCode: 'BC'
    },
    channelType: 'storefront',
    confirmationStatus: 'not_confirmed',
    createdBy: 'Customer',
    creationDate: '2023-03-21T23:24:22.160Z',
    currency: 'GBP',
    customerInfo: {
        customerId: 'ab3gGRbiTBIlqu4IEIQXx6zz5i',
        customerName: 'Kevin He',
        customerNo: '00213505',
        email: 'test@gmail.com'
    },
    customerName: 'Kevin He',
    exportStatus: 'not_exported',
    lastModified: '2023-03-21T23:24:22.179Z',
    merchandizeTotalTax: 9.5,
    notes: {},
    orderNo: '00022108',
    orderToken: 'NyRJRVT5fZ7isnqrgbc3GZPKw82gBBn2YD_sAZISoAk',
    orderTotal: 82.56,
    paymentInstruments: [
        {
            amount: 0.0,
            paymentCard: {
                cardType: 'Visa',
                creditCardExpired: false,
                expirationMonth: 12,
                expirationYear: 2023,
                holder: 'test',
                maskedNumber: '************1111',
                numberLastDigits: '1111'
            },
            paymentInstrumentId: 'eebb2adb2f44615b2559ee2624',
            paymentMethodId: 'CREDIT_CARD'
        }
    ],
    paymentStatus: 'not_paid',
    productItems: [
        {
            adjustedTax: 9.5,
            basePrice: 82.56,
            bonusProductLineItem: false,
            gift: false,
            itemId: '46133ac13092304bde7e32f508',
            itemText: 'Pleated Dress With Front Sash.',
            price: 82.56,
            priceAfterItemDiscount: 82.56,
            priceAfterOrderDiscount: 82.56,
            productId: '701644397425M',
            productName: 'Pleated Dress With Front Sash.',
            quantity: 1,
            shipmentId: 'me',
            tax: 9.5,
            taxBasis: 82.56,
            taxClassId: 'standard',
            taxRate: 0.13
        }
    ],
    productSubTotal: 82.56,
    productTotal: 82.56,
    shipments: [
        {
            adjustedMerchandizeTotalTax: 9.5,
            adjustedShippingTotalTax: 0.0,
            gift: false,
            merchandizeTotalTax: 9.5,
            productSubTotal: 82.56,
            productTotal: 82.56,
            shipmentId: 'me',
            shipmentTotal: 82.56,
            shippingAddress: {
                address1: '123 Walnut Place',
                city: 'Coquitlam',
                countryCode: 'CA',
                firstName: 'Test',
                fullName: 'Test',
                id: '47a2440529ec183067f4f7be28',
                lastName: 'Test',
                phone: '(778) 888-8888',
                postalCode: 'V3J 888',
                stateCode: 'BC'
            },
            shippingMethod: {
                description: 'Super Saver delivery (arrives in 3-7 business days)',
                id: 'GBP004',
                name: 'Super Saver',
                price: 1.99,
                shippingPromotions: [
                    {
                        calloutMsg: 'Free Shipping Amount Above 50',
                        promotionId: 'FreeShippingAmountAbove50',
                        promotionName: 'Free Shipping Amount Above 50'
                    }
                ],
                c_estimatedArrivalTime: '3-7 Business Days'
            },
            shippingStatus: 'not_shipped',
            shippingTotal: 0.0,
            shippingTotalTax: 0.23,
            taxTotal: 9.5
        }
    ],
    shippingItems: [
        {
            adjustedTax: 0.0,
            basePrice: 1.99,
            itemId: 'c5c3a39622dd75b98339577648',
            itemText: 'Shipping',
            price: 1.99,
            priceAdjustments: [
                {
                    appliedDiscount: {
                        amount: 1
                    },
                    creationDate: '2023-03-21T23:24:22.171Z',
                    custom: false,
                    itemText: 'Free Shipping Amount Above 50',
                    lastModified: '2023-03-21T23:24:22.179Z',
                    manual: false,
                    price: -1.99,
                    priceAdjustmentId: '1b820eb19f203a1be1fdb1a3c5',
                    promotionId: 'FreeShippingAmountAbove50'
                }
            ],
            priceAfterItemDiscount: 0.0,
            shipmentId: 'me',
            tax: 0.23,
            taxBasis: 1.99,
            taxClassId: 'standard',
            taxRate: 0.13
        }
    ],
    shippingStatus: 'not_shipped',
    shippingTotal: 0.0,
    shippingTotalTax: 0.23,
    siteId: 'RefArchGlobal',
    status: 'created',
    taxation: 'gross',
    taxTotal: 9.5
}

export const mockProducts = {
    limit: 1,
    data: [
        {
            currency: 'GBP',
            id: '701644397425M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf19e7e52/images/large/PG.10247254.JJBF5XX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf19e7e52/images/large/PG.10247254.JJBF5XX.PZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        },
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8d30fe07/images/large/PG.10247254.JJBF5XX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8d30fe07/images/large/PG.10247254.JJBF5XX.BZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJBF5XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw936eab4c/images/medium/PG.10247254.JJBF5XX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw936eab4c/images/medium/PG.10247254.JJBF5XX.PZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        },
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw69f919e5/images/medium/PG.10247254.JJBF5XX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw69f919e5/images/medium/PG.10247254.JJBF5XX.BZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJBF5XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw37b976cf/images/small/PG.10247254.JJBF5XX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw37b976cf/images/small/PG.10247254.JJBF5XX.PZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        },
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23b8f2c4/images/small/PG.10247254.JJBF5XX.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23b8f2c4/images/small/PG.10247254.JJBF5XX.BZ.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJBF5XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Dress With Front Sash., Admiral Navy, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51d6dd38/images/swatch/PG.10247254.JJBF5XX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51d6dd38/images/swatch/PG.10247254.JJBF5XX.CP.jpg',
                            title: 'Pleated Dress With Front Sash., Admiral Navy'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJBF5XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 90,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 90
            },
            longDescription:
                'The Pleated dress is a classic style that looks amazing on all shapes and sizes. ',
            master: {
                masterId: '25697800M',
                orderable: true,
                price: 82.56
            },
            minOrderQuantity: 1,
            name: 'Pleated Dress With Front Sash.',
            pageDescription:
                'The Pleated dress is a classic style that looks amazing on all shapes and sizes. ',
            pageTitle: 'Pleated Dress With Front Sash.',
            price: 82.56,
            pricePerUnit: 82.56,
            productPromotions: [
                {
                    calloutMsg: 'Bonus Product for Order Amounts Above 250',
                    promotionId: 'BonusProductOnOrderOfAmountABove250'
                }
            ],
            shortDescription:
                'The Pleated dress is a classic style that looks amazing on all shapes and sizes. ',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/pleaded-dress-with-front-sash/701644397425M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            upc: '701644397425',
            variants: [
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397418M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '006'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397364M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '012'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397371M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '014'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397425M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '008'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397388M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '016'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397401M',
                    variationValues: {
                        color: 'JJBF5XX',
                        size: '004'
                    }
                },
                {
                    orderable: true,
                    price: 82.56,
                    productId: '701644397357M',
                    variationValues: {
                        color: 'JJBF5XX',
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
                            name: 'Admiral Navy',
                            orderable: true,
                            value: 'JJBF5XX'
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
                color: 'JJBF5XX',
                size: '008'
            },
            c_color: 'JJBF5XX',
            c_isNewtest: true,
            c_refinementColor: 'blue',
            c_size: '008',
            c_width: 'Z'
        }
    ],
    total: 1
}
