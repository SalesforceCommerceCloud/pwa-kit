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
const mockVariantProductHit = {
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

export {mockProductSetHit, mockStandardProductHit, mockVariantProductHit, mockProductSearchItem}
