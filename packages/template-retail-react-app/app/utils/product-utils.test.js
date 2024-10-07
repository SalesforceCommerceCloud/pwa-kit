/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getPriceData,
    findLowestPrice,
    getDecoratedVariationAttributes,
    getDisplayVariationValues,
    filterImageGroups,
    normalizeSetBundleProduct,
    getUpdateBundleChildArray
} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    mockMasterProductHitWithMultipleVariants,
    mockMasterProductHitWithOneVariant,
    mockProductSetHit,
    mockStandardProductHit
} from '@salesforce/retail-react-app/app/mocks/product-search-hit-data'
import {
    productSearch,
    getProduct
} from '@salesforce/retail-react-app/app/components/product-tile/promo-callout.mock'
import productSetWinterLookM from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
import {mockProductSearch} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {
    mockProductBundle,
    mockBundledProductItemsVariant
} from '@salesforce/retail-react-app/app/mocks/product-bundle.js'

const imageGroups = [
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
]
const product = {
    currency: 'GBP',
    hitType: 'master',
    image: {
        alt: 'Striped Silk Tie, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e365a5e/images/large/PG.949114314S.REDSI.PZ.jpg',
        title: 'Striped Silk Tie, '
    },
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
    productId: '25752986M',
    productName: 'Striped Silk Tie',
    productPromotions: [
        {
            calloutMsg: 'Get 20% off of this tie.',
            promotionId: 'PromotionTest_WithoutQualifying'
        }
    ],
    productType: {
        master: true
    },
    representedProduct: {
        id: '793775370033M'
    },
    variants: [
        {
            price: 19.19,
            productId: '793775370033M',
            productPromotions: [
                {
                    calloutMsg: 'Get 20% off of this tie.',
                    promotionalPrice: 15.35,
                    promotionId: 'PromotionTest_WithoutQualifying'
                }
            ],
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
                    value: 'REDSI'
                },
                {
                    name: 'Turquoise',
                    value: 'TURQUSI'
                }
            ]
        }
    ]
}

describe('filterImageGroups', function () {
    test('throws when "filters" argument is not provided', () => {
        expect(() => {
            filterImageGroups(imageGroups)
        }).toThrow()
    })

    test('returns all image groups when "filters" object constains no filters', () => {
        const filteredImageGroups = filterImageGroups(imageGroups, {})

        expect(filteredImageGroups).toHaveLength(11)
    })

    test('returns an empty array when no image groups apply to provided filters', () => {
        const filteredImageGroups = filterImageGroups(imageGroups, {
            viewType: 'nonexistentViewType'
        })

        expect(filteredImageGroups).toHaveLength(0)
    })

    test('returns non-zero length array with only images groups matching filters provided', () => {
        let filteredImageGroups

        // Return all image groups that are viewType = "swatch"
        filteredImageGroups = filterImageGroups(imageGroups, {viewType: 'swatch'})
        expect(filteredImageGroups).toHaveLength(2)
        expect(filteredImageGroups.every(({viewType}) => viewType === 'swatch')).toBe(true)

        // Return all image groups that apply to images with color = "TURQUSI"
        filteredImageGroups = filterImageGroups(imageGroups, {variationValues: {color: 'TURQUSI'}})
        expect(filteredImageGroups).toHaveLength(4) // We know there will be 4 because we control the test data!

        // Return all image groups that are viewType = "swatch" and color = "TURQUSI"
        filteredImageGroups = filterImageGroups(imageGroups, {
            viewType: 'swatch',
            variationValues: {color: 'TURQUSI'}
        })
        expect(filteredImageGroups).toHaveLength(1) // We know there will be 1 because we control the test data!
    })
})

describe('getDecoratedVariationAttributes', function () {
    test('returns variationAttributes array with "swatch" and "href" values', () => {
        const variationAttributes = getDecoratedVariationAttributes(product)

        // variationAttributes is defined and of known size.
        expect(variationAttributes).toBeDefined()
        expect(variationAttributes).toHaveLength(1)

        // all values in all attributes are decorated.
        variationAttributes.forEach((variationAttribute) => {
            variationAttribute.values.forEach((value) => {
                expect(value.href).toBeDefined()
                expect(value.swatch).toBeDefined()
            })
        })
    })
})

