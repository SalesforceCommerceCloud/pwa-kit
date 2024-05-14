/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductTile, {Skeleton} from '@salesforce/retail-react-app/app/components/product-tile/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {fireEvent, waitFor} from '@testing-library/react'

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

const mockProductSet = {
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
    price: 44.16,
    priceMax: 71.03,
    pricePerUnit: 44.16,
    pricePerUnitMax: 71.03,
    productId: 'winter-lookM',
    productName: 'Winter Look',
    productType: {
        set: true
    },
    representedProduct: {
        id: '701642853695M'
    },
    representedProducts: [
        {id: '701642853695M'},
        {id: '701642853718M'},
        {id: '701642853725M'},
        {id: '701642853701M'},
        {id: '740357357531M'},
        {id: '740357358095M'},
        {id: '740357357623M'},
        {id: '740357357609M'},
        {id: '740357358156M'},
        {id: '740357358132M'},
        {id: '740357358101M'},
        {id: '740357357562M'},
        {id: '740357357548M'},
        {id: '740357358187M'},
        {id: '740357357593M'},
        {id: '740357357555M'},
        {id: '740357357524M'},
        {id: '740357358149M'},
        {id: '740357358088M'},
        {id: '701642867098M'},
        {id: '701642867111M'},
        {id: '701642867104M'},
        {id: '701642867128M'},
        {id: '701642867135M'}
    ]
}

test('Renders links and images', () => {
    const {getAllByRole} = renderWithProviders(<ProductTile product={mockProductSearchItem} />)

    const link = getAllByRole('link')
    const img = getAllByRole('img')

    expect(link).toBeDefined()
    expect(img).toBeDefined()
})

test('Renders Skeleton', () => {
    const {getAllByTestId} = renderWithProviders(<Skeleton />)

    const skeleton = getAllByTestId('sf-product-tile-skeleton')

    expect(skeleton).toBeDefined()
})

test('Product set - renders the appropriate price label', async () => {
    const {getByTestId} = renderWithProviders(<ProductTile product={mockProductSet} />)

    const container = getByTestId('product-tile-price')
    expect(container).toHaveTextContent(/starting at/i)
})

test('Remove from wishlist cannot be muti-clicked', () => {
    const onClick = jest.fn()

    const {getByTestId} = renderWithProviders(
        <ProductTile product={mockProductSet} enableFavourite={true} onFavouriteToggle={onClick} />
    )
    const wishlistButton = getByTestId('wishlist-button')

    fireEvent.click(wishlistButton)
    fireEvent.click(wishlistButton)
    expect(onClick).toHaveBeenCalledTimes(1)
})

test('Renders variation selection swatches', () => {
    const {getAllByRole, getByTestId} = renderWithProviders(
        <ProductTile product={mockProductSearchItem} />
    )
    const swatches = getAllByRole('radio')
    const productImage = getByTestId('product-tile-image')

    // Initial render will show swatched and the image will be the represented product variation
    expect(swatches).toHaveLength(2)
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    )

    // Hovering over color swatch changes the image.
    fireEvent.mouseEnter(swatches[1])
    waitFor(() => {
        expect(productImage.firstChild.getAttribute('src')).toBe(
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg'
        )
    })
})
