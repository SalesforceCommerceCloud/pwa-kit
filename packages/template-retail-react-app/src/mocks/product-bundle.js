/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const childProducts = [
    {
        currency: 'USD',
        id: '25592770M',
        imageGroups: [
            {
                images: [
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1cbc65c5/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1cbc65c5/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, '
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb9b85318/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb9b85318/images/large/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1cbc65c5/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1cbc65c5/images/large/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb9b85318/images/large/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb9b85318/images/large/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc1996a2d/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc1996a2d/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, '
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, , medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwadb4ffd5/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwadb4ffd5/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc1996a2d/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc1996a2d/images/medium/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwadb4ffd5/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwadb4ffd5/images/medium/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc56c6ae1/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc56c6ae1/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, '
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, , small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51733bf1/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51733bf1/images/small/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc56c6ae1/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc56c6ae1/images/small/PG.10226236.JJGN9A0.PZ.jpg',
                        title: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi'
                    },
                    {
                        alt: 'Sleeveless Pleated Floral Front Blouse, Tulip Multi, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51733bf1/images/small/PG.10226236.JJGN9A0.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw51733bf1/images/small/PG.10226236.JJGN9A0.BZ.jpg',
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
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc5aa16b2/images/swatch/PG.10226236.JJGN9A0.CP.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc5aa16b2/images/swatch/PG.10226236.JJGN9A0.CP.jpg',
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
            ats: 700,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 700
        },
        longDescription:
            'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
        master: {
            masterId: '25592770M',
            orderable: true,
            price: 54.99
        },
        minOrderQuantity: 1,
        name: 'Sleeveless Pleated Floral Front Blouse',
        pageDescription:
            'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
        pageTitle: 'Sleeveless Pleated Floral Front Blouse',
        price: 54.99,
        pricePerUnit: 54.99,
        primaryCategoryId: 'womens-clothing-tops',
        productPromotions: [
            {
                calloutMsg: '$50 Fixed Products Amount Above 100',
                promotionId: '$50FixedProductsAmountAbove100'
            },
            {
                calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
            }
        ],
        recommendations: [
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25553402M'
            },
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25720050M'
            }
        ],
        shortDescription:
            'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
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
                price: 54.99,
                productId: '701644044220M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '004'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044183M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '010'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044244M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '008'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044190M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '012'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044237M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '006'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044206M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '014'
                }
            },
            {
                orderable: true,
                price: 54.99,
                productId: '701644044213M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '016'
                }
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                name: 'Color',
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
                        name: '6',
                        orderable: true,
                        value: '006'
                    },
                    {
                        name: '8',
                        orderable: true,
                        value: '008'
                    },
                    {
                        name: '10',
                        orderable: true,
                        value: '010'
                    },
                    {
                        name: '12',
                        orderable: true,
                        value: '012'
                    },
                    {
                        name: '14',
                        orderable: true,
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
        currency: 'USD',
        id: '25565139M',
        imageGroups: [
            {
                images: [
                    {
                        alt: 'Swing Tank, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd178a248/images/large/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd178a248/images/large/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, '
                    },
                    {
                        alt: 'Swing Tank, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwea48c68c/images/large/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwea48c68c/images/large/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, '
                    }
                ],
                viewType: 'large'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, Black, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd178a248/images/large/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd178a248/images/large/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, Black'
                    },
                    {
                        alt: 'Swing Tank, Black, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwea48c68c/images/large/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwea48c68c/images/large/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, Black'
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
                        alt: 'Swing Tank, dk meadown rose, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d0d790e/images/large/PG.10236970.JJ667A8.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d0d790e/images/large/PG.10236970.JJ667A8.PZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    },
                    {
                        alt: 'Swing Tank, dk meadown rose, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3c2b296/images/large/PG.10236970.JJ667A8.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd3c2b296/images/large/PG.10236970.JJ667A8.BZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ667A8'
                            }
                        ]
                    }
                ],
                viewType: 'large'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, , medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf590bcd6/images/medium/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf590bcd6/images/medium/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, '
                    },
                    {
                        alt: 'Swing Tank, , medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw91d8598a/images/medium/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw91d8598a/images/medium/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, '
                    }
                ],
                viewType: 'medium'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, Black, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf590bcd6/images/medium/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf590bcd6/images/medium/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, Black'
                    },
                    {
                        alt: 'Swing Tank, Black, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw91d8598a/images/medium/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw91d8598a/images/medium/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, Black'
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
                        alt: 'Swing Tank, dk meadown rose, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw167b34a3/images/medium/PG.10236970.JJ667A8.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw167b34a3/images/medium/PG.10236970.JJ667A8.PZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    },
                    {
                        alt: 'Swing Tank, dk meadown rose, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw965e835e/images/medium/PG.10236970.JJ667A8.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw965e835e/images/medium/PG.10236970.JJ667A8.BZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ667A8'
                            }
                        ]
                    }
                ],
                viewType: 'medium'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, , small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed0922ab/images/small/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed0922ab/images/small/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, '
                    },
                    {
                        alt: 'Swing Tank, , small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d7df088/images/small/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d7df088/images/small/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, '
                    }
                ],
                viewType: 'small'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, Black, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed0922ab/images/small/PG.10236970.JJ169XX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed0922ab/images/small/PG.10236970.JJ169XX.PZ.jpg',
                        title: 'Swing Tank, Black'
                    },
                    {
                        alt: 'Swing Tank, Black, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d7df088/images/small/PG.10236970.JJ169XX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw9d7df088/images/small/PG.10236970.JJ169XX.BZ.jpg',
                        title: 'Swing Tank, Black'
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
                        alt: 'Swing Tank, dk meadown rose, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw36135e1c/images/small/PG.10236970.JJ667A8.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw36135e1c/images/small/PG.10236970.JJ667A8.PZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    },
                    {
                        alt: 'Swing Tank, dk meadown rose, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa94eed5b/images/small/PG.10236970.JJ667A8.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa94eed5b/images/small/PG.10236970.JJ667A8.BZ.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ667A8'
                            }
                        ]
                    }
                ],
                viewType: 'small'
            },
            {
                images: [
                    {
                        alt: 'Swing Tank, Black, swatch',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a364253/images/swatch/PG.10236970.JJ169XX.CP.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4a364253/images/swatch/PG.10236970.JJ169XX.CP.jpg',
                        title: 'Swing Tank, Black'
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
                        alt: 'Swing Tank, dk meadown rose, swatch',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw81f3c9b7/images/swatch/PG.10236970.JJ667A8.CP.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw81f3c9b7/images/swatch/PG.10236970.JJ667A8.CP.jpg',
                        title: 'Swing Tank, dk meadown rose'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ667A8'
                            }
                        ]
                    }
                ],
                viewType: 'swatch'
            }
        ],
        inventory: {
            ats: 1000,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 1000
        },
        longDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        master: {
            masterId: '25565139M',
            orderable: true,
            price: 59
        },
        minOrderQuantity: 1,
        name: 'Swing Tank',
        pageDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        pageTitle: 'Swing Tank',
        price: 59,
        pricePerUnit: 59,
        primaryCategoryId: 'womens-clothing-tops',
        productPromotions: [
            {
                calloutMsg: '$50 Fixed Products Amount Above 100',
                promotionId: '$50FixedProductsAmountAbove100'
            },
            {
                calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
            }
        ],
        recommendations: [
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25565100M'
            },
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25565088M'
            }
        ],
        shortDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        stepQuantity: 1,
        type: {
            master: true
        },
        validFrom: {
            default: '2010-12-29T05:00:00.000Z'
        },
        variants: [
            {
                orderable: true,
                price: 59,
                productId: '701643473908M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473953M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473915M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473960M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473922M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9SM'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473946M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473991M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473939M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9XL'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473977M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9SM'
                }
            },
            {
                orderable: true,
                price: 59,
                productId: '701643473984M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9XL'
                }
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                name: 'Color',
                values: [
                    {
                        name: 'Black',
                        orderable: true,
                        value: 'JJ169XX'
                    },
                    {
                        name: 'dk meadown rose',
                        orderable: true,
                        value: 'JJ667A8'
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
    },
    {
        currency: 'USD',
        id: '25565094M',
        imageGroups: [
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw530987fb/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw530987fb/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    },
                    {
                        alt: 'Pull On Neutral Pant, , large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4b45a6f/images/large/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4b45a6f/images/large/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    }
                ],
                viewType: 'large'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw530987fb/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw530987fb/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    },
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, large',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4b45a6f/images/large/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa4b45a6f/images/large/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ0CZXX'
                            }
                        ]
                    }
                ],
                viewType: 'large'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, , medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw60b5d7d0/images/medium/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw60b5d7d0/images/medium/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    },
                    {
                        alt: 'Pull On Neutral Pant, , medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd9b3c2b/images/medium/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd9b3c2b/images/medium/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    }
                ],
                viewType: 'medium'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw60b5d7d0/images/medium/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw60b5d7d0/images/medium/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    },
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, medium',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd9b3c2b/images/medium/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfd9b3c2b/images/medium/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ0CZXX'
                            }
                        ]
                    }
                ],
                viewType: 'medium'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, , small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw293250ab/images/small/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw293250ab/images/small/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    },
                    {
                        alt: 'Pull On Neutral Pant, , small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98fb98ce/images/small/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98fb98ce/images/small/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, '
                    }
                ],
                viewType: 'small'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw293250ab/images/small/PG.10224484.JJ0CZXX.PZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw293250ab/images/small/PG.10224484.JJ0CZXX.PZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    },
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, small',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98fb98ce/images/small/PG.10224484.JJ0CZXX.BZ.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw98fb98ce/images/small/PG.10224484.JJ0CZXX.BZ.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ0CZXX'
                            }
                        ]
                    }
                ],
                viewType: 'small'
            },
            {
                images: [
                    {
                        alt: 'Pull On Neutral Pant, Black & Sugar, swatch',
                        disBaseLink:
                            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd850c71/images/swatch/PG.10224484.JJ0CZXX.CP.jpg',
                        link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcd850c71/images/swatch/PG.10224484.JJ0CZXX.CP.jpg',
                        title: 'Pull On Neutral Pant, Black & Sugar'
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [
                            {
                                value: 'JJ0CZXX'
                            }
                        ]
                    }
                ],
                viewType: 'swatch'
            }
        ],
        inventory: {
            ats: 500,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 500
        },
        longDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        master: {
            masterId: '25565094M',
            orderable: true,
            price: 69
        },
        minOrderQuantity: 1,
        name: 'Pull On Neutral Pant',
        pageDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        pageTitle: 'Pull On Neutral Pant',
        price: 69,
        pricePerUnit: 69,
        primaryCategoryId: 'womens-clothing-bottoms',
        recommendations: [
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25565139M'
            },
            {
                recommendationType: {
                    displayValue: 'Product Detail Page - Cross Sell',
                    value: 1
                },
                recommendedItemId: '25565082M'
            }
        ],
        shortDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        stepQuantity: 1,
        type: {
            master: true
        },
        validFrom: {
            default: '2010-12-29T05:00:00.000Z'
        },
        variants: [
            {
                orderable: true,
                price: 69,
                productId: '701643458462M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 69,
                productId: '701643458509M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 69,
                productId: '701643458479M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 69,
                productId: '701643458493M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9XL'
                }
            },
            {
                orderable: true,
                price: 69,
                productId: '701643458486M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9SM'
                }
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                name: 'Color',
                values: [
                    {
                        name: 'Black & Sugar',
                        orderable: true,
                        value: 'JJ0CZXX'
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
        ],
        c_isNewtest: true
    }
]

