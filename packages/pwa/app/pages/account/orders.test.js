/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Orders from './orders'
import OrderHistory from './order-history'
import OrderDetail from './order-detail'

jest.useFakeTimers()
jest.setTimeout(30000)

const mockCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId'
}

const MockedOrderHistory = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])

    //Only render orders after login is complete
    if (!customer.customerId) {
        return null
    }
    return (
        <div>
            <div>{customer.customerId}</div>
            <Orders />
        </div>
    )
}

const MockedOrderDetails = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])

    //Only render orders after login is complete
    if (!customer.customerId) {
        return null
    }
    return (
        <div>
            <div>{customer.customerId}</div>
            <OrderDetail />
        </div>
    )
}

const mockOrderHistory = {
    limit: 10,
    data: [
        {
            adjustedMerchandizeTotalTax: 3.15,
            adjustedShippingTotalTax: 0.3,
            billingAddress: {
                address1: '2700 Desoto Way S',
                city: 'Saint Petersburg',
                countryCode: 'US',
                firstName: 'tester',
                fullName: 'tester testing',
                id: '06bca352dc44586ae82cd085c1',
                lastName: 'testing',
                phone: '7275551234',
                postalCode: '33712',
                stateCode: 'FL'
            },
            channelType: 'storefront',
            confirmationStatus: 'not_confirmed',
            createdBy: 'Customer',
            creationDate: '2021-04-06T20:15:40.000Z',
            currency: 'USD',
            customerInfo: {
                customerId: 'customerid',
                customerName: ' testing',
                customerNo: '00149004',
                email: 'tester@test.com'
            },
            customerName: ' testing',
            exportStatus: 'not_exported',
            lastModified: '2021-04-06T20:15:40.000Z',
            merchandizeTotalTax: 3.15,
            notes: {},
            orderNo: '00028011',
            orderToken: 'oiC2ta2H_SZTKspfu0Sc0e41Rp4kaO0oTCSswf7tALw',
            orderTotal: 72.42,
            paymentInstruments: [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Visa',
                        creditCardExpired: false,
                        expirationMonth: 1,
                        expirationYear: 2022,
                        holder: 'tester testing',
                        maskedNumber: '************1111',
                        numberLastDigits: '1111',
                        validFromMonth: 1,
                        validFromYear: 2020
                    },
                    paymentInstrumentId: 'fd4ddecfc5c95b60c7898bbd2a',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ],
            paymentStatus: 'not_paid',
            productItems: [
                {
                    adjustedTax: 2.4,
                    basePrice: 47.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '1ae8e9a67e2f6aa2408d87ae37',
                    itemText: 'Pleated Bib Long Sleeve Shirt',
                    price: 47.99,
                    priceAfterItemDiscount: 47.99,
                    priceAfterOrderDiscount: 47.99,
                    productId: '701642852179M',
                    productName: 'Pleated Bib Long Sleeve Shirt',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 2.4,
                    taxBasis: 47.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 0.75,
                    basePrice: 14.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: 'e60d5d71f128440894f4b023dd',
                    itemText: 'Long Sleeve Crew Neck',
                    price: 14.99,
                    priceAfterItemDiscount: 14.99,
                    priceAfterOrderDiscount: 14.99,
                    productId: '701642811398M',
                    productName: 'Long Sleeve Crew Neck',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 0.75,
                    taxBasis: 14.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            productSubTotal: 62.98,
            productTotal: 62.98,
            shipments: [
                {
                    adjustedMerchandizeTotalTax: 3.15,
                    adjustedShippingTotalTax: 0.3,
                    gift: false,
                    merchandizeTotalTax: 3.15,
                    productSubTotal: 62.98,
                    productTotal: 62.98,
                    shipmentId: 'me',
                    shipmentTotal: 72.42,
                    shippingAddress: {
                        address1: '2700 Desoto Way S',
                        city: 'Saint Petersburg',
                        countryCode: 'US',
                        firstName: 'tester',
                        fullName: 'tester testing',
                        id: 'bcb56169768a0ccce114a664e5',
                        lastName: 'testing',
                        phone: '7275551234',
                        postalCode: '33712',
                        stateCode: 'FL'
                    },
                    shippingMethod: {
                        description: 'Order received within 7-10 business days',
                        id: '001',
                        name: 'Ground',
                        c_estimatedArrivalTime: '7-10 Business Days'
                    },
                    shippingStatus: 'not_shipped',
                    shippingTotal: 5.99,
                    shippingTotalTax: 0.3,
                    taxTotal: 3.45
                }
            ],
            shippingItems: [
                {
                    adjustedTax: 0.3,
                    basePrice: 5.99,
                    itemId: '7d47f50998e2ff9590df8d7daa',
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
            shippingStatus: 'not_shipped',
            shippingTotal: 5.99,
            shippingTotalTax: 0.3,
            siteId: 'RefArch',
            status: 'created',
            taxation: 'net',
            taxTotal: 3.45
        },
        {
            adjustedMerchandizeTotalTax: 3.15,
            adjustedShippingTotalTax: 0.3,
            billingAddress: {
                address1: '2700 Desoto Way S',
                city: 'Saint Petersburg',
                countryCode: 'US',
                firstName: 'tester',
                fullName: 'tester testing',
                id: '48692a8d1adb48bdb01e61a7f6',
                lastName: 'testing',
                phone: '7275551234',
                postalCode: '33712',
                stateCode: 'FL'
            },
            channelType: 'storefront',
            confirmationStatus: 'not_confirmed',
            createdBy: 'Customer',
            creationDate: '2021-04-06T19:16:15.000Z',
            currency: 'USD',
            customerInfo: {
                customerId: 'customerid',
                customerName: ' testing',
                customerNo: '00149004',
                email: 'tester@test.com'
            },
            customerName: ' testing',
            exportStatus: 'not_exported',
            lastModified: '2021-04-06T19:16:15.000Z',
            merchandizeTotalTax: 3.15,
            notes: {},
            orderNo: '00028010',
            orderToken: 'ncyXKSHbB0TWkEbESOZpYtJnCpoWyV4EwTH7fp3PV0w',
            orderTotal: 72.42,
            paymentInstruments: [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Master Card',
                        creditCardExpired: false,
                        expirationMonth: 1,
                        expirationYear: 2022,
                        holder: 'tester testing',
                        maskedNumber: '************5454',
                        numberLastDigits: '5454',
                        validFromMonth: 1,
                        validFromYear: 2020
                    },
                    paymentInstrumentId: '2aadecebb15f35913e8ce76a54',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ],
            paymentStatus: 'not_paid',
            productItems: [
                {
                    adjustedTax: 2.4,
                    basePrice: 47.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: 'b119f1d13193712023c6457ec0',
                    itemText: 'Pleated Bib Long Sleeve Shirt',
                    price: 47.99,
                    priceAfterItemDiscount: 47.99,
                    priceAfterOrderDiscount: 47.99,
                    productId: '701642852179M',
                    productName: 'Pleated Bib Long Sleeve Shirt',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 2.4,
                    taxBasis: 47.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 0.75,
                    basePrice: 14.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '97b033c49c69f2bb72c11b8db7',
                    itemText: 'Long Sleeve Crew Neck',
                    price: 14.99,
                    priceAfterItemDiscount: 14.99,
                    priceAfterOrderDiscount: 14.99,
                    productId: '701642811398M',
                    productName: 'Long Sleeve Crew Neck',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 0.75,
                    taxBasis: 14.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            productSubTotal: 62.98,
            productTotal: 62.98,
            shipments: [
                {
                    adjustedMerchandizeTotalTax: 3.15,
                    adjustedShippingTotalTax: 0.3,
                    gift: false,
                    merchandizeTotalTax: 3.15,
                    productSubTotal: 62.98,
                    productTotal: 62.98,
                    shipmentId: 'me',
                    shipmentTotal: 72.42,
                    shippingAddress: {
                        address1: '2700 Desoto Way S',
                        city: 'Saint Petersburg',
                        countryCode: 'US',
                        firstName: 'tester',
                        fullName: 'tester testing',
                        id: 'de9186fdf4b0f2c3c0334542d7',
                        lastName: 'testing',
                        phone: '7275551234',
                        postalCode: '33712',
                        stateCode: 'FL'
                    },
                    shippingMethod: {
                        description: 'Order received within 7-10 business days',
                        id: '001',
                        name: 'Ground',
                        c_estimatedArrivalTime: '7-10 Business Days'
                    },
                    shippingStatus: 'not_shipped',
                    shippingTotal: 5.99,
                    shippingTotalTax: 0.3,
                    taxTotal: 3.45
                }
            ],
            shippingItems: [
                {
                    adjustedTax: 0.3,
                    basePrice: 5.99,
                    itemId: 'fb330a2f980bd715bf5db8607a',
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
            shippingStatus: 'not_shipped',
            shippingTotal: 5.99,
            shippingTotalTax: 0.3,
            siteId: 'RefArch',
            status: 'created',
            taxation: 'net',
            taxTotal: 3.45
        },
        {
            adjustedMerchandizeTotalTax: 6.3,
            adjustedShippingTotalTax: 0.4,
            billingAddress: {
                address1: '2700 Desoto Way S',
                city: 'Saint Petersburg',
                countryCode: 'US',
                firstName: 'tester',
                fullName: 'tester testing',
                id: '3f37d99f137e68e118ce0dcd30',
                lastName: 'testing',
                phone: '7275551234',
                postalCode: '33712',
                stateCode: 'FL'
            },
            channelType: 'storefront',
            confirmationStatus: 'not_confirmed',
            createdBy: 'Customer',
            creationDate: '2021-04-06T19:14:32.000Z',
            currency: 'USD',
            customerInfo: {
                customerId: 'customerid',
                customerName: ' testing',
                customerNo: '00149004',
                email: 'tester@test.com'
            },
            customerName: ' testing',
            exportStatus: 'not_exported',
            lastModified: '2021-04-06T19:14:32.000Z',
            merchandizeTotalTax: 6.3,
            notes: {},
            orderNo: '00028009',
            orderToken: '56PXEg-7z6a0OdJslrJI6YLTTlFWzuYP9mL8vU1As3o',
            orderTotal: 140.65,
            paymentInstruments: [
                {
                    amount: 0,
                    paymentCard: {
                        cardType: 'Master Card',
                        creditCardExpired: false,
                        expirationMonth: 1,
                        expirationYear: 2022,
                        holder: 'tester testing',
                        maskedNumber: '************5454',
                        numberLastDigits: '5454',
                        validFromMonth: 1,
                        validFromYear: 2020
                    },
                    paymentInstrumentId: '99e32045955705b49b343b852a',
                    paymentMethodId: 'CREDIT_CARD'
                }
            ],
            paymentStatus: 'not_paid',
            productItems: [
                {
                    adjustedTax: 4.8,
                    basePrice: 47.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '1efcc8e1646ff4d36da43a9784',
                    itemText: 'Pleated Bib Long Sleeve Shirt',
                    price: 95.98,
                    priceAfterItemDiscount: 95.98,
                    priceAfterOrderDiscount: 95.98,
                    productId: '701642852179M',
                    productName: 'Pleated Bib Long Sleeve Shirt',
                    quantity: 2,
                    shipmentId: 'me',
                    tax: 4.8,
                    taxBasis: 95.98,
                    taxClassId: 'standard',
                    taxRate: 0.05
                },
                {
                    adjustedTax: 1.5,
                    basePrice: 14.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: 'e0553dd676331dc8de59c0784a',
                    itemText: 'Long Sleeve Crew Neck',
                    price: 29.98,
                    priceAfterItemDiscount: 29.98,
                    priceAfterOrderDiscount: 29.98,
                    productId: '701642811398M',
                    productName: 'Long Sleeve Crew Neck',
                    quantity: 2,
                    shipmentId: 'me',
                    tax: 1.5,
                    taxBasis: 29.98,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            productSubTotal: 125.96,
            productTotal: 125.96,
            shipments: [
                {
                    adjustedMerchandizeTotalTax: 6.3,
                    adjustedShippingTotalTax: 0.4,
                    gift: false,
                    merchandizeTotalTax: 6.3,
                    productSubTotal: 125.96,
                    productTotal: 125.96,
                    shipmentId: 'me',
                    shipmentTotal: 140.65,
                    shippingAddress: {
                        address1: '2700 Desoto Way S',
                        city: 'Saint Petersburg',
                        countryCode: 'US',
                        firstName: 'tester',
                        fullName: 'tester testing',
                        id: '7cc3b6ea84774193fde332c61a',
                        lastName: 'testing',
                        phone: '7275551234',
                        postalCode: '33712',
                        stateCode: 'FL'
                    },
                    shippingMethod: {
                        description: 'Order received within 7-10 business days',
                        id: '001',
                        name: 'Ground',
                        c_estimatedArrivalTime: '7-10 Business Days'
                    },
                    shippingStatus: 'not_shipped',
                    shippingTotal: 7.99,
                    shippingTotalTax: 0.4,
                    taxTotal: 6.7
                }
            ],
            shippingItems: [
                {
                    adjustedTax: 0.4,
                    basePrice: 7.99,
                    itemId: '1a72125aef737dbb2e6ec96dd9',
                    itemText: 'Shipping',
                    price: 7.99,
                    priceAfterItemDiscount: 7.99,
                    shipmentId: 'me',
                    tax: 0.4,
                    taxBasis: 7.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ],
            shippingStatus: 'not_shipped',
            shippingTotal: 7.99,
            shippingTotalTax: 0.4,
            siteId: 'RefArch',
            status: 'created',
            taxation: 'net',
            taxTotal: 6.7
        }
    ],
    offset: 0,
    total: 20
}

export const mockOrderProducts = {
    limit: 2,
    data: [
        {
            currency: 'USD',
            id: '701642852179M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6dc64ae1/images/large/PG.10201818.JJ1ANXX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6dc64ae1/images/large/PG.10201818.JJ1ANXX.PZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        },
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6c256020/images/large/PG.10201818.JJ1ANXX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6c256020/images/large/PG.10201818.JJ1ANXX.BZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ1ANXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad2ef842/images/medium/PG.10201818.JJ1ANXX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad2ef842/images/medium/PG.10201818.JJ1ANXX.PZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        },
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwca64fee1/images/medium/PG.10201818.JJ1ANXX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwca64fee1/images/medium/PG.10201818.JJ1ANXX.BZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ1ANXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ecc9f4b/images/small/PG.10201818.JJ1ANXX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ecc9f4b/images/small/PG.10201818.JJ1ANXX.PZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        },
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc4b732e9/images/small/PG.10201818.JJ1ANXX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc4b732e9/images/small/PG.10201818.JJ1ANXX.BZ.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ1ANXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Pleated Bib Long Sleeve Shirt, Silver Grey, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc39b144c/images/swatch/PG.10201818.JJ1ANXX.CP.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc39b144c/images/swatch/PG.10201818.JJ1ANXX.CP.jpg',
                            title: 'Pleated Bib Long Sleeve Shirt, Silver Grey'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ1ANXX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 99,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 99
            },
            longDescription:
                'This is a feminine take on a tuxedo classic.  Pair it with a pair of Commerce Cloud Store slacks.',
            master: {
                masterId: '25518344M',
                orderable: true,
                price: 47.99
            },
            minOrderQuantity: 1,
            name: 'Pleated Bib Long Sleeve Shirt',
            pageDescription:
                'This is a feminine take on a tuxedo classic.  Pair it with a pair of Commerce Cloud Store slacks.',
            pageTitle: 'Pleated Bib Long Sleeve Shirt',
            price: 47.99,
            productPromotions: [
                {
                    calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                    promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
                }
            ],
            shortDescription:
                'This is a feminine take on a tuxedo classic.  Pair it with a pair of Commerce Cloud Store slacks.',
            stepQuantity: 1,
            type: {
                variant: true
            },
            upc: '701642852179',
            validFrom: {
                default: '2010-10-21T04:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 47.99,
                    productId: '701642852179M',
                    variationValues: {
                        color: 'JJ1ANXX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 47.99,
                    productId: '701642852209M',
                    variationValues: {
                        color: 'JJ1ANXX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 47.99,
                    productId: '701642852193M',
                    variationValues: {
                        color: 'JJ1ANXX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 47.99,
                    productId: '701642852186M',
                    variationValues: {
                        color: 'JJ1ANXX',
                        size: '9MD'
                    }
                }
            ],
            variationAttributes: [
                {
                    id: 'color',
                    name: 'Color',
                    values: [
                        {
                            name: 'Silver Grey',
                            orderable: true,
                            value: 'JJ1ANXX'
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
            ],
            variationValues: {
                color: 'JJ1ANXX',
                size: '9LG'
            },
            c_color: 'JJ1ANXX',
            c_isNewtest: true,
            c_isSale: true,
            c_refinementColor: 'grey',
            c_size: '9LG',
            c_width: 'Z'
        },
        {
            currency: 'USD',
            id: '701642811398M',
            imageGroups: [
                {
                    images: [
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3ce02e8b/images/large/PG.10219685.JJ825XX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3ce02e8b/images/large/PG.10219685.JJ825XX.PZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        },
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, large',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdc28ed23/images/large/PG.10219685.JJ825XX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdc28ed23/images/large/PG.10219685.JJ825XX.BZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ825XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'large'
                },
                {
                    images: [
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8434410d/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8434410d/images/medium/PG.10219685.JJ825XX.PZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        },
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, medium',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc50f7b16/images/medium/PG.10219685.JJ825XX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc50f7b16/images/medium/PG.10219685.JJ825XX.BZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ825XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'medium'
                },
                {
                    images: [
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8173d41b/images/small/PG.10219685.JJ825XX.PZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw8173d41b/images/small/PG.10219685.JJ825XX.PZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        },
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, small',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw426088e2/images/small/PG.10219685.JJ825XX.BZ.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw426088e2/images/small/PG.10219685.JJ825XX.BZ.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ825XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'small'
                },
                {
                    images: [
                        {
                            alt: 'Long Sleeve Crew Neck, Fire Red, swatch',
                            disBaseLink:
                                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbc8a4ed/images/swatch/PG.10219685.JJ825XX.CP.jpg',
                            link:
                                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbc8a4ed/images/swatch/PG.10219685.JJ825XX.CP.jpg',
                            title: 'Long Sleeve Crew Neck, Fire Red'
                        }
                    ],
                    variationAttributes: [
                        {
                            id: 'color',
                            values: [
                                {
                                    value: 'JJ825XX'
                                }
                            ]
                        }
                    ],
                    viewType: 'swatch'
                }
            ],
            inventory: {
                ats: 34,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 34
            },
            longDescription:
                'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
            master: {
                masterId: '25517823M',
                orderable: true,
                price: 14.99
            },
            minOrderQuantity: 1,
            name: 'Long Sleeve Crew Neck',
            pageDescription:
                'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
            pageTitle: 'Long Sleeve Crew Neck',
            price: 14.99,
            productPromotions: [
                {
                    calloutMsg: 'Buy one Long Center Seam Skirt and get 2 tops',
                    promotionId: 'ChoiceOfBonusProdect-ProductLevel-ruleBased'
                }
            ],
            shortDescription:
                'Wear this long sleeve crew neck top alone, or pair it with a jacket for a classic look.',
            stepQuantity: 1,
            type: {
                variant: true
            },
            upc: '701642811398',
            validFrom: {
                default: '2010-11-18T05:00:00.000Z'
            },
            variants: [
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811398M',
                    variationValues: {
                        color: 'JJ825XX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841227M',
                    variationValues: {
                        color: 'JJ3HDXX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841265M',
                    variationValues: {
                        color: 'JJ5QZXX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811473M',
                    variationValues: {
                        color: 'JJI15XX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811435M',
                    variationValues: {
                        color: 'JJG80XX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811312M',
                    variationValues: {
                        color: 'JJ2XNXX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811237M',
                    variationValues: {
                        color: 'JJ169XX',
                        size: '9LG'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643342570M',
                    variationValues: {
                        color: 'JJ3HDXX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811343M',
                    variationValues: {
                        color: 'JJ2XNXX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811404M',
                    variationValues: {
                        color: 'JJ825XX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811336M',
                    variationValues: {
                        color: 'JJ2XNXX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811268M',
                    variationValues: {
                        color: 'JJ169XX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643070756M',
                    variationValues: {
                        color: 'JJ2XNXX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811497M',
                    variationValues: {
                        color: 'JJI15XX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811480M',
                    variationValues: {
                        color: 'JJI15XX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811466M',
                    variationValues: {
                        color: 'JJG80XX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811428M',
                    variationValues: {
                        color: 'JJ825XX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643070732M',
                    variationValues: {
                        color: 'JJ825XX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811244M',
                    variationValues: {
                        color: 'JJ169XX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643070763M',
                    variationValues: {
                        color: 'JJG80XX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643342587M',
                    variationValues: {
                        color: 'JJ5QZXX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811503M',
                    variationValues: {
                        color: 'JJI15XX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811459M',
                    variationValues: {
                        color: 'JJG80XX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643070725M',
                    variationValues: {
                        color: 'JJ169XX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841289M',
                    variationValues: {
                        color: 'JJ5QZXX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841272M',
                    variationValues: {
                        color: 'JJ5QZXX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841241M',
                    variationValues: {
                        color: 'JJ3HDXX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811329M',
                    variationValues: {
                        color: 'JJ2XNXX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811251M',
                    variationValues: {
                        color: 'JJ169XX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701643070770M',
                    variationValues: {
                        color: 'JJI15XX',
                        size: '9XS'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841296M',
                    variationValues: {
                        color: 'JJ5QZXX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841258M',
                    variationValues: {
                        color: 'JJ3HDXX',
                        size: '9XL'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811442M',
                    variationValues: {
                        color: 'JJG80XX',
                        size: '9MD'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642811411M',
                    variationValues: {
                        color: 'JJ825XX',
                        size: '9SM'
                    }
                },
                {
                    orderable: true,
                    price: 14.99,
                    productId: '701642841234M',
                    variationValues: {
                        color: 'JJ3HDXX',
                        size: '9MD'
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
                            name: 'Grey Heather',
                            orderable: true,
                            value: 'JJ2XNXX'
                        },
                        {
                            name: 'Meadow Violet',
                            orderable: true,
                            value: 'JJ3HDXX'
                        },
                        {
                            name: 'Begonia Pink',
                            orderable: true,
                            value: 'JJ5QZXX'
                        },
                        {
                            name: 'Fire Red',
                            orderable: true,
                            value: 'JJ825XX'
                        },
                        {
                            name: 'Sugar',
                            orderable: true,
                            value: 'JJG80XX'
                        },
                        {
                            name: 'White',
                            orderable: true,
                            value: 'JJI15XX'
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
                color: 'JJ825XX',
                size: '9LG'
            },
            c_color: 'JJ825XX',
            c_refinementColor: 'red',
            c_size: '9LG',
            c_width: 'Z'
        }
    ],
    total: 2
}

jest.mock('../../commerce-api/auth', () => {
    return class AuthMock {
        login() {
            return mockCustomer
        }
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getCustomerOrders() {
                return mockOrderHistory
            }

            async getCustomer() {
                return mockCustomer
            }
        },
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async getProducts() {
                return mockOrderProducts
            }
        }
    }
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Renders order history', async () => {
    renderWithProviders(<MockedOrderHistory />)
    expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
    expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
    expect(
        await screen.findAllByAltText(
            'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
            {},
            {timeout: 15000}
        )
    ).toHaveLength(3)
})

test('Renders order details', async () => {
    renderWithProviders(<MockedOrderDetails />)
    expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    expect(await screen.findByText(/order number: 00028011/i)).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Pleated Bib Long Sleeve Shirt, Silver Grey, small/i)
    ).toBeInTheDocument()
    expect(
        await screen.findByAltText(/Long Sleeve Crew Neck, Fire Red, small/i)
    ).toBeInTheDocument()
})
