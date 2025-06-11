/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const mockStandardProductOrderable = {
    currency: 'GBP',
    id: 'a-standard-dress',
    imageGroups: [
        {
            images: [
                {
                    alt: 'White and Black Tone, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9178fd89/images/large/PG.W20766.IVORYXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9178fd89/images/large/PG.W20766.IVORYXX.PZ.jpg',
                    title: 'White and Black Tone, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'White and Black Tone, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9af8c50e/images/medium/PG.W20766.IVORYXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9af8c50e/images/medium/PG.W20766.IVORYXX.PZ.jpg',
                    title: 'White and Black Tone, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'White and Black Tone, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw58be3274/images/small/PG.W20766.IVORYXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw58be3274/images/small/PG.W20766.IVORYXX.PZ.jpg',
                    title: 'White and Black Tone, '
                }
            ],
            viewType: 'small'
        }
    ],
    inventory: {
        ats: 999999,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 999999
    },
    longDescription: 'A Standard Dress',
    minOrderQuantity: 1,
    name: 'White and Black Tone',
    pageMetaTags: [
        {
            id: 'description',
            value: 'Buy White and Black Tone at RefArchGlobal.'
        },
        {
            id: 'robots',
            value: 'index, follow'
        },
        {
            id: 'og:url',
            value: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.store/s/RefArchGlobal/dw/shop/v99_9/products/a-standard-dress?currency=GBP&locale=en-GB&expand=availability,promotions,options,images,prices,variations,set_products,bundled_products,page_meta_tags&all_images=true'
        },
        {
            id: 'title',
            value: 'Buy White and Black Tone for GBP 4.00 | RefArchGlobal'
        }
    ],
    price: 4,
    pricePerUnit: 4,
    primaryCategoryId: 'womens-outfits',
    shortDescription: 'A Standard Dress',
    slugUrl:
        'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/en_GB/product/a-standard-dress/a-standard-dress.html',
    stepQuantity: 1,
    type: {
        item: true
    },
    tieredPrices: [
        {
            price: 70,
            pricebook: 'gbp-m-list-prices',
            quantity: 1
        },
        {
            price: 4,
            pricebook: 'gbp-m-sale-prices',
            quantity: 1
        }
    ]
}

export const mockStandardProductNotOrderable = {
    ...mockStandardProductOrderable,
    id: 'a-standard-dress-not-orderable',
    inventory: {
        ats: 0,
        backorderable: false,
        id: 'inventory_m',
        orderable: false,
        preorderable: false,
        stockLevel: 0
    }
}