export const mockProductBundle = {
    bundledProducts: [
        {
            product: {...childProducts[0]},
            quantity: 1
        },
        {
            product: {...childProducts[1]},
            quantity: 1
        },
        {
            product: {...childProducts[2]},
            quantity: 2
        }
    ],
    currency: 'USD',
    id: 'test-bundle',
    imageGroups: [
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , large",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7371cdfc/images/large/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7371cdfc/images/large/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , medium",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw254de12a/images/medium/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw254de12a/images/medium/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , small",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4d788f3f/images/small/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4d788f3f/images/small/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'small'
        }
    ],
    inventory: {
        ats: 100,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 100
    },
    minOrderQuantity: 1,
    name: "Women's clothing test bundle",
    price: 113,
    pricePerUnit: 113,
    primaryCategoryId: 'womens-jewelry-earrings',
    slugUrl:
        'https://zzrf-014.dx.commercecloud.salesforce.com/s/RefArch/womens/jewelry/earrings/test-bundle.html?lang=en_US',
    stepQuantity: 1,
    type: {
        bundle: true
    },
    unitQuantity: 0,
    c_isNewtest: false,
    c_isSale: false
}

export const mockBundleItemsAdded = [
    {
        product: {...childProducts[2]},
        variant: {
            orderable: true,
            price: 69,
            productId: '701643458486M',
            variationValues: {
                color: 'JJ0CZXX',
                size: '9SM'
            }
        },
        quantity: 2
    },
    {
        product: {...childProducts[1]},
        variant: {
            orderable: true,
            price: 59,
            productId: '701643473922M',
            variationValues: {
                color: 'JJ169XX',
                size: '9SM'
            }
        },
        quantity: 1
    },
    {
        product: {...childProducts[0]},
        variant: {
            orderable: true,
            price: 54.99,
            productId: '701644044237M',
            variationValues: {
                color: 'JJGN9A0',
                size: '006'
            }
        },
        quantity: 1
    }
]

