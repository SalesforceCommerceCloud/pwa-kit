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
                    productId: 'apple-ipod-nano-green-16gM',
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
        }
    ],
    recoUUID: '79e9f44e-c4d3-405a-ae4c-eba7b4bfdd4a'
}
