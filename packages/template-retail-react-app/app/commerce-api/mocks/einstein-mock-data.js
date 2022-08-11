/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const mockRecommendationsResponse = {
    recommenderName: 'test-recommender',
    recoUUID: '05e0bd80-64eb-4149-ad5a-dfe1996f8f57',
    recs: [
        {
            id: 'prod_123',
            product_name: 'Product ABC',
            product_url: 'prod_abc.test.com',
            image_url: 'prod_abc.test.com'
        }
    ]
}

export const mockRecommendersResponse = {
    recommenders: [
        {
            name: 'recently-viewed-products',
            description: 'Recently viewed products.',
            recommenderType: 'recently-viewed'
        }
    ]
}

export const mockAddToCartProduct = {id: '883360544021M', sku: '', price: 155, quantity: 1}

export const mockRecommenderDetails = {
    __recoUUID: '883360544021M',
    recommenderName: 'testRecommender'
}

export const mockGetZoneRecommendationsResponse = {
    displayMessage: 'Recently Viewed',
    recoUUID: '05e0bd80-64eb-4149-ad5a-dfe1996f8f57',
    recs: [
        {
            id: 'prod_123',
            product_name: 'Product ABC',
            product_url: 'prod_abc.test.com',
            image_url: 'prod_abc.test.com'
        }
    ],
    recommenderName: 'recently-viewed-products'
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfb7ce066/images/large/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwee33fb7b/images/large/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a2fbc7b/images/large/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw308eba53/images/large/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwecea3cdd/images/large/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9bbe03cd/images/medium/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3a75400/images/medium/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed372d31/images/medium/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw32d43910/images/medium/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6aa00910/images/medium/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, '
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed10427e/images/small/B0574220_CP1_0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw999b0356/images/small/B0574220_CP1_B0.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3805c600/images/small/B0574220_CP1_L1.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a024d50/images/small/B0574220_CP1_L2.jpg',
                    title: 'Straight Fit Shorts With Button Closure, Gray'
                },
                {
                    alt: 'Straight Fit Shorts With Button Closure, Gray, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcafa0be3/images/small/B0574220_CP1_L3.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
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
                    link:
                        'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2168062/images/swatch/B0574220_CP1_sw.jpg',
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
                'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/72516759M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '86736845M',
            recommendedItemLink:
                'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/86736845M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '54736828M',
            recommendedItemLink:
                'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/54736828M?all_images=true&currency=&locale=default&inventory_ids='
        },
        {
            recommendationType: {displayValue: 'Product Detail Page - Cross Sell', value: 1},
            recommendedItemId: '83536828M',
            recommendedItemLink:
                'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_2/products/83536828M?all_images=true&currency=&locale=default&inventory_ids='
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
