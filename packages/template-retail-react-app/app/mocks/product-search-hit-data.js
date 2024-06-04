/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const mockProductSearchItem = {
    currency: 'USD',
    hitType: 'master',
    image: {
        alt: 'Charcoal Single Pleat Wool Suit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4de8166b/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    },
    imageGroups: [
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe4e0c49b/images/large/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe4e0c49b/images/large/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe4e0c49b/images/large/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe4e0c49b/images/large/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'CHARCWL'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23283a20/images/medium/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23283a20/images/medium/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc406b7a1/images/medium/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc406b7a1/images/medium/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23283a20/images/medium/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw23283a20/images/medium/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc406b7a1/images/medium/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc406b7a1/images/medium/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'CHARCWL'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a6e0e2a/images/small/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a6e0e2a/images/small/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb1d94d6/images/small/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb1d94d6/images/small/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, '
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a6e0e2a/images/small/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1a6e0e2a/images/small/PG.33698RUBN4Q.CHARCWL.PZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                },
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb1d94d6/images/small/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb1d94d6/images/small/PG.33698RUBN4Q.CHARCWL.BZ.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'CHARCWL'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Charcoal Single Pleat Wool Suit, Charcoal, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5cb61ec2/images/swatch/PG.33698RUBN4Q.CHARCWL.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5cb61ec2/images/swatch/PG.33698RUBN4Q.CHARCWL.CP.jpg',
                    title: 'Charcoal Single Pleat Wool Suit, Charcoal'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'CHARCWL'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw001dbd2d/images/large/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw001dbd2d/images/large/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw001dbd2d/images/large/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw001dbd2d/images/large/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'NAVYWL'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed78c6fc/images/medium/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed78c6fc/images/medium/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dweb695753/images/medium/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dweb695753/images/medium/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed78c6fc/images/medium/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed78c6fc/images/medium/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dweb695753/images/medium/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dweb695753/images/medium/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'NAVYWL'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ab8674a/images/small/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ab8674a/images/small/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa650119/images/small/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa650119/images/small/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, '
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ab8674a/images/small/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ab8674a/images/small/PG.52002RUBN4Q.NAVYWL.PZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                },
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa650119/images/small/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa650119/images/small/PG.52002RUBN4Q.NAVYWL.BZ.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'NAVYWL'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Navy Single Pleat Wool Suit, Navy, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7fabf1ff/images/swatch/PG.52002RUBN4Q.NAVYWL.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7fabf1ff/images/swatch/PG.52002RUBN4Q.NAVYWL.CP.jpg',
                    title: 'Navy Single Pleat Wool Suit, Navy'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'NAVYWL'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        }
    ],
    price: 299.99,
    productId: '25686571M',
    productName: 'Charcoal Single Pleat Wool Suit',
    productPromotions: [
        {
            calloutMsg: '25% off.',
            promotionId: 'PromotionTest'
        }
    ],
    representedProduct: {
        id: '750518894461M'
    },
    variants: [
        {
            price: 191.99,
            productId: '750518894461M',
            tieredPrices: [
                {
                    price: 320,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 191.99,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'CHARCWL',
                size: '040',
                width: 'V'
            }
        },
        {
            price: 191.99,
            productId: '750518548272M',
            productPromotions: [
                {
                    calloutMsg: '25% off.',
                    promotionalPrice: 143.99,
                    promotionId: 'PromotionTest'
                }
            ],
            tieredPrices: [
                {
                    price: 320,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 191.99,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'NAVYWL',
                size: '050',
                width: 'V'
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
                    value: 'NAVYWL'
                },
                {
                    name: 'Charcoal',
                    value: 'CHARCWL'
                }
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [
                {
                    name: '36',
                    value: '036'
                },
                {
                    name: '38',
                    value: '038'
                },
                {
                    name: '39',
                    value: '039'
                },
                {
                    name: '40',
                    value: '040'
                },
                {
                    name: '42',
                    value: '042'
                },
                {
                    name: '43',
                    value: '043'
                },
                {
                    name: '44',
                    value: '044'
                },
                {
                    name: '46',
                    value: '046'
                },
                {
                    name: '48',
                    value: '048'
                },
                {
                    name: '50',
                    value: '050'
                }
            ]
        },
        {
            id: 'width',
            name: 'Width',
            values: [
                {
                    name: 'Short',
                    value: 'S'
                },
                {
                    name: 'Regular',
                    value: 'V'
                },
                {
                    name: 'Long',
                    value: 'L'
                }
            ]
        }
    ]
}
const mockProductSetHit = {
    currency: 'GBP',
    hitType: 'set',
    image: {
        alt: 'Winter Look, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1c4cd52/images/large/PG.10205921.JJ5FUXX.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1c4cd52/images/large/PG.10205921.JJ5FUXX.PZ.jpg',
        title: 'Winter Look, '
    },
    orderable: true,
    price: 40.16,
    priceMax: 71.03,
    pricePerUnit: 44.16,
    pricePerUnitMax: 71.03,
    priceRanges: [
        {
            maxPrice: 101.76,
            minPrice: 44.16,
            pricebook: 'gbp-m-list-prices'
        },
        {
            maxPrice: 71.03,
            minPrice: 40.16,
            pricebook: 'gbp-m-sale-prices'
        }
    ],
    productId: 'winter-lookM',
    productName: 'Winter Look',
    productType: {
        set: true
    },
    representedProduct: {
        id: '740357357531M',
        c_color: 'BLACKLE',
        c_refinementColor: 'black',
        c_size: '065',
        c_width: 'M'
    }
}
const mockStandardProductHit = {
    currency: 'GBP',
    hitType: 'product',
    image: {
        alt: 'Laptop Briefcase with wheels (37L), , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7cb2d401/images/large/P0048_001.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7cb2d401/images/large/P0048_001.jpg',
        title: 'Laptop Briefcase with wheels (37L), '
    },
    orderable: true,
    price: 63.99,
    pricePerUnit: 63.99,
    productId: 'P0048M',
    productName: 'Laptop Briefcase with wheels (37L)',
    productType: {
        item: true
    },
    representedProduct: {
        id: 'P0048M',
        c_styleNumber: 'P0048',
        c_tabDescription:
            'Perfect for business travel, this briefcase is ultra practical with plenty of space for your laptop and all its extras, as well as storage for documents, paperwork and all your essential items. The wheeled system allows you to travel comfortably with your work and when you reach your destination, you can remove the laptop compartment and carry over your shoulder to meetings. It’s the business.',
        c_tabDetails:
            '1682 ballistic nylon and genuine leather inserts| Spacious main storage compartment for documents and binders|Removable, padded laptop sleeve with D-rings for carrying with shoulder strap|Change handle system and cantilever wheels|Zip pull in gunmetal with black rubber insert Leather “comfort” insert detailed handle|Internal storage pockets for CD-Rom and peripherals|Real leather inserts',
        c_isNew: true,
        c_isSale: true,
        c_isSpecial: true,
        c_isCloseout: false
    },
    representedProducts: [
        {
            id: 'P0048M'
        }
    ],
    tieredPrices: [
        {
            price: 67.99,
            pricebook: 'gbp-m-list-prices',
            quantity: 1
        }
    ]
}
const mockMasterProductHitWithOneVariant = {
    currency: 'GBP',
    hitType: 'master',
    image: {
        alt: 'Black Flat Front Wool Suit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3d8972fe/images/large/PG.52001DAN84Q.BLACKWL.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3d8972fe/images/large/PG.52001DAN84Q.BLACKWL.PZ.jpg',
        title: 'Black Flat Front Wool Suit, '
    },
    orderable: true,
    price: 191.99,
    pricePerUnit: 191.99,
    priceRanges: [
        {
            maxPrice: 320,
            minPrice: 320,
            pricebook: 'gbp-m-list-prices'
        },
        {
            maxPrice: 191.99,
            minPrice: 191.99,
            pricebook: 'gbp-m-sale-prices'
        }
    ],
    productId: '25686544M',
    productName: 'Black Flat Front Wool Suit',
    productType: {
        master: true
    },
    representedProduct: {
        id: '750518703077M',
        c_color: 'BLACKWL',
        c_refinementColor: 'black',
        c_size: '048',
        c_width: 'V'
    },
    representedProducts: [
        {
            id: '750518703077M'
        },
        {
            id: '750518703060M'
        },
        {
            id: '750518703039M'
        },
        {
            id: '750518703046M'
        }
    ],
    variants: [
        {
            orderable: true,
            price: 191.99,
            productId: '750518703077M',
            tieredPrices: [
                {
                    price: 320,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 191.99,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'BLACKWL',
                size: '048',
                width: 'V'
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
                    value: 'BLACKWL'
                }
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [
                {
                    name: '42',
                    orderable: true,
                    value: '042'
                },
                {
                    name: '43',
                    orderable: true,
                    value: '043'
                },
                {
                    name: '46',
                    orderable: true,
                    value: '046'
                },
                {
                    name: '48',
                    orderable: true,
                    value: '048'
                }
            ]
        },
        {
            id: 'width',
            name: 'Width',
            values: [
                {
                    name: 'Regular',
                    orderable: true,
                    value: 'V'
                }
            ]
        }
    ]
}
const mockMasterProductHitWithMultipleVariants = {
    currency: 'GBP',
    hitType: 'master',
    image: {
        alt: 'Long Sleeve Embellished Boat Neck Top, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
        title: 'Long Sleeve Embellished Boat Neck Top, '
    },
    imageGroups: [
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb2647cff/images/large/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb2647cff/images/large/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb2647cff/images/large/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb2647cff/images/large/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
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
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3255ea4c/images/large/PG.10217069.JJ908XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3255ea4c/images/large/PG.10217069.JJ908XX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, large',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw92f1b900/images/large/PG.10217069.JJ908XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw92f1b900/images/large/PG.10217069.JJ908XX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ908XX'
                        }
                    ]
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed56b2da/images/medium/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed56b2da/images/medium/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwead6d554/images/medium/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwead6d554/images/medium/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed56b2da/images/medium/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed56b2da/images/medium/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwead6d554/images/medium/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwead6d554/images/medium/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
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
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc9ce7da9/images/medium/PG.10217069.JJ908XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc9ce7da9/images/medium/PG.10217069.JJ908XX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, medium',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6b734040/images/medium/PG.10217069.JJ908XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6b734040/images/medium/PG.10217069.JJ908XX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ908XX'
                        }
                    ]
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd4b35477/images/small/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd4b35477/images/small/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, , small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc6e78825/images/small/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc6e78825/images/small/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, '
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd4b35477/images/small/PG.10217069.JJ5QZXX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd4b35477/images/small/PG.10217069.JJ5QZXX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc6e78825/images/small/PG.10217069.JJ5QZXX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc6e78825/images/small/PG.10217069.JJ5QZXX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
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
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1d27b20/images/small/PG.10217069.JJ908XX.PZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe1d27b20/images/small/PG.10217069.JJ908XX.PZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                },
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, small',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe6f3f097/images/small/PG.10217069.JJ908XX.BZ.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe6f3f097/images/small/PG.10217069.JJ908XX.BZ.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ908XX'
                        }
                    ]
                }
            ],
            viewType: 'small'
        },
        {
            images: [
                {
                    alt: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b23d065/images/swatch/PG.10217069.JJ5QZXX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b23d065/images/swatch/PG.10217069.JJ5QZXX.CP.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Begonia Pink'
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
                    alt: 'Long Sleeve Embellished Boat Neck Top, Grey Heather, swatch',
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw747c5f3e/images/swatch/PG.10217069.JJ908XX.CP.jpg',
                    link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw747c5f3e/images/swatch/PG.10217069.JJ908XX.CP.jpg',
                    title: 'Long Sleeve Embellished Boat Neck Top, Grey Heather'
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ908XX'
                        }
                    ]
                }
            ],
            viewType: 'swatch'
        }
    ],
    orderable: true,
    price: 18.55,
    pricePerUnit: 18.55,
    priceRanges: [
        {
            maxPrice: 31.36,
            minPrice: 31.36,
            pricebook: 'gbp-m-list-prices'
        },
        {
            maxPrice: 18.55,
            minPrice: 18.55,
            pricebook: 'gbp-m-sale-prices'
        }
    ],
    productId: '25518101M',
    productName: 'Long Sleeve Embellished Boat Neck Top',
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
    productType: {
        master: true
    },
    representedProduct: {
        id: '701642823919M'
    },
    representedProducts: [
        {
            id: '701642823919M'
        },
        {
            id: '701642823872M'
        },
        {
            id: '701642823926M'
        },
        {
            id: '701642823940M'
        },
        {
            id: '701642823902M'
        },
        {
            id: '701642823933M'
        },
        {
            id: '701642823889M'
        },
        {
            id: '701642823896M'
        }
    ],
    variants: [
        {
            orderable: true,
            price: 18.55,
            productId: '701642823919M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ908XX',
                size: '9LG'
            }
        },
        {
            orderable: true,
            price: 18.55,
            productId: '701642823872M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
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
            price: 18.55,
            productId: '701642823926M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ908XX',
                size: '9MD'
            }
        },
        {
            orderable: true,
            price: 18.55,
            productId: '701642823940M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ908XX',
                size: '9XL'
            }
        },
        {
            orderable: true,
            price: 18.55,
            productId: '701642823902M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
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
            price: 18.55,
            productId: '701642823933M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ908XX',
                size: '9SM'
            }
        },
        {
            orderable: true,
            price: 18.55,
            productId: '701642823889M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
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
            price: 18.55,
            productId: '701642823896M',
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
            tieredPrices: [
                {
                    price: 31.36,
                    pricebook: 'gbp-m-list-prices',
                    quantity: 1
                },
                {
                    price: 18.55,
                    pricebook: 'gbp-m-sale-prices',
                    quantity: 1
                }
            ],
            variationValues: {
                color: 'JJ5QZXX',
                size: '9SM'
            }
        }
    ],
    variationAttributes: [
        {
            id: 'color',
            name: 'Colour',
            values: [
                {
                    name: 'Begonia Pink',
                    orderable: true,
                    value: 'JJ5QZXX'
                },
                {
                    name: 'Grey Heather',
                    orderable: true,
                    value: 'JJ908XX'
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
    ]
}
export {
    mockProductSetHit,
    mockStandardProductHit,
    mockMasterProductHitWithOneVariant,
    mockProductSearchItem,
    mockMasterProductHitWithMultipleVariants
}
