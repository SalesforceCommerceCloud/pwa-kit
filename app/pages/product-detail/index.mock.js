/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const basketWithProductSet = {
    _v: '21.3',
    _type: 'basket',
    _resource_state: '9fdc9a8aeaea84a84a9dfed115ad37a0a32c86df4693cc7a9f62afc3395527c7',
    _flash: [
        {
            _type: 'flash',
            type: 'PaymentMethodRequired',
            message:
                'No payment method ID was specified. Please provide a valid payment method ID.',
            path: '$.payment_instruments[0].payment_method_id'
        },
        {
            _type: 'flash',
            type: 'BillingAddressRequired',
            message: 'No billing address was specified. Please provide a valid billing address.',
            path: '$.billing_address'
        },
        {
            _type: 'flash',
            type: 'OrderTotalNotSet',
            message: 'Order total missing, calculation failed.',
            path: '$.order_total'
        },
        {
            _type: 'flash',
            type: 'ShippingAddressRequired',
            message: 'No shipping address was specified. Please provide a valid shipping address.',
            path: '$.shipments[0].shipping_address',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingMethodRequired',
            message:
                'No shipping method ID was specified. Please provide a valid shipping method ID.',
            path: '$.shipments[0].shipping_method',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingItemAdjustedPriceNotSet',
            message: "Price missing for shipping item ''5fb887a2999303b33676e0d3a5''.",
            path: '$.shipping_items[0].adjusted_price'
        }
    ],
    adjusted_merchandize_total_tax: 17.01,
    adjusted_shipping_total_tax: null,
    agent_basket: false,
    basket_id: '437113007d685eab389f1cd229',
    channel_type: 'storefront',
    creation_date: '2023-02-22T21:47:29.585Z',
    currency: 'GBP',
    customer_info: {
        _type: 'customer_info',
        customer_id: 'abkHtKmulJkKgRmrkVwqYYkHBI',
        email: ''
    },
    last_modified: '2023-02-22T22:15:41.482Z',
    merchandize_total_tax: 17.01,
    notes: {
        _type: 'simple_link',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/dw/shop/v21_3/baskets/437113007d685eab389f1cd229/notes'
    },
    order_total: null,
    product_items: [
        {
            _type: 'product_item',
            adjusted_tax: 6.76,
            base_price: 71.03,
            bonus_product_line_item: false,
            gift: false,
            item_id: '5060f31486572338f05d04fc56',
            item_text: 'Quilted Jacket',
            price: 142.06,
            price_after_item_discount: 142.06,
            price_after_order_discount: 142.06,
            product_id: '701642853695M',
            product_name: 'Quilted Jacket',
            quantity: 2,
            shipment_id: 'me',
            tax: 6.76,
            tax_basis: 142.06,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 4.21,
            base_price: 44.16,
            bonus_product_line_item: false,
            gift: false,
            item_id: '9a8003bebeea153d112083f2bd',
            item_text: 'Pull On Pant',
            price: 88.32,
            price_after_item_discount: 88.32,
            price_after_order_discount: 88.32,
            product_id: '701642867104M',
            product_name: 'Pull On Pant',
            quantity: 2,
            shipment_id: 'me',
            tax: 4.21,
            tax_basis: 88.32,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1cda01244dc449d9b245577378',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358101M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1007d8db121aa4331836f8f934',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358095M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    product_sub_total: 357.1,
    product_total: 357.1,
    shipments: [
        {
            _type: 'shipment',
            adjusted_merchandize_total_tax: 17.01,
            adjusted_shipping_total_tax: null,
            gift: false,
            merchandize_total_tax: 17.01,
            product_sub_total: 357.1,
            product_total: 357.1,
            shipment_id: 'me',
            shipment_total: null,
            shipping_status: 'not_shipped',
            shipping_total: null,
            shipping_total_tax: null,
            tax_total: null
        }
    ],
    shipping_items: [
        {
            _type: 'shipping_item',
            adjusted_tax: null,
            base_price: null,
            item_id: '5fb887a2999303b33676e0d3a5',
            item_text: 'Shipping',
            price: null,
            price_after_item_discount: null,
            shipment_id: 'me',
            tax: null,
            tax_basis: null,
            tax_class_id: null,
            tax_rate: 0.05
        }
    ],
    shipping_total: null,
    shipping_total_tax: null,
    taxation: 'gross',
    tax_total: null
}

export const mockProductInWishlist = {
    limit: 1,
    data: [
        {
            brand: 'Apple',
            currency: 'USD',
            id: 'apple-ipod-nano-green-16gM',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Apple iPod Nano, Green, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-electronics-m-catalog/default/dw26470cbd/images/large/ipod-nano-green.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-electronics-m-catalog/default/dw26470cbd/images/large/ipod-nano-green.jpg',
                            title: 'Apple iPod Nano, Green'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'Green'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Apple iPod Nano, Green, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-electronics-m-catalog/default/dw610652b7/images/medium/ipod-nano-green.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-electronics-m-catalog/default/dw610652b7/images/medium/ipod-nano-green.jpg',
                            title: 'Apple iPod Nano, Green'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'Green'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Apple iPod Nano, Green, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-electronics-m-catalog/default/dw09f0fd49/images/small/ipod-nano-green.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-electronics-m-catalog/default/dw09f0fd49/images/small/ipod-nano-green.jpg',
                            title: 'Apple iPod Nano, Green'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'Green'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Apple iPod Nano, Green, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-electronics-m-catalog/default/dw849cd37f/images/swatch/green.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-electronics-m-catalog/default/dw849cd37f/images/swatch/green.jpg',
                            title: 'Apple iPod Nano, Green'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'Green'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 10,
                backorderable: true,
                id: 'inventory_m',
                inStockDate: '2009-03-31T00:00:00.000Z',
                orderable: true,
                preorderable: false,
                stockLevel: 0
            },
            longDescription:
                'Supports MP3 (up to 320 Kbps), MP3 VBR, AAC (up to 320 Kbps), Protected AAC (iTunes Music Store), Audible (formats 2, 3, 4), AIFF, Apple Lossless and WAV audio formats, plus BMP, JPEG, GIF, TIFF, PNG and PSD (Mac only) image formats; podcasting support',
            master: {
                masterId: 'apple-ipod-nanoM',
                orderable: true,
                price: 119.0
            },
            minOrderQuantity: 1,
            name: 'Apple iPod Nano',
            pageDescription:
                'The all new iPod nano has a curved aluminum and glass design and stunning new features. The Genius music feature helps you find music to fit your mood. With the built-in accelerometer, you can rotate the nano to flip through album art with Cover Flow. Plus, view photos and videos in either portrait or landscape.',
            pageKeywords: 'Apple, iPod, Nano, MP3, Music Player',
            pageTitle: 'Apple iPod Nano',
            price: 199.0,
            pricePerUnit: 199.0,
            productPromotions: [
                {
                    calloutMsg: '$50offOrderCountAbove5',
                    promotionId: '$50offOrderCountAbove5'
                },
                {
                    promotionalPrice: 189.0,
                    promotionId: '10$offIpod'
                },
                {
                    promotionalPrice: 194.0,
                    promotionId: '5$offIpod'
                }
            ],
            shortDescription:
                'The all new iPod nano has a curved aluminum and glass design and stunning new features. The Genius music \r\nfeature helps you find music to fit your mood. With the built-in accelerometer, you can rotate the nano to flip through album art with \r\nCover Flow. Plus, view photos and videos in either portrait or landscape.',
            stepQuantity: 1,
            type: {
                variant: true
            },
            unitMeasure: '',
            unitQuantity: 0,
            variants: [
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-silver-8gM',
                    variationValues: {
                        color: 'Silver',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-black-8gM',
                    variationValues: {
                        color: 'Black',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-purple-8gM',
                    variationValues: {
                        color: 'Purple',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-blue-8gM',
                    variationValues: {
                        color: 'Blue',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-green-8gM',
                    variationValues: {
                        color: 'Green',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 119.0,
                    productId: 'apple-ipod-nano-yellow-8gM',
                    variationValues: {
                        color: 'Yellow',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-orange-8gM',
                    variationValues: {
                        color: 'Orange',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 119.0,
                    productId: 'apple-ipod-nano-red-8gM',
                    variationValues: {
                        color: 'Red',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 149.0,
                    productId: 'apple-ipod-nano-fuscia-8gM',
                    variationValues: {
                        color: 'Fuscia',
                        memorySize: '8 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-silver-16gM',
                    variationValues: {
                        color: 'Silver',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-black-16gM',
                    variationValues: {
                        color: 'Black',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-purple-16gM',
                    variationValues: {
                        color: 'Purple',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 159.0,
                    productId: 'apple-ipod-nano-blue-16gM',
                    variationValues: {
                        color: 'Blue',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-green-16gM',
                    variationValues: {
                        color: 'Green',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-yellow-16gM',
                    variationValues: {
                        color: 'Yellow',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 159.0,
                    productId: 'apple-ipod-nano-orange-16gM',
                    variationValues: {
                        color: 'Orange',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-red-16gM',
                    variationValues: {
                        color: 'Red',
                        memorySize: '16 GB'
                    }
                },
                {
                    orderable: true,
                    price: 199.0,
                    productId: 'apple-ipod-nano-fuscia-16gM',
                    variationValues: {
                        color: 'Fuscia',
                        memorySize: '16 GB'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Color',
                    values: [
                        {
                            name: 'Silver',
                            orderable: true,
                            value: 'Silver'
                        },
                        {
                            name: 'Black',
                            orderable: true,
                            value: 'Black'
                        },
                        {
                            name: 'Purple',
                            orderable: true,
                            value: 'Purple'
                        },
                        {
                            name: 'Blue',
                            orderable: true,
                            value: 'Blue'
                        },
                        {
                            name: 'Green',
                            orderable: true,
                            value: 'Green'
                        },
                        {
                            name: 'Yellow',
                            orderable: true,
                            value: 'Yellow'
                        },
                        {
                            name: 'Orange',
                            orderable: true,
                            value: 'Orange'
                        },
                        {
                            name: 'Red',
                            orderable: true,
                            value: 'Red'
                        },
                        {
                            name: 'Fuscia',
                            orderable: true,
                            value: 'Fuscia'
                        }
                    ]
                },
                {
                    id: 'memorySize',
                    name: 'Memory Size',
                    values: [
                        {
                            name: '8 GB',
                            orderable: true,
                            value: '8 GB'
                        },
                        {
                            name: '16 GB',
                            orderable: true,
                            value: '16 GB'
                        }
                    ]
                }
            ],
            variationValues: {
                color: 'Green',
                memorySize: '16 GB'
            },
            c_batteryLife: '24 hours',
            c_batteryType: 'Lithium Ion',
            c_color: 'Green',
            c_dimDepth: '0.24 inches',
            c_dimHeight: '3.6 inches',
            c_dimWeight: '1.3 ounces',
            c_dimWidth: '1.5 inches',
            c_displaySize: '2 inches',
            c_mediaFormat: ['0010', '0020', '0030'],
            c_memorySize: '16 GB',
            c_musicStorage: '4,000 songs',
            c_portableAudioType: ['0010', '0020'],
            c_refinementColor: 'green',
            c_resolution: '320 x 240',
            c_tabDescription:
                'The all new iPod nano has a curved aluminum and glass design and stunning new features. The Genius music feature helps you find music to fit your mood. With the built-in accelerometer, you can rotate the nano to flip through album art with Cover Flow. Plus, view photos and videos in either portrait or landscape.',
            c_tabDetails:
                'Supports MP3 (up to 320 Kbps), MP3 VBR, AAC (up to 320 Kbps), Protected AAC (iTunes Music Store), Audible (formats 2, 3, 4), AIFF, Apple Lossless and WAV audio formats, plus BMP, JPEG, GIF, TIFF, PNG and PSD (Mac only) image formats; podcasting support',
            c_videoStorage: '16 hours'
        }
    ],
    total: 1
}

export const mockWishlistWithItem = {
    limit: 1,
    data: [
        {
            creationDate: '2021-06-12T00:09:00.000Z',
            customerProductListItems: [
                {
                    id: 'b41ad6634e83fc9673625bf087',
                    priority: 1,
                    productId: '25517823M',
                    public: false,
                    purchasedQuantity: 0,
                    quantity: 1,
                    type: 'product'
                }
            ],
            event: {},
            id: 'c1b0edb2ad6fcfb153044ef3b0',
            lastModified: '2021-06-30T04:11:12.602Z',
            public: false,
            name: 'PWA wishlist',
            type: 'wish_list'
        }
    ],
    total: 1
}

export const einsteinRecommendation = {
    recs: [
        {
            id: '11736753M',
            product_name: 'Summer Bomber Jacket',
            image_url:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZCU_007/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5e894c3a/images/large/B0574182_001_L1.jpg',
            product_url:
                'https://zzcu-007.sandbox.us01.dx.commercecloud.salesforce.com/mens-summer-bomber-jacket/11736753M.html?lang=en_US'
        },
        {
            id: '22951021M',
            image_url:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZCU_007/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa77b85b6/images/large/PG.W20766.LEAOLXX.PZ.jpg',
            product_name: 'Classic Wrap',
            product_url:
                'https://zzcu-007.sandbox.us01.dx.commercecloud.salesforce.com/classic-wrap/22951021M.html?lang=en_US'
        },
        {
            id: '25592770M',
            image_url:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZCU_007/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5bd385d4/images/large/PG.10226236.JJGN9A0.BZ.jpg',
            product_name: 'Sleeveless Pleated Floral Front Blouse',
            product_url:
                'https://zzcu-007.sandbox.us01.dx.commercecloud.salesforce.com/sleeveless-pleated-floral-front-blouse/25592770M.html?lang=en_US'
        },
        {
            id: '25752986M',
            image_url:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZCU_007/on/demandware.static/-/Sites-apparel-m-catalog/default/dw03a79af9/images/large/PG.949114314S.REDSI.BZ.jpg',
            product_name: 'Striped Silk Tie',
            product_url:
                'https://zzcu-007.sandbox.us01.dx.commercecloud.salesforce.com/striped-silk-tie/25752986M.html?lang=en_US'
        }
    ],
    recoUUID: '79e9f44e-c4d3-405a-ae4c-eba7b4bfdd4a'
}

export const masterProduct = {
    currency: 'GBP',
    id: '25517823M',
    imageGroups: [
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8e308d98/images/large/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8e308d98/images/large/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                },
                {
                    alt: 'Long Sleeve Crew Neck, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd1e2b03/images/large/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd1e2b03/images/large/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Black, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8e308d98/images/large/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8e308d98/images/large/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Black, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd1e2b03/images/large/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd1e2b03/images/large/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ169XX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3953668a/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3953668a/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d319b25/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d319b25/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ2XNXX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1b3bcb2c/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1b3bcb2c/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6971e423/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6971e423/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ3HDXX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd63a0b09/images/large/PG.10219685.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd63a0b09/images/large/PG.10219685.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcc40c347/images/large/PG.10219685.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcc40c347/images/large/PG.10219685.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ5QZXX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw53173bc3/images/large/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw53173bc3/images/large/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee32d59f/images/large/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee32d59f/images/large/PG.10219685.JJ825XX.BZ.jpg',
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
                    alt: 'Long Sleeve Crew Neck, Sugar, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3f05f8ad/images/large/PG.10219685.JJG80XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3f05f8ad/images/large/PG.10219685.JJG80XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Sugar, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8fb99643/images/large/PG.10219685.JJG80XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8fb99643/images/large/PG.10219685.JJG80XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJG80XX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, White, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwffff53b4/images/large/PG.10219685.JJI15XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwffff53b4/images/large/PG.10219685.JJI15XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                },
                {
                    alt: 'Long Sleeve Crew Neck, White, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70998835/images/large/PG.10219685.JJI15XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70998835/images/large/PG.10219685.JJI15XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJI15XX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                },
                {
                    alt: 'Long Sleeve Crew Neck, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8c8ef3ec/images/medium/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8c8ef3ec/images/medium/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Black, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Black, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8c8ef3ec/images/medium/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8c8ef3ec/images/medium/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ169XX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2176d3c1/images/medium/PG.10219685.JJ2XNXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2176d3c1/images/medium/PG.10219685.JJ2XNXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e65aaef/images/medium/PG.10219685.JJ2XNXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e65aaef/images/medium/PG.10219685.JJ2XNXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ2XNXX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw33449a81/images/medium/PG.10219685.JJ3HDXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw33449a81/images/medium/PG.10219685.JJ3HDXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw05b9e688/images/medium/PG.10219685.JJ3HDXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw05b9e688/images/medium/PG.10219685.JJ3HDXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ3HDXX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd39e013d/images/medium/PG.10219685.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd39e013d/images/medium/PG.10219685.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d293e72/images/medium/PG.10219685.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d293e72/images/medium/PG.10219685.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ5QZXX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw494a9ec2/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw494a9ec2/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3cc3ea5a/images/medium/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3cc3ea5a/images/medium/PG.10219685.JJ825XX.BZ.jpg',
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
                    alt: 'Long Sleeve Crew Neck, Sugar, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd85025df/images/medium/PG.10219685.JJG80XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd85025df/images/medium/PG.10219685.JJG80XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Sugar, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c0bd1dd/images/medium/PG.10219685.JJG80XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c0bd1dd/images/medium/PG.10219685.JJG80XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJG80XX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, White, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw68b1a4da/images/medium/PG.10219685.JJI15XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw68b1a4da/images/medium/PG.10219685.JJI15XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                },
                {
                    alt: 'Long Sleeve Crew Neck, White, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw09dc4735/images/medium/PG.10219685.JJI15XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw09dc4735/images/medium/PG.10219685.JJI15XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJI15XX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw08152bc5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw08152bc5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                },
                {
                    alt: 'Long Sleeve Crew Neck, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70fddbeb/images/small/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70fddbeb/images/small/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, '
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Black, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw08152bc5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw08152bc5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Black, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70fddbeb/images/small/PG.10219685.JJ169XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw70fddbeb/images/small/PG.10219685.JJ169XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ169XX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd955a0e3/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd955a0e3/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bc8bbba/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bc8bbba/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ2XNXX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3f8ccc60/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3f8ccc60/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3c0661c0/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3c0661c0/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ3HDXX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfe34fa56/images/small/PG.10219685.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfe34fa56/images/small/PG.10219685.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe68c4f72/images/small/PG.10219685.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe68c4f72/images/small/PG.10219685.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ5QZXX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4177459/images/small/PG.10219685.JJ825XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4177459/images/small/PG.10219685.JJ825XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Fire Red'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaba24577/images/small/PG.10219685.JJ825XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwaba24577/images/small/PG.10219685.JJ825XX.BZ.jpg',
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
                    alt: 'Long Sleeve Crew Neck, Sugar, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwba433282/images/small/PG.10219685.JJG80XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwba433282/images/small/PG.10219685.JJG80XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                },
                {
                    alt: 'Long Sleeve Crew Neck, Sugar, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f0e0a4a/images/small/PG.10219685.JJG80XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f0e0a4a/images/small/PG.10219685.JJG80XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJG80XX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, White, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8b207046/images/small/PG.10219685.JJI15XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8b207046/images/small/PG.10219685.JJI15XX.PZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                },
                {
                    alt: 'Long Sleeve Crew Neck, White, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6716f8d9/images/small/PG.10219685.JJI15XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6716f8d9/images/small/PG.10219685.JJI15XX.BZ.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJI15XX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Black, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd7e2d9ec/images/swatch/PG.10219685.JJ169XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd7e2d9ec/images/swatch/PG.10219685.JJ169XX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Black'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ169XX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Grey Heather, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd9e8ed2f/images/swatch/PG.10219685.JJ2XNXX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd9e8ed2f/images/swatch/PG.10219685.JJ2XNXX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ2XNXX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Meadow Violet, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw64d3780f/images/swatch/PG.10219685.JJ3HDXX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw64d3780f/images/swatch/PG.10219685.JJ3HDXX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Meadow Violet'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ3HDXX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Begonia Pink, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a3f3991/images/swatch/PG.10219685.JJ5QZXX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a3f3991/images/swatch/PG.10219685.JJ5QZXX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Begonia Pink'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ5QZXX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Fire Red, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw38d16bd5/images/swatch/PG.10219685.JJ825XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw38d16bd5/images/swatch/PG.10219685.JJ825XX.CP.jpg',
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
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, Sugar, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5c722b/images/swatch/PG.10219685.JJG80XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0a5c722b/images/swatch/PG.10219685.JJG80XX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, Sugar'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJG80XX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Crew Neck, White, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3449e14/images/swatch/PG.10219685.JJI15XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3449e14/images/swatch/PG.10219685.JJI15XX.CP.jpg',
                    title: 'Long Sleeve Crew Neck, White'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJI15XX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        }
    ],
    inventory: {
        ats: 3496,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 3496
    },
    longDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    master: {
        masterId: '25517823M',
        orderable: true,
        price: 9.59
    },
    minOrderQuantity: 1,
    name: 'Long Sleeve Crew Neck',
    pageDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    pageTitle: 'Long Sleeve Crew Neck',
    price: 9.59,
    pricePerUnit: 9.59,
    priceRanges: [
        {
            maxPrice: 15.36,
            minPrice: 15.36,
            pricebook: 'gbp-m-list-prices'
        },
        {
            maxPrice: 9.59,
            minPrice: 9.59,
            pricebook: 'gbp-m-sale-prices'
        }
    ],
    primaryCategoryId: 'womens-clothing-tops',
    productPromotions: [
        {
            calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
            promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
        },
        {
            calloutMsg: '$50 Fixed Products Amount Above 100',
            promotionId: '$50FixedProductsAmountAbove100'
        }
    ],
    shortDescription:
        'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
    slugUrl:
        'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/long-sleeve-crew-neck/25517823M.html?lang=en_GB',
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
            price: 9.59,
            productId: '701642811398M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ825XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841227M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ3HDXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841265M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811473M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJI15XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811435M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJG80XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811312M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ2XNXX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811237M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ169XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643342570M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ3HDXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811343M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ2XNXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811404M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ825XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811336M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ2XNXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811268M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ169XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643070756M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ2XNXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811497M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJI15XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811480M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJI15XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811466M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJG80XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811428M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ825XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643070732M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ825XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811244M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ169XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643070763M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJG80XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643342587M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811503M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJI15XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811459M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJG80XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643070725M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ169XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841289M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841272M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841241M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ3HDXX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811329M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ2XNXX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811251M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ169XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701643070770M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJI15XX',
                size: '9XS'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841296M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841258M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ3HDXX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811442M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJG80XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642811411M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ825XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 9.59,
            productId: '701642841234M',
            tieredPrices: [
                {
                    price: 15.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 9.59,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ3HDXX',
                size: '9MD'
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
    ]
}

export const productsForEinstein = {
    data: [
        {
            currency: 'GBP',
            id: '11736753M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa7c11183/images/large/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa7c11183/images/large/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29d9c13c/images/large/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29d9c13c/images/large/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw145e32f5/images/large/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw145e32f5/images/large/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e197fab/images/large/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e197fab/images/large/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, BLACK, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa7c11183/images/large/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa7c11183/images/large/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29d9c13c/images/large/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29d9c13c/images/large/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw145e32f5/images/large/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw145e32f5/images/large/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e197fab/images/large/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e197fab/images/large/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: '001'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d41604b/images/medium/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d41604b/images/medium/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf703bd28/images/medium/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf703bd28/images/medium/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3addc0d7/images/medium/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3addc0d7/images/medium/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa693e31d/images/medium/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa693e31d/images/medium/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, BLACK, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d41604b/images/medium/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d41604b/images/medium/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf703bd28/images/medium/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf703bd28/images/medium/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3addc0d7/images/medium/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3addc0d7/images/medium/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa693e31d/images/medium/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa693e31d/images/medium/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: '001'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52e39202/images/small/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52e39202/images/small/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2fc48c3/images/small/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2fc48c3/images/small/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f5e830c/images/small/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f5e830c/images/small/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, '
                        },
                        {
                            alt: 'Summer Bomber Jacket, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc458e4c6/images/small/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc458e4c6/images/small/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, BLACK, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52e39202/images/small/B0574182_001_0.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52e39202/images/small/B0574182_001_0.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2fc48c3/images/small/B0574182_001_L1.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2fc48c3/images/small/B0574182_001_L1.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f5e830c/images/small/B0574182_001_L2.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1f5e830c/images/small/B0574182_001_L2.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        },
                        {
                            alt: 'Summer Bomber Jacket, BLACK, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc458e4c6/images/small/B0574182_001_L3.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc458e4c6/images/small/B0574182_001_L3.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: '001'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, , swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd1e0f425/images/swatch/B0574182_001_sw.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd1e0f425/images/swatch/B0574182_001_sw.jpg',
                            title: 'Summer Bomber Jacket, '
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Summer Bomber Jacket, BLACK, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd1e0f425/images/swatch/B0574182_001_sw.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd1e0f425/images/swatch/B0574182_001_sw.jpg',
                            title: 'Summer Bomber Jacket, BLACK'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: '001'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 556,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 556
            },
            longDescription:
                '<ul>\n<li>70% cotton, 30% polyester</li>\n<li>short bomber jacket</li>\n<li>stand up collar with tab and button detailing</li>\n<li>front zip closure</li>\n<li>strip elastic hem detailing</li>\n<li>dry clean only</li>\n</ul>',
            master: {
                masterId: '11736753M',
                orderable: true,
                price: 201.6
            },
            minOrderQuantity: 1,
            name: 'Summer Bomber Jacket',
            pageDescription:
                'This lightweight bomber jacket is the epitome of summer style. An old school look mixed with a modern fit. Made in our lightweight brushed cotton  polyester fabric.',
            pageTitle: "Men's Summer Bomber Jacket",
            price: 201.6,
            pricePerUnit: 201.6,
            primaryCategoryId: 'mens-clothing-jackets',
            shortDescription:
                'This lightweight bomber jacket is the epitome of summer style. An old school look mixed with a modern fit. Made in our lightweight brushed cotton polyester fabric.',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/mens-summer-bomber-jacket/11736753M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                master: true
            },
            variants: [
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541099M',
                    variationValues: {
                        color: '001',
                        size: 'L'
                    }
                },
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541075M',
                    variationValues: {
                        color: '001',
                        size: 'S'
                    }
                },
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541068M',
                    variationValues: {
                        color: '001',
                        size: 'XS'
                    }
                },
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541082M',
                    variationValues: {
                        color: '001',
                        size: 'M'
                    }
                },
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541112M',
                    variationValues: {
                        color: '001',
                        size: 'XXL'
                    }
                },
                {
                    orderable: true,
                    price: 201.6,
                    productId: '883360541105M',
                    variationValues: {
                        color: '001',
                        size: 'XL'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'BLACK',
                            orderable: true,
                            value: '001'
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
                            value: 'XS'
                        },
                        {
                            name: 'S',
                            orderable: true,
                            value: 'S'
                        },
                        {
                            name: 'M',
                            orderable: true,
                            value: 'M'
                        },
                        {
                            name: 'L',
                            orderable: true,
                            value: 'L'
                        },
                        {
                            name: 'XL',
                            orderable: true,
                            value: 'XL'
                        },
                        {
                            name: 'XXL',
                            orderable: true,
                            value: 'XXL'
                        }
                    ]
                }
            ],
            c_isNew: true,
            c_isNewtest: true,
            c_isSale: true
        },
        {
            currency: 'GBP',
            id: '22951021M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Classic Wrap, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ef8d07f/images/large/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ef8d07f/images/large/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Black, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw467779a7/images/large/PG.W20766.BLACKXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw467779a7/images/large/PG.W20766.BLACKXX.PZ.jpg',
                            title: 'Classic Wrap, Black'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'BLACKXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Ivory, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw00953cab/images/large/PG.W20766.IVORYXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw00953cab/images/large/PG.W20766.IVORYXX.PZ.jpg',
                            title: 'Classic Wrap, Ivory'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'IVORYXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Olive, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ef8d07f/images/large/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ef8d07f/images/large/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, Olive'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'LEAOLXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Sapphire, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw67841493/images/large/PG.W20766.SAPPHXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw67841493/images/large/PG.W20766.SAPPHXX.PZ.jpg',
                            title: 'Classic Wrap, Sapphire'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'SAPPHXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Violet, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw558940a8/images/large/PG.W20766.VIOLTXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw558940a8/images/large/PG.W20766.VIOLTXX.PZ.jpg',
                            title: 'Classic Wrap, Violet'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'VIOLTXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb3959029/images/medium/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb3959029/images/medium/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Black, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7ea06e44/images/medium/PG.W20766.BLACKXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7ea06e44/images/medium/PG.W20766.BLACKXX.PZ.jpg',
                            title: 'Classic Wrap, Black'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'BLACKXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Ivory, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw14968da1/images/medium/PG.W20766.IVORYXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw14968da1/images/medium/PG.W20766.IVORYXX.PZ.jpg',
                            title: 'Classic Wrap, Ivory'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'IVORYXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Olive, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb3959029/images/medium/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb3959029/images/medium/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, Olive'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'LEAOLXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Sapphire, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw27183704/images/medium/PG.W20766.SAPPHXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw27183704/images/medium/PG.W20766.SAPPHXX.PZ.jpg',
                            title: 'Classic Wrap, Sapphire'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'SAPPHXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Violet, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw44f3fb31/images/medium/PG.W20766.VIOLTXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw44f3fb31/images/medium/PG.W20766.VIOLTXX.PZ.jpg',
                            title: 'Classic Wrap, Violet'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'VIOLTXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7dbda36a/images/small/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7dbda36a/images/small/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Black, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98faf635/images/small/PG.W20766.BLACKXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98faf635/images/small/PG.W20766.BLACKXX.PZ.jpg',
                            title: 'Classic Wrap, Black'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'BLACKXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Ivory, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcb100f03/images/small/PG.W20766.IVORYXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcb100f03/images/small/PG.W20766.IVORYXX.PZ.jpg',
                            title: 'Classic Wrap, Ivory'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'IVORYXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Olive, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7dbda36a/images/small/PG.W20766.LEAOLXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7dbda36a/images/small/PG.W20766.LEAOLXX.PZ.jpg',
                            title: 'Classic Wrap, Olive'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'LEAOLXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Sapphire, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbe6b990b/images/small/PG.W20766.SAPPHXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbe6b990b/images/small/PG.W20766.SAPPHXX.PZ.jpg',
                            title: 'Classic Wrap, Sapphire'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'SAPPHXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Violet, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0df91c93/images/small/PG.W20766.VIOLTXX.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw0df91c93/images/small/PG.W20766.VIOLTXX.PZ.jpg',
                            title: 'Classic Wrap, Violet'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'VIOLTXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, , swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1b49b69/images/swatch/19472_158_SW.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1b49b69/images/swatch/19472_158_SW.jpg',
                            title: 'Classic Wrap, '
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Black, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd9f951b2/images/swatch/PG.W20766.BLACKXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd9f951b2/images/swatch/PG.W20766.BLACKXX.CP.jpg',
                            title: 'Classic Wrap, Black'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'BLACKXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Ivory, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc03a0419/images/swatch/PG.W20766.IVORYXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc03a0419/images/swatch/PG.W20766.IVORYXX.CP.jpg',
                            title: 'Classic Wrap, Ivory'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'IVORYXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Olive, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw47751f3a/images/swatch/PG.W20766.LEAOLXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw47751f3a/images/swatch/PG.W20766.LEAOLXX.CP.jpg',
                            title: 'Classic Wrap, Olive'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'LEAOLXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Sapphire, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw13c12c0c/images/swatch/PG.W20766.SAPPHXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw13c12c0c/images/swatch/PG.W20766.SAPPHXX.CP.jpg',
                            title: 'Classic Wrap, Sapphire'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'SAPPHXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Classic Wrap, Violet, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2804bd6/images/swatch/PG.W20766.VIOLTXX.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf2804bd6/images/swatch/PG.W20766.VIOLTXX.CP.jpg',
                            title: 'Classic Wrap, Violet'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'VIOLTXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 434,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 999999
            },
            longDescription:
                'Our classic wrap is a must have for topping outfits.  Try any one of our great colours to spice up your wardrobe!',
            master: {
                masterId: '22951021M',
                orderable: true,
                price: 21.76
            },
            minOrderQuantity: 1,
            name: 'Classic Wrap',
            pageDescription:
                'Our classic wrap is a must have for topping outfits.  Try any one of our great colours to spice up your wardrobe!',
            pageTitle: 'Classic Wrap',
            price: 21.76,
            pricePerUnit: 21.76,
            priceRanges: [
                {
                    maxPrice: 21.76,
                    minPrice: 21.76,
                    pricebook: 'gbp-m-list-prices'
                },
                {
                    maxPrice: 21.76,
                    minPrice: 21.76,
                    pricebook: 'gbp-m-sale-prices'
                }
            ],
            primaryCategoryId: 'womens-accessories-scarves',
            shortDescription:
                'Our classic wrap is a must have for topping outfits.  Try any one of our great colours to spice up your wardrobe!',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/classic-wrap/22951021M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                master: true
            },
            variants: [
                {
                    orderable: true,
                    productId: '799927335059-1M',
                    variationValues: {
                        color: 'PERIDXX'
                    }
                },
                {
                    orderable: true,
                    price: 21.76,
                    productId: '799927335059M',
                    tieredPrices: [
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'IVORYXX'
                    }
                },
                {
                    orderable: true,
                    price: 21.76,
                    productId: '799927335042M',
                    tieredPrices: [
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'BLACKXX'
                    }
                },
                {
                    orderable: true,
                    price: 21.76,
                    productId: '799927735422M',
                    tieredPrices: [
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'SAPPHXX'
                    }
                },
                {
                    orderable: true,
                    price: 21.76,
                    productId: '799927273078M',
                    tieredPrices: [
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'LEAOLXX'
                    }
                },
                {
                    orderable: true,
                    price: 21.76,
                    productId: '799927968851M',
                    tieredPrices: [
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 21.76,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'VIOLTXX'
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
                            value: 'BLACKXX'
                        },
                        {
                            name: 'Ivory',
                            orderable: true,
                            value: 'IVORYXX'
                        },
                        {
                            name: 'Olive',
                            orderable: true,
                            value: 'LEAOLXX'
                        },
                        {
                            name: 'Peridot',
                            orderable: true,
                            value: 'PERIDXX'
                        },
                        {
                            name: 'Sapphire',
                            orderable: true,
                            value: 'SAPPHXX'
                        },
                        {
                            name: 'Violet',
                            orderable: true,
                            value: 'VIOLTXX'
                        }
                    ]
                }
            ]
        },
        {
            currency: 'GBP',
            id: '25592770M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a5ac15c/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a5ac15c/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd233175/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd233175/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a5ac15c/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6a5ac15c/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd233175/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd233175/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJGN9A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw039381a0/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw039381a0/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5584bb16/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5584bb16/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw039381a0/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw039381a0/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5584bb16/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5584bb16/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJGN9A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2dcd040a/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2dcd040a/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd5454f22/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd5454f22/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2dcd040a/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2dcd040a/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        },
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd5454f22/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd5454f22/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJGN9A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwda6004d7/images/swatch/PG.10226236.JJGN9A0.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwda6004d7/images/swatch/PG.10226236.JJGN9A0.CP.jpg',
                            title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJGN9A0'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 169,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 169
            },
            longDescription:
                'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
            master: {
                masterId: '25592770M',
                orderable: true,
                price: 35.19
            },
            minOrderQuantity: 1,
            name: 'Sleeveless Pleated Floral Front Blouse',
            pageDescription:
                'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
            pageTitle: 'Sleeveless Pleated Floral Front Blouse',
            price: 35.19,
            pricePerUnit: 35.19,
            priceRanges: [
                {
                    maxPrice: 47.36,
                    minPrice: 47.36,
                    pricebook: 'gbp-m-list-prices'
                },
                {
                    maxPrice: 35.19,
                    minPrice: 35.19,
                    pricebook: 'gbp-m-sale-prices'
                }
            ],
            primaryCategoryId: 'womens-clothing-tops',
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
                'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/sleeveless-pleated-floral-front-blouse/25592770M.html?lang=en_GB',
            stepQuantity: 1,
            type: {
                master: true
            },
            validFrom: {
                default: '2011-01-26T05:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 35.19,
                    productId: '701644044220M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '004'
                    }
                },
                {
                    orderable: false,
                    price: 35.19,
                    productId: '701644044183M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '010'
                    }
                },
                {
                    orderable: false,
                    price: 35.19,
                    productId: '701644044244M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '008'
                    }
                },
                {
                    orderable: false,
                    price: 35.19,
                    productId: '701644044190M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '012'
                    }
                },
                {
                    orderable: false,
                    price: 35.19,
                    productId: '701644044206M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '014'
                    }
                },
                {
                    orderable: true,
                    price: 35.19,
                    productId: '701644044213M',
                    tieredPrices: [
                        {
                            price: 47.36,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 35.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'JJGN9A0',
                        size: '016'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Tulip Multi',
                            orderable: true,
                            value: 'JJGN9A0'
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
                            name: '8',
                            orderable: false,
                            value: '008'
                        },
                        {
                            name: '10',
                            orderable: false,
                            value: '010'
                        },
                        {
                            name: '12',
                            orderable: false,
                            value: '012'
                        },
                        {
                            name: '14',
                            orderable: false,
                            value: '014'
                        },
                        {
                            name: '16',
                            orderable: true,
                            value: '016'
                        }
                    ]
                }
            ]
        },
        {
            currency: 'GBP',
            id: '25752986M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, '
                        },
                        {
                            alt: 'Striped Silk Tie, , large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdb89a542/images/large/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdb89a542/images/large/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, '
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Red, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        },
                        {
                            alt: 'Striped Silk Tie, Red, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdb89a542/images/large/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdb89a542/images/large/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'REDSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Turquoise, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw43346b0a/images/large/PG.949114314S.TURQUSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw43346b0a/images/large/PG.949114314S.TURQUSI.PZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        },
                        {
                            alt: 'Striped Silk Tie, Turquoise, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2db7f384/images/large/PG.949114314S.TURQUSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2db7f384/images/large/PG.949114314S.TURQUSI.BZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'TURQUSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw17734eba/images/medium/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw17734eba/images/medium/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, '
                        },
                        {
                            alt: 'Striped Silk Tie, , medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9ea1baf/images/medium/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9ea1baf/images/medium/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, '
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Red, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw17734eba/images/medium/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw17734eba/images/medium/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        },
                        {
                            alt: 'Striped Silk Tie, Red, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9ea1baf/images/medium/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9ea1baf/images/medium/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'REDSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Turquoise, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw343b458d/images/medium/PG.949114314S.TURQUSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw343b458d/images/medium/PG.949114314S.TURQUSI.PZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        },
                        {
                            alt: 'Striped Silk Tie, Turquoise, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb6ce8e4f/images/medium/PG.949114314S.TURQUSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb6ce8e4f/images/medium/PG.949114314S.TURQUSI.BZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'TURQUSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw94a9de1f/images/small/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw94a9de1f/images/small/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, '
                        },
                        {
                            alt: 'Striped Silk Tie, , small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9eb2a476/images/small/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9eb2a476/images/small/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, '
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Red, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw94a9de1f/images/small/PG.949114314S.REDSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw94a9de1f/images/small/PG.949114314S.REDSI.PZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        },
                        {
                            alt: 'Striped Silk Tie, Red, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9eb2a476/images/small/PG.949114314S.REDSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9eb2a476/images/small/PG.949114314S.REDSI.BZ.jpg',
                            title: 'Striped Silk Tie, Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'REDSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Turquoise, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1bdc0e4/images/small/PG.949114314S.TURQUSI.PZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1bdc0e4/images/small/PG.949114314S.TURQUSI.PZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        },
                        {
                            alt: 'Striped Silk Tie, Turquoise, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw78cf604d/images/small/PG.949114314S.TURQUSI.BZ.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw78cf604d/images/small/PG.949114314S.TURQUSI.BZ.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'TURQUSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Red, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwda0ae10e/images/swatch/PG.949114314S.REDSI.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwda0ae10e/images/swatch/PG.949114314S.REDSI.CP.jpg',
                            title: 'Striped Silk Tie, Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'REDSI'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                },
                {
                    images: [
                        {
                            alt: 'Striped Silk Tie, Turquoise, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6d7226e5/images/swatch/PG.949114314S.TURQUSI.CP.jpg',
                            link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6d7226e5/images/swatch/PG.949114314S.TURQUSI.CP.jpg',
                            title: 'Striped Silk Tie, Turquoise'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'TURQUSI'
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
                orderable: false,
                preorderable: false,
                stockLevel: 0
            },
            longDescription:
                "This silk tie works well with a Commerce Cloud Store dress shirt and suit It's perfect for any occasion.",
            master: {
                masterId: '25752986M',
                orderable: false,
                price: 19.19
            },
            minOrderQuantity: 2,
            name: 'Striped Silk Tie',
            pageDescription:
                "This silk tie works well with a Commerce Cloud Store dress shirt and suit It's perfect for any occasion.",
            pageTitle: 'Striped Silk Tie',
            price: 19.19,
            pricePerUnit: 19.19,
            priceRanges: [
                {
                    maxPrice: 25.28,
                    minPrice: 25.28,
                    pricebook: 'gbp-m-list-prices'
                },
                {
                    maxPrice: 19.19,
                    minPrice: 19.19,
                    pricebook: 'gbp-m-sale-prices'
                }
            ],
            primaryCategoryId: 'mens-accessories-ties',
            productPromotions: [
                {
                    calloutMsg: 'Get 20% off of this tie.',
                    promotionId: 'PromotionTest_WithoutQualifying'
                }
            ],
            shortDescription:
                "This silk tie works well with a Commerce Cloud Store dress shirt and suit. It's perfect for any occasion.",
            slugUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/striped-silk-tie/25752986M.html?lang=en_GB',
            stepQuantity: 2,
            type: {
                master: true
            },
            unitQuantity: 0,
            validFrom: {
                default: '2011-02-07T05:00:00.000Z'
            },
            variants: [
                {
                    orderable: false,
                    price: 19.19,
                    productId: '793775370033M',
                    tieredPrices: [
                        {
                            price: 25.28,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 19.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'TURQUSI'
                    }
                },
                {
                    orderable: false,
                    price: 19.19,
                    productId: '793775362380M',
                    tieredPrices: [
                        {
                            price: 25.28,
                            pricebook: 'gbp-m-list-prices',
                            quantity: 1
                        },
                        {
                            price: 19.19,
                            pricebook: 'gbp-m-sale-prices',
                            quantity: 1
                        }
                    ],
                    variationValues: {
                        color: 'REDSI'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Red',
                            orderable: false,
                            value: 'REDSI'
                        },
                        {
                            name: 'Turquoise',
                            orderable: false,
                            value: 'TURQUSI'
                        }
                    ]
                }
            ],
            c_isSale: true
        }
    ],
    limit: 10,
    total: 10
}
