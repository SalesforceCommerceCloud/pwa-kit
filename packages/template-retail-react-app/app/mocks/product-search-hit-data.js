/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const mockProductSearchItem = {
    currency: 'USD',
    image: {
        alt: 'Charcoal Single Pleat Wool Suit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4de8166b/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    },
    price: 299.99,
    productName: 'Charcoal Single Pleat Wool Suit'
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
            '1682 ballistic nylon and genuine leather inserts| Spacious main storage compartment for documents and binders|Removable, padded laptop sleeve with D-rings for carrying with shoulder strap|Change handle system and cantilever wheels|Zip pull in gunmetal with black rubber insert Leather “comfort” insert detailed handle|Internal storage pockets for CD-Rom and peripherals|Real leather inserts'
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
