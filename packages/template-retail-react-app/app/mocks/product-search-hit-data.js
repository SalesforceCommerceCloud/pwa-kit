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
    productName: 'Charcoal Single Pleat Wool Suit',
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
        alt: 'Black Single Pleat Athletic Fit Wool Suit - Edit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d64302b/images/large/PG.52001RUBN4Q.BLACKFB.PZ.jpg',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d64302b/images/large/PG.52001RUBN4Q.BLACKFB.PZ.jpg',
        title: 'Black Single Pleat Athletic Fit Wool Suit - Edit, '
    },
    orderable: true,
    price: 191.99,
    pricePerUnit: 191.99,
    priceRanges: [
        {
            maxPrice: 320,
            minPrice: 191.99,
            pricebook: 'gbp-m-list-prices'
        },
        {
            maxPrice: 191.99,
            minPrice: 191.99,
            pricebook: 'gbp-m-sale-prices'
        }
    ],
    productId: '25604524M',
    productName: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
    productType: {
        master: true
    },
    representedProduct: {
        id: '750518699660M'
    },
    variants: [
        {
            orderable: true,
            price: 191.99,
            productId: '750518699660M',
            tieredPrices: [
                {
                    price: 223.99,
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
                color: 'BLACKFB',
                size: '050',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699585M',
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
                color: 'BLACKFB',
                size: '039',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699653M',
            tieredPrices: [
                {
                    price: 191.99,
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
                color: 'BLACKFB',
                size: '048',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699615M',
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
                color: 'BLACKFB',
                size: '042',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699608M',
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
                color: 'BLACKFB',
                size: '041',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699646M',
            tieredPrices: [
                {
                    price: 191.99,
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
                color: 'BLACKFB',
                size: '046',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699592M',
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
                color: 'BLACKFB',
                size: '040',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699622M',
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
                color: 'BLACKFB',
                size: '043',
                width: 'V'
            }
        },
        {
            orderable: false,
            price: 191.99,
            productId: '750518699578M',
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
                color: 'BLACKFB',
                size: '038',
                width: 'V'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699875M',
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
                color: 'BLACKFB',
                size: '046',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699868M',
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
                color: 'BLACKFB',
                size: '044',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699820M',
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
                color: 'BLACKFB',
                size: '040',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699882M',
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
                color: 'BLACKFB',
                size: '048',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699851M',
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
                color: 'BLACKFB',
                size: '043',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699844M',
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
                color: 'BLACKFB',
                size: '042',
                width: 'L'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699769M',
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
                color: 'BLACKFB',
                size: '044',
                width: 'S'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699721M',
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
                color: 'BLACKFB',
                size: '040',
                width: 'S'
            }
        },
        {
            orderable: true,
            price: 191.99,
            productId: '750518699745M',
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
                color: 'BLACKFB',
                size: '042',
                width: 'S'
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
                    value: 'BLACKFB'
                }
            ]
        },
        {
            id: 'size',
            name: 'Size',
            values: [
                {
                    name: '38',
                    orderable: false,
                    value: '038'
                },
                {
                    name: '39',
                    orderable: true,
                    value: '039'
                },
                {
                    name: '40',
                    orderable: true,
                    value: '040'
                },
                {
                    name: '41',
                    orderable: true,
                    value: '041'
                },
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
                    name: '44',
                    orderable: true,
                    value: '044'
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
                },
                {
                    name: '50',
                    orderable: true,
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
                    orderable: true,
                    value: 'S'
                },
                {
                    name: 'Regular',
                    orderable: true,
                    value: 'V'
                },
                {
                    name: 'Long',
                    orderable: true,
                    value: 'L'
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