export const mockBundledProductItemsVariant = {
    adjustedTax: 11.3,
    basePrice: 113,
    bonusProductLineItem: false,
    bundledProductItems: [
        {
            adjustedTax: null,
            basePrice: null,
            bonusProductLineItem: false,
            gift: false,
            itemId: 'bff83e67f98e7743fdff6867b6',
            itemText: 'Sleeveless Pleated Floral Front Blouse',
            price: null,
            priceAfterItemDiscount: null,
            priceAfterOrderDiscount: 0,
            productId: '701644044213M',
            productName: 'Sleeveless Pleated Floral Front Blouse',
            quantity: 1,
            shipmentId: 'me',
            tax: null,
            taxBasis: null,
            taxClassId: null,
            taxRate: null
        },
        {
            adjustedTax: null,
            basePrice: null,
            bonusProductLineItem: false,
            gift: false,
            itemId: '789f9312984f9b178568348e92',
            itemText: 'Swing Tank',
            price: null,
            priceAfterItemDiscount: null,
            priceAfterOrderDiscount: 0,
            productId: '701643473939M',
            productName: 'Swing Tank',
            quantity: 1,
            shipmentId: 'me',
            tax: null,
            taxBasis: null,
            taxClassId: null,
            taxRate: null
        },
        {
            adjustedTax: null,
            basePrice: null,
            bonusProductLineItem: false,
            gift: false,
            itemId: '330cc506eeeef0946ceb2e4de1',
            itemText: 'Pull On Neutral Pant',
            price: null,
            priceAfterItemDiscount: null,
            priceAfterOrderDiscount: 0,
            productId: '701643458493M',
            productName: 'Pull On Neutral Pant',
            quantity: 2,
            shipmentId: 'me',
            tax: null,
            taxBasis: null,
            taxClassId: null,
            taxRate: null
        }
    ],
    gift: false,
    itemId: 'fad979ade1af47638664643e68',
    itemText: "Women's clothing test bundle",
    price: 226,
    priceAfterItemDiscount: 226,
    priceAfterOrderDiscount: 226,
    productId: 'test-bundle',
    productName: "Women's clothing test bundle",
    quantity: 2,
    shipmentId: 'me',
    shippingItemId: '2ce8eee0b491aaaaa5b8ca5bac',
    tax: 11.3,
    taxBasis: 226,
    taxClassId: 'standard',
    taxRate: 0.05,
    currency: 'USD',
    id: 'test-bundle',
    imageGroups: [
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , large",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7371cdfc/images/large/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7371cdfc/images/large/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'large'
        },
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , medium",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw254de12a/images/medium/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw254de12a/images/medium/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'medium'
        },
        {
            images: [
                {
                    alt: "Women's clothing test bundle, , small",
                    disBaseLink:
                        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_014/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4d788f3f/images/small/PG.60119239.JJ887XX.PZ.jpg',
                    link: 'https://zzrf-014.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4d788f3f/images/small/PG.60119239.JJ887XX.PZ.jpg',
                    title: "Women's clothing test bundle, "
                }
            ],
            viewType: 'small'
        }
    ],
    inventory: {
        ats: 91,
        backorderable: false,
        id: 'inventory_m',
        orderable: true,
        preorderable: false,
        stockLevel: 91
    },
    minOrderQuantity: 1,
    name: "Women's clothing test bundle",
    pricePerUnit: 113,
    primaryCategoryId: 'womens-jewelry-earrings',
    slugUrl:
        'https://zzrf-014.dx.commercecloud.salesforce.com/s/RefArch/womens/jewelry/earrings/test-bundle.html?lang=en_US',
    stepQuantity: 1,
    type: {
        bundle: true
    },
    unitQuantity: 0,
    c_isNewtest: false,
    c_isSale: false
}

