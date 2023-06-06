/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const mockRecommendersResponse = {
    recommenders: [
        {
            name: 'recently-viewed-products',
            description: 'Recently viewed products.',
            recommenderType: 'recently-viewed'
        }
    ]
}

export const mockAddToCartProduct = {productId: '883360544021M', sku: '', price: 155, quantity: 1}

export const mockRecommenderDetails = {
    __recoUUID: '883360544021M',
    recommenderName: 'testRecommender'
}

export const mockCategory = {
    id: 'mens-accessories-ties',
    image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwd2ff3ec8/images/slot/sub_banners/cat-banner-mens-ties.jpg',
    name: 'Ties',
    pageDescription:
        "Shop Mens's Ties for all occasions including business or casual at Commerce Cloud",
    pageTitle: "Men's Casual and Business Ties",
    parentCategoryId: 'mens-accessories',
    parentCategoryTree: [
        {
            id: 'mens',
            name: 'Mens'
        },
        {
            id: 'mens-accessories',
            name: 'Accessories'
        },
        {
            id: 'mens-accessories-ties',
            name: 'Ties'
        }
    ],
    c_enableCompare: false,
    c_showInMenu: true
}

export const mockSearchResults = {
    limit: 4,
    hits: [
        {
            currency: 'GBP',
            hitType: 'master',
            image: {
                alt: 'Striped Silk Tie, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
                title: 'Striped Silk Tie, '
            },
            orderable: true,
            price: 19.19,
            productId: '25752986M',
            productName: 'Striped Silk Tie',
            productType: {
                master: true
            },
            representedProduct: {
                id: '793775370033M'
            },
            representedProducts: [
                {
                    id: '793775370033M'
                },
                {
                    id: '793775362380M'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Red',
                            orderable: true,
                            value: 'REDSI'
                        },
                        {
                            name: 'Turquoise',
                            orderable: true,
                            value: 'TURQUSI'
                        }
                    ]
                }
            ]
        },
        {
            currency: 'GBP',
            hitType: 'master',
            image: {
                alt: 'Checked Silk Tie, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe64d25bd/images/large/PG.949612424S.COBATSI.PZ.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe64d25bd/images/large/PG.949612424S.COBATSI.PZ.jpg',
                title: 'Checked Silk Tie, '
            },
            orderable: true,
            price: 19.19,
            productId: '25752235M',
            productName: 'Checked Silk Tie',
            productType: {
                master: true
            },
            representedProduct: {
                id: '682875090845M'
            },
            representedProducts: [
                {
                    id: '682875090845M'
                },
                {
                    id: '682875719029M'
                },
                {
                    id: '682875540326M'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Cobalt',
                            orderable: true,
                            value: 'COBATSI'
                        },
                        {
                            name: 'Navy',
                            orderable: true,
                            value: 'NAVYSI'
                        },
                        {
                            name: 'Yellow',
                            orderable: true,
                            value: 'YELLOSI'
                        }
                    ]
                }
            ]
        },
        {
            currency: 'GBP',
            hitType: 'master',
            image: {
                alt: 'Solid Silk Tie, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c618527/images/large/PG.949432114S.NAVYSI.PZ.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c618527/images/large/PG.949432114S.NAVYSI.PZ.jpg',
                title: 'Solid Silk Tie, '
            },
            orderable: true,
            price: 19.19,
            productId: '25752218M',
            productName: 'Solid Silk Tie',
            productType: {
                master: true
            },
            representedProduct: {
                id: '029407331289M'
            },
            representedProducts: [
                {
                    id: '029407331289M'
                },
                {
                    id: '029407331227M'
                },
                {
                    id: '029407331258M'
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
                            value: 'NAVYSI'
                        },
                        {
                            name: 'Red',
                            orderable: true,
                            value: 'REDSI'
                        },
                        {
                            name: 'Yellow',
                            orderable: true,
                            value: 'YELLOSI'
                        }
                    ]
                }
            ]
        },
        {
            currency: 'GBP',
            hitType: 'master',
            image: {
                alt: 'Striped Silk Tie, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4982cf11/images/large/PG.949034314S.TAUPESI.PZ.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4982cf11/images/large/PG.949034314S.TAUPESI.PZ.jpg',
                title: 'Striped Silk Tie, '
            },
            orderable: true,
            price: 19.19,
            productId: '25752981M',
            productName: 'Striped Silk Tie',
            productType: {
                master: true
            },
            representedProduct: {
                id: '793775064963M'
            },
            representedProducts: [
                {
                    id: '793775064963M'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Colour',
                    values: [
                        {
                            name: 'Taupe',
                            orderable: true,
                            value: 'TAUPESI'
                        }
                    ]
                }
            ]
        }
    ],
    query: '',
    refinements: [
        {
            attributeId: 'cgid',
            label: 'Category',
            values: [
                {
                    hitCount: 4,
                    label: 'New Arrivals',
                    value: 'newarrivals'
                },
                {
                    hitCount: 4,
                    label: 'Mens',
                    value: 'mens',
                    values: [
                        {
                            hitCount: 4,
                            label: 'Accessories',
                            value: 'mens-accessories',
                            values: [
                                {
                                    hitCount: 4,
                                    label: 'Ties',
                                    value: 'mens-accessories-ties'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            attributeId: 'c_refinementColor',
            label: 'Colour',
            values: [
                {
                    hitCount: 0,
                    label: 'Beige',
                    presentationId: 'beige',
                    value: 'Beige'
                },
                {
                    hitCount: 0,
                    label: 'Black',
                    presentationId: 'black',
                    value: 'Black'
                },
                {
                    hitCount: 1,
                    label: 'Blue',
                    presentationId: 'blue',
                    value: 'Blue'
                },
                {
                    hitCount: 2,
                    label: 'Navy',
                    presentationId: 'navy',
                    value: 'Navy'
                },
                {
                    hitCount: 1,
                    label: 'Brown',
                    presentationId: 'brown',
                    value: 'Brown'
                },
                {
                    hitCount: 1,
                    label: 'Green',
                    presentationId: 'green',
                    value: 'Green'
                },
                {
                    hitCount: 0,
                    label: 'Grey',
                    presentationId: 'grey',
                    value: 'Grey'
                },
                {
                    hitCount: 0,
                    label: 'Orange',
                    presentationId: 'orange',
                    value: 'Orange'
                },
                {
                    hitCount: 0,
                    label: 'Pink',
                    presentationId: 'pink',
                    value: 'Pink'
                },
                {
                    hitCount: 0,
                    label: 'Purple',
                    presentationId: 'purple',
                    value: 'Purple'
                },
                {
                    hitCount: 2,
                    label: 'Red',
                    presentationId: 'red',
                    value: 'Red'
                },
                {
                    hitCount: 0,
                    label: 'White',
                    presentationId: 'white',
                    value: 'White'
                },
                {
                    hitCount: 2,
                    label: 'Yellow',
                    presentationId: 'yellow',
                    value: 'Yellow'
                },
                {
                    hitCount: 0,
                    label: 'Miscellaneous',
                    presentationId: 'miscellaneous',
                    value: 'Miscellaneous'
                }
            ]
        },
        {
            attributeId: 'price',
            label: 'Price',
            values: [
                {
                    hitCount: 4,
                    label: '£0 - £19.99',
                    value: '(0..20)'
                }
            ]
        },
        {
            attributeId: 'c_isNew',
            label: 'New Arrival'
        }
    ],
    searchPhraseSuggestions: {},
    selectedRefinements: {
        cgid: 'mens-accessories-ties',
        htype: 'master'
    },
    sortingOptions: [
        {
            id: 'best-matches',
            label: 'Best Matches'
        },
        {
            id: 'price-low-to-high',
            label: 'Price Low To High'
        },
        {
            id: 'price-high-to-low',
            label: 'Price High to Low'
        },
        {
            id: 'product-name-ascending',
            label: 'Product Name A - Z'
        },
        {
            id: 'product-name-descending',
            label: 'Product Name Z - A'
        },
        {
            id: 'brand',
            label: 'Brand'
        },
        {
            id: 'most-popular',
            label: 'Most Popular'
        },
        {
            id: 'top-sellers',
            label: 'Top Sellers'
        }
    ],
    offset: 0,
    total: 4
}

export const mockBasket = {
    adjustedMerchandizeTotalTax: 1.5,
    adjustedShippingTotalTax: 0.3,
    agentBasket: false,
    basketId: 'f6bbeee30fb93c2f94213f60f8',
    channelType: 'storefront',
    creationDate: '2022-09-15T19:29:10.361Z',
    currency: 'USD',
    customerInfo: {
        customerId: 'bdlrFJmudIlHaRk0oYkbYYlKw3'
    },
    lastModified: '2022-09-15T19:31:04.677Z',
    merchandizeTotalTax: 1.5,
    notes: {},
    orderTotal: 37.78,
    productItems: [
        {
            adjustedTax: 1.5,
            basePrice: 29.99,
            bonusProductLineItem: false,
            gift: false,
            itemId: 'de63c61b3edeca38b2d9a67a67',
            itemText: 'Checked Silk Tie',
            price: 29.99,
            priceAfterItemDiscount: 29.99,
            priceAfterOrderDiscount: 29.99,
            productId: '682875719029M',
            productName: 'Checked Silk Tie',
            quantity: 1,
            shipmentId: 'me',
            tax: 1.5,
            taxBasis: 29.99,
            taxClassId: 'standard',
            taxRate: 0.05
        }
    ],
    productSubTotal: 29.99,
    productTotal: 29.99,
    shipments: [
        {
            adjustedMerchandizeTotalTax: 1.5,
            adjustedShippingTotalTax: 0.3,
            gift: false,
            merchandizeTotalTax: 1.5,
            productSubTotal: 29.99,
            productTotal: 29.99,
            shipmentId: 'me',
            shipmentTotal: 37.78,
            shippingMethod: {
                description: 'Order received within 7-10 business days',
                id: '001',
                name: 'Ground',
                price: 5.99,
                c_estimatedArrivalTime: '7-10 Business Days'
            },
            shippingStatus: 'not_shipped',
            shippingTotal: 5.99,
            shippingTotalTax: 0.3,
            taxTotal: 1.8
        }
    ],
    shippingItems: [
        {
            adjustedTax: 0.3,
            basePrice: 5.99,
            itemId: 'b931764832e5bd90a3c226552f',
            itemText: 'Shipping',
            price: 5.99,
            priceAfterItemDiscount: 5.99,
            shipmentId: 'me',
            tax: 0.3,
            taxBasis: 5.99,
            taxClassId: 'standard',
            taxRate: 0.05
        }
    ],
    shippingTotal: 5.99,
    shippingTotalTax: 0.3,
    taxation: 'net',
    taxTotal: 1.8
}

export const mockProduct = {
    currency: 'USD',
    id: '56736828M',
    imageGroups: [
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                }
            ],
            variationAttributes: [{id: 'color', values: [{value: 'CP1'}]}],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                }
            ],
            variationAttributes: [{id: 'color', values: [{value: 'CP1'}]}],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                }
            ],
            variationAttributes: [{id: 'color', values: [{value: 'CP1'}]}],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, , swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                }
            ],
            variationAttributes: [{id: 'color', values: [{value: 'CP1'}]}],
            viewType: 'swatch'
        }
    ],
    inventory: {
        ats: 997,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 997
    },
    longDescription:
        '<ul>\n<li>66% cotton, 30% polyester, 4% elastane</li>\n<li>straight-fit</li>\n<li>on seam front pockets</li>\n<li>button closure</li>\n<li>flap back pockets with button closure</li>\n<li>dry clean only</li>\n</ul>',
    master: {masterId: '56736828M', orderable: true, price: 155},
    minOrderQuantity: 1,
    name: 'Straight Fit Shorts With Button Closure',
    pageDescription:
        'These straight-fit shorts are eager to impress, wear it with the Kris HL sportcoat for a warmed up suit. Made in our cotton stretch with pinstripe pattern fabric.',
    pageTitle: "Men's Straight Fit Shorts With Button Closure",
    price: 155,
    primaryCategoryId: 'mens-clothing-shorts',
    recommendations: [
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '72516759M',
            recommendedItemLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/72516759M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '86736845M',
            recommendedItemLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/86736845M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '54736828M',
            recommendedItemLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/54736828M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '83536828M',
            recommendedItemLink:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/83536828M?all_images=true&currency=&locale=default&inventory_ids='
        }
    ],
    shortDescription:
        'These straight-fit shorts are eager to impress, wear it with the Kris HL sportcoat for a warmed up suit. Made in our cotton stretch with pinstripe pattern fabric.',
    stepQuantity: 1,
    type: {master: true},
    variants: [
        {
            orderable: true,
            price: 155,
            productId: '883360544038M',
            variationValues: {color: 'CP1', size: '31'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544052M',
            variationValues: {color: 'CP1', size: '33'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544083M',
            variationValues: {color: 'CP1', size: '38'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544069M',
            variationValues: {color: 'CP1', size: '34'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544014M',
            variationValues: {color: 'CP1', size: '29'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544045M',
            variationValues: {color: 'CP1', size: '32'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544021M',
            variationValues: {color: 'CP1', size: '30'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544007M',
            variationValues: {color: 'CP1', size: '28'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544090M',
            variationValues: {color: 'CP1', size: '40'}
        },
        {
            orderable: true,
            price: 155,
            productId: '883360544076M',
            variationValues: {color: 'CP1', size: '36'}
        }
    ],
    variationAttributes: [
        {id: 'color', name: 'Color', values: [{name: 'Gray', orderable: true, value: 'CP1'}]},
        {
            id: 'size',
            name: 'Size',
            values: [
                {name: '28', orderable: true, value: '28'},
                {name: '29', orderable: true, value: '29'},
                {name: '30', orderable: true, value: '30'},
                {name: '31', orderable: true, value: '31'},
                {name: '32', orderable: true, value: '32'},
                {name: '33', orderable: true, value: '33'},
                {name: '34', orderable: true, value: '34'},
                {name: '36', orderable: true, value: '36'},
                {name: '38', orderable: true, value: '38'},
                {name: '40', orderable: true, value: '40'}
            ]
        }
    ]
}