describe('getDisplayVariationValues', function () {
    const variationAttributes = [
        {
            id: 'color',
            name: 'Colour',
            values: [
                {name: 'Black', orderable: true, value: 'BLACKLE'},
                {name: 'Taupe', orderable: true, value: 'TAUPETX'}
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [
                {name: '6', orderable: true, value: '060'},
                {name: '6.5', orderable: true, value: '065'},
                {name: '7', orderable: true, value: '070'},
                {name: '7.5', orderable: true, value: '075'},
                {name: '8', orderable: true, value: '080'},
                {name: '8.5', orderable: true, value: '085'},
                {name: '9', orderable: true, value: '090'},
                {name: '9.5', orderable: true, value: '095'},
                {name: '10', orderable: true, value: '100'},
                {name: '11', orderable: true, value: '110'}
            ]
        },
        {id: 'width', name: 'Width', values: [{name: 'M', orderable: true, value: 'M'}]}
    ]

    test('returned selected values', () => {
        const selectedValues = {
            color: 'TAUPETX',
            size: '065',
            width: 'M'
        }
        const result = getDisplayVariationValues(variationAttributes, selectedValues)

        expect(result).toEqual({
            Colour: 'Taupe',
            Size: '6.5',
            Width: 'M'
        })
    })
})

describe('getPriceData', function () {
    test('returns price data for master product that has more than one variant', () => {
        const priceData = getPriceData(mockMasterProductHitWithMultipleVariants)
        expect(priceData).toEqual({
            currentPrice: 18.55,
            listPrice: 31.36,
            pricePerUnit: 18.55,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: true,
            tieredPrice: 31.36,
            maxPrice: 31.36
        })
    })

    test('returns price data for master product that has ONLY one variant', () => {
        const priceData = getPriceData(mockMasterProductHitWithOneVariant)

        expect(priceData).toEqual({
            currentPrice: 191.99,
            listPrice: 320,
            pricePerUnit: 191.99,
            isOnSale: true,
            isASet: false,
            isMaster: true,
            isRange: false,
            maxPrice: 320,
            tieredPrice: 320
        })
    })

    test('returns correct priceData for product set', () => {
        const priceData = getPriceData(mockProductSetHit)
        expect(priceData).toEqual({
            currentPrice: 40.16,
            listPrice: undefined,
            pricePerUnit: 44.16,
            isOnSale: false,
            isASet: true,
            isMaster: false,
            isRange: true,
            tieredPrice: undefined,
            maxPrice: 71.03
        })
    })

    test('returns correct priceData for standard product', () => {
        const priceData = getPriceData(mockStandardProductHit)
        expect(priceData).toEqual({
            currentPrice: 63.99,
            listPrice: 67.99,
            pricePerUnit: 63.99,
            isOnSale: true,
            isASet: false,
            isMaster: false,
            isRange: false,
            maxPrice: 67.99,
            tieredPrice: 67.99
        })
    })
})

describe('findLowestPrice', function () {
    test('without passing in a product', () => {
        const result = findLowestPrice()
        expect(result).toBeUndefined()
    })

    test('lowest price is a promotional price', () => {
        const result = findLowestPrice(productSearch.rollSleeveBlouse)
        expect(result.promotion).toBeDefined()
    })
    test('lowest price is NOT a promotional price', () => {
        const result = findLowestPrice(productSearch.sleevelessBlouse)
        expect(result.promotion).toBeNull()
    })
    test('returned `data` is either a single variant or a product', () => {
        const result = findLowestPrice(productSearch.rollSleeveBlouse)
        expect(Array.isArray(result.data)).toBe(false)
    })
    test('master product that does not have variants', () => {
        // It's possible that the API data for this master product to not have variants.
        // The API request needs to include allVariationProperties=true
        const product = {...mockProductSearch.hits[0]}
        delete product.variants
        const result = findLowestPrice(product)
        expect(result.minPrice).toBe(product.price)
        expect(result.data).toBe(product)
    })
    // NOTE: we won't test the returned `minPrice`, since the price is already covered indirectly via testing of getPriceData
})

describe('findLowestPrice - confirm API inconsistency', () => {
    test('getProduct call for a master type', () => {
        const result = findLowestPrice(getProduct.rollSleeveBlouseMaster)
        expect(result.minPrice).toBe(44.16) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include productPromotions in the variants.
        // Once fixed, the API is supposed to return 34.16, which is a promotional price.
    })
    test('getProduct call for a variant type', () => {
        const result = findLowestPrice(getProduct.rollSleeveBlouseVariant)
        expect(result.minPrice).toBe(34.16)
        expect(result.promotion).toBeDefined()
    })

    test('standard product with getProduct call', () => {
        const result = findLowestPrice(getProduct.uprightCase)
        expect(result.minPrice).toBe(43.99)
        expect(result.promotion).toBeDefined()
    })
    test('standard product with productSearch call', () => {
        const result = findLowestPrice(productSearch.uprightCase)
        expect(result.minPrice).toBe(63.99) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include the promotional price.. only the callout message.
        // Once fixed, it's supposed to return the promo price of 43.99
    })

    test("product set's children do not have promotional price", () => {
        const childItem = productSetWinterLookM.setProducts[0]
        const result = findLowestPrice(childItem)
        expect(result.minPrice).toBe(71.03) // unexpected
        expect(result.promotion).toBeNull()
        // The API response does not include the promotional price.. only the callout message.
        // Once fixed, it's supposed to return the promo price of 61.03
    })
})

describe('normalizeSetBundleProduct', () => {
    test('passing in regular product returns original product', () => {
        const mockProduct = {
            name: 'Striped Silk Tie',
            id: '25752986M',
            type: {master: true}
        }

        const normalizedProduct = normalizeSetBundleProduct(mockProduct)

        expect(normalizedProduct).toStrictEqual(mockProduct)
    })

    test('passing in product set normalizes data', () => {
        const normalizedProduct = normalizeSetBundleProduct(productSetWinterLookM)

        for (let i = 0; i < productSetWinterLookM.setProducts.length; i++) {
            expect(normalizedProduct.childProducts[i].quantity).toBeNull()
            expect(normalizedProduct.childProducts[i].product).toStrictEqual(
                productSetWinterLookM.setProducts[i]
            )
        }
    })

    test('passing in product bundle normalizes data', () => {
        const normalizedProduct = normalizeSetBundleProduct(mockProductBundle)
        expect(normalizedProduct.childProducts).toStrictEqual(mockProductBundle.bundledProducts)
    })
})

describe('getUpdateBundleChildArray', () => {
    const childProductSelections = mockProductBundle.bundledProducts.map(
        ({product: bundleProduct}, index) => ({
            product: {
                ...bundleProduct,
                id: mockBundledProductItemsVariant.bundledProductItems[index].productId
            },
            variant: bundleProduct.variants[0],
            quantity: bundleProduct.quantity
        })
    )

    const expectedResult = [
        {
            itemId: 'bff83e67f98e7743fdff6867b6',
            productId: '701644044220M',
            quantity: 1
        },
        {
            itemId: '789f9312984f9b178568348e92',
            productId: '701643473908M',
            quantity: 1
        },
        {
            itemId: '330cc506eeeef0946ceb2e4de1',
            productId: '701643458462M',
            quantity: 2
        }
    ]

    test('returns update product item array with selected variant', () => {
        const result = getUpdateBundleChildArray(
            mockBundledProductItemsVariant,
            childProductSelections
        )
        expect(result).toStrictEqual(expectedResult)
    })

    test('returns empty array if product IDs do not match', () => {
        const modifiedChildProductSelections = childProductSelections.map((childProduct) => ({
            ...childProduct,
            product: {
                ...childProduct.product,
                id: 'invalid-id'
            }
        }))
        const result = getUpdateBundleChildArray(
            mockBundledProductItemsVariant,
            modifiedChildProductSelections
        )
        expect(result).toEqual([])
    })
})