export const mockProductBundleWithVariants = {
    limit: 3,
    data: [
        {
            ...childProducts[0],
            id: '701644044213M',
            type: {
                variant: true
            },
            variationValues: {
                color: 'JJGN9A0',
                size: '016'
            },
            c_color: 'JJGN9A0',
            c_refinementColor: 'pink',
            c_size: '016',
            c_width: 'Z'
        },
        {
            ...childProducts[1],
            id: '701643473939M',
            type: {
                variant: true
            },
            variationValues: {
                color: 'JJ169XX',
                size: '9XL'
            },
            c_color: 'JJ169XX',
            c_refinementColor: 'black',
            c_size: '9XL',
            c_width: 'Z'
        },
        {
            ...childProducts[2],
            id: '701643458493M',
            type: {
                variant: true
            },
            variationValues: {
                color: 'JJ0CZXX',
                size: '9XL'
            },
            c_color: 'JJ0CZXX',
            c_isNewtest: true,
            c_refinementColor: 'black',
            c_size: '9XL',
            c_width: 'Z'
        }
    ],
    total: 3
}

export const mockGetBundleChildrenProducts = [
    {
        currency: 'GBP',
        id: '701644044220M',
        inventory: {
            ats: 83,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 83
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
        productPromotions: [
            {
                calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
            }
        ],
        shortDescription:
            'This sleeveless pleated front blouse is an incredibly versatile blouse.  We love it from nine-to-five and beyond.',
        slugUrl:
            'https://zzrf-014.dx.commercecloud.salesforce.com/s/RefArchGlobal/sleeveless-pleated-floral-front-blouse/701644044220M.html?lang=en_GB',
        stepQuantity: 1,
        type: {
            variant: true
        },
        unitMeasure: '',
        unitQuantity: 0,
        upc: '701644044220',
        validFrom: {
            default: '2011-01-26T05:00:00.000Z'
        },
        variants: [
            {
                orderable: true,
                price: 35.19,
                productId: '701644044220M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '004'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044183M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '010'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044244M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '008'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044190M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '012'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044237M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '006'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044206M',
                variationValues: {
                    color: 'JJGN9A0',
                    size: '014'
                }
            },
            {
                orderable: true,
                price: 35.19,
                productId: '701644044213M',
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
                        name: '6',
                        orderable: true,
                        value: '006'
                    },
                    {
                        name: '8',
                        orderable: true,
                        value: '008'
                    },
                    {
                        name: '10',
                        orderable: true,
                        value: '010'
                    },
                    {
                        name: '12',
                        orderable: true,
                        value: '012'
                    },
                    {
                        name: '14',
                        orderable: true,
                        value: '014'
                    },
                    {
                        name: '16',
                        orderable: true,
                        value: '016'
                    }
                ]
            }
        ],
        variationValues: {
            color: 'JJGN9A0',
            size: '004'
        },
        c_color: 'JJGN9A0',
        c_refinementColor: 'pink',
        c_size: '004',
        c_width: 'Z'
    },
    {
        currency: 'GBP',
        id: '701643473991M',
        inventory: {
            ats: 96,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 3
        },
        longDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        master: {
            masterId: '25565139M',
            orderable: true,
            price: 37.76
        },
        minOrderQuantity: 1,
        name: 'Swing Tank',
        pageDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        pageTitle: 'Swing Tank',
        price: 37.76,
        pricePerUnit: 37.76,
        productPromotions: [
            {
                calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
            }
        ],
        shortDescription:
            'This relaxed fit tank with a ribbed inset is a perfect way to update your wardrobe for a new season.',
        slugUrl:
            'https://zzrf-014.dx.commercecloud.salesforce.com/s/RefArchGlobal/swing-tank/701643473991M.html?lang=en_GB',
        stepQuantity: 1,
        type: {
            variant: true
        },
        unitMeasure: '',
        unitQuantity: 0,
        upc: '701643473946',
        validFrom: {
            default: '2010-12-29T05:00:00.000Z'
        },
        variants: [
            {
                orderable: true,
                price: 37.76,
                productId: '701643473908M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473953M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473915M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473960M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473922M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9SM'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473946M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473991M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473939M',
                variationValues: {
                    color: 'JJ169XX',
                    size: '9XL'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473977M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9SM'
                }
            },
            {
                orderable: true,
                price: 37.76,
                productId: '701643473984M',
                variationValues: {
                    color: 'JJ667A8',
                    size: '9XL'
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
                        name: 'dk meadown rose',
                        orderable: true,
                        value: 'JJ667A8'
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
        ],
        variationValues: {
            color: 'JJ667A8',
            size: '9XS'
        },
        c_color: 'JJ667A8',
        c_refinementColor: 'black',
        c_size: '9XS',
        c_width: 'Z'
    },
    {
        currency: 'GBP',
        id: '701643458486M',
        inventory: {
            ats: 88,
            backorderable: false,
            id: 'inventory_m',
            orderable: true,
            preorderable: false,
            stockLevel: 88
        },
        longDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        master: {
            masterId: '25565094M',
            orderable: true,
            price: 44.16
        },
        minOrderQuantity: 1,
        name: 'Pull On Neutral Pant',
        pageDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        pageTitle: 'Pull On Neutral Pant',
        price: 44.16,
        pricePerUnit: 44.16,
        shortDescription:
            'Spring into a new season with this perfect neutral  pull on pant. Add the matching jacket for a perfect desk-to-dinner look.',
        slugUrl:
            'https://zzrf-014.dx.commercecloud.salesforce.com/s/RefArchGlobal/pull-on-neutral-pant/701643458486M.html?lang=en_GB',
        stepQuantity: 1,
        type: {
            variant: true
        },
        unitMeasure: '',
        unitQuantity: 0,
        upc: '701643458486',
        validFrom: {
            default: '2010-12-29T05:00:00.000Z'
        },
        variants: [
            {
                orderable: true,
                price: 44.16,
                productId: '701643458462M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9LG'
                }
            },
            {
                orderable: true,
                price: 44.16,
                productId: '701643458509M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9XS'
                }
            },
            {
                orderable: true,
                price: 44.16,
                productId: '701643458479M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9MD'
                }
            },
            {
                orderable: true,
                price: 44.16,
                productId: '701643458493M',
                variationValues: {
                    color: 'JJ0CZXX',
                    size: '9XL'
                }
            },
            {
                orderable: true,
                price: 44.16,
                productId: '701643458486M',
                variationValues: {
                    color: 'JJ0CZXX',
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
                        name: 'Black & Sugar',
                        orderable: true,
                        value: 'JJ0CZXX'
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
        ],
        variationValues: {
            color: 'JJ0CZXX',
            size: '9SM'
        },
        c_color: 'JJ0CZXX',
        c_isNewtest: true,
        c_refinementColor: 'black',
        c_size: '9SM',
        c_width: 'Z'
    }
]

export const bundleProductItemsForPDP = [
    {
        adjustedTax: 3.5,
        basePrice: 73.4,
        bonusProductLineItem: false,
        bundledProductItems: [
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '443cf1938dadc42f25f2c38a15',
                itemText: 'Shimmer Blouse',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '701642893561M',
                productName: 'Shimmer Blouse',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '47263213b76f1befb4d74fdb34',
                itemText: 'Washable Wool Classic Straight Skirt ',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '701641017319M',
                productName: 'Washable Wool Classic Straight Skirt ',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: 'a5432d60a8b40233b6c9521b7f',
                itemText: 'Aylin',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '740357479905M',
                productName: 'Aylin',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            }
        ],
        gift: false,
        itemId: '7e9d92dd5fdc38e1d1c6241460',
        itemText: "Women's clothing test bundle",
        price: 73.4,
        priceAfterItemDiscount: 73.4,
        priceAfterOrderDiscount: 73.4,
        productId: 'test-bundle',
        productName: "Women's clothing test bundle",
        quantity: 1,
        shipmentId: 'me',
        shippingItemId: 'd2ff12ff1cd08a5ba593fb181a',
        tax: 3.5,
        taxBasis: 73.4,
        taxClassId: 'standard',
        taxRate: 0.05
    },
    {
        adjustedTax: 3.5,
        basePrice: 73.4,
        bonusProductLineItem: false,
        bundledProductItems: [
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '609fa4fe374d39972610203c5e',
                itemText: 'Shimmer Blouse',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '701642893547M',
                productName: 'Shimmer Blouse',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '4ea3d7d5ef65332ef04e6142c8',
                itemText: 'Washable Wool Classic Straight Skirt ',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '701641017302M',
                productName: 'Washable Wool Classic Straight Skirt ',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '96406b029542ecd73e101e799d',
                itemText: 'Aylin',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '740357479875M',
                productName: 'Aylin',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            }
        ],
        gift: false,
        itemId: '10460508e7fa91e51157f48b58',
        itemText: "Women's clothing test bundle",
        price: 73.4,
        priceAfterItemDiscount: 73.4,
        priceAfterOrderDiscount: 73.4,
        productId: 'test-bundle',
        productName: "Women's clothing test bundle",
        quantity: 1,
        shipmentId: 'me',
        shippingItemId: 'dcef3c80b398c56aa215329c95',
        tax: 3.5,
        taxBasis: 73.4,
        taxClassId: 'standard',
        taxRate: 0.05
    },
    {
        adjustedTax: 3.5,
        basePrice: 73.4,
        bonusProductLineItem: false,
        bundledProductItems: [
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: 'd7a42d92e295b0f067c13ad289',
                itemText: 'Sleeveless Pleated Floral Front Blouse',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '25592770M',
                productName: 'Sleeveless Pleated Floral Front Blouse',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: '575af8f54681cf7f1b44241f99',
                itemText: 'Swing Tank',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '25565139M',
                productName: 'Swing Tank',
                quantity: 1,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            },
            {
                adjustedTax: null,
                basePrice: null,
                bonusProductLineItem: false,
                gift: false,
                itemId: 'bab1184abe0332790e0d726576',
                itemText: 'Pull On Neutral Pant',
                price: null,
                priceAfterItemDiscount: null,
                priceAfterOrderDiscount: 0,
                productId: '25565094M',
                productName: 'Pull On Neutral Pant',
                quantity: 2,
                shipmentId: 'me',
                tax: null,
                taxBasis: null,
                taxClassId: 'standard',
                taxRate: 0.05
            }
        ],
        gift: false,
        itemId: 'f5d65c1cb082a5248318693f16',
        itemText: "Women's clothing test bundle",
        price: 73.4,
        priceAfterItemDiscount: 73.4,
        priceAfterOrderDiscount: 73.4,
        productId: 'test-bundle',
        productName: "Women's clothing test bundle",
        quantity: 1,
        shipmentId: 'me',
        shippingItemId: 'bf801710265b0180f97f022fdf',
        tax: 3.5,
        taxBasis: 73.4,
        taxClassId: 'standard',
        taxRate: 0.05
    }
]

export const basketWithProductBundle = {
    adjustedMerchandizeTotalTax: 3.5,
    adjustedShippingTotalTax: 0.77,
    agentBasket: false,
    basketId: 'fc30fcdd188570930c5388c432',
    channelType: 'storefront',
    creationDate: '2024-06-27T02:28:28.370Z',
    currency: 'GBP',
    customerInfo: {
        customerId: 'abwrsVlrJGkXwRkboXlqYYkekZ',
        email: ''
    },
    lastModified: '2024-06-27T02:28:31.634Z',
    merchandizeTotalTax: 3.5,
    notes: {},
    orderTotal: 89.39,
    productItems: [
        {
            adjustedTax: 3.5,
            basePrice: 73.4,
            bonusProductLineItem: false,
            bundledProductItems: [
                {
                    adjustedTax: null,
                    basePrice: null,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: 'c506ab52b4bc1343f7c99f315b',
                    itemText: 'Sleeveless Pleated Floral Front Blouse',
                    price: null,
                    priceAfterItemDiscount: null,
                    priceAfterOrderDiscount: 0,
                    productId: '701644044220M',
                    productName: 'Sleeveless Pleated Floral Front Blouse',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: null,
                    taxBasis: null,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: null,
                    basePrice: null,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '5d3ca71f945e022649b4be65c4',
                    itemText: 'Swing Tank',
                    price: null,
                    priceAfterItemDiscount: null,
                    priceAfterOrderDiscount: 0,
                    productId: '701643473991M',
                    productName: 'Swing Tank',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: null,
                    taxBasis: null,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: null,
                    basePrice: null,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '6d0893f677020af5543dc26292',
                    itemText: 'Pull On Neutral Pant',
                    price: null,
                    priceAfterItemDiscount: null,
                    priceAfterOrderDiscount: 0,
                    productId: '701643458486M',
                    productName: 'Pull On Neutral Pant',
                    quantity: 2,
                    shipmentId: 'me',
                    tax: null,
                    taxBasis: null,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            gift: false,
            itemId: '1032530dffefa662c1f0dcfe4e',
            itemText: "Women's clothing test bundle",
            price: 73.4,
            priceAfterItemDiscount: 73.4,
            priceAfterOrderDiscount: 73.4,
            productId: 'test-bundle',
            productName: "Women's clothing test bundle",
            quantity: 1,
            shipmentId: 'me',
            shippingItemId: '556a3f76166cd45c3cbfbbeade',
            tax: 3.5,
            taxBasis: 73.4,
            taxClassId: 'standard',
            taxRate: 0.05,
            type: {bundle: true}
        }
    ],
    productSubTotal: 73.4,
    productTotal: 73.4,
    shipments: [
        {
            adjustedMerchandizeTotalTax: 3.5,
            adjustedShippingTotalTax: 0.77,
            gift: false,
            merchandizeTotalTax: 3.5,
            productSubTotal: 73.4,
            productTotal: 73.4,
            shipmentId: 'me',
            shipmentTotal: 89.39,
            shippingMethod: {
                description: 'Order received within 7-10 business days',
                id: 'GBP001',
                name: 'Ground',
                price: 15.99,
                c_estimatedArrivalTime: '7-10 Business Days'
            },
            shippingStatus: 'not_shipped',
            shippingTotal: 15.99,
            shippingTotalTax: 0.77,
            taxTotal: 4.27
        }
    ],
    shippingItems: [
        {
            adjustedTax: 0.29,
            basePrice: 5.99,
            itemId: 'a39a6070667d1078c4693b6ab1',
            itemText: 'Shipping',
            price: 5.99,
            priceAfterItemDiscount: 5.99,
            shipmentId: 'me',
            tax: 0.29,
            taxBasis: 5.99,
            taxClassId: 'standard',
            taxRate: 0.05
        },
        {
            adjustedTax: 0.48,
            basePrice: 10,
            itemId: '556a3f76166cd45c3cbfbbeade',
            itemText: 'Item Shipping Cost (Surcharge)',
            price: 10,
            priceAfterItemDiscount: 10,
            shipmentId: 'me',
            tax: 0.48,
            taxBasis: 10,
            taxClassId: 'standard',
            taxRate: 0.05
        }
    ],
    shippingTotal: 15.99,
    shippingTotalTax: 0.77,
    taxation: 'gross',
    taxTotal: 4.27
}
