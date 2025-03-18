/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    _v: '21.3',
    _type: 'basket',
    _resource_state: '1d75bb3f6c79c4f367326378db1223fa865bd8a05301829e6478239889d7ea7c',
    _flash: [
        {
            _type: 'flash',
            type: 'PaymentMethodRequired',
            message:
                'No payment method ID was specified. Please provide a valid payment method ID.',
            path: '$.payment_instruments[0].payment_method_id'
        },
        {
            _type: 'flash',
            type: 'BillingAddressRequired',
            message: 'No billing address was specified. Please provide a valid billing address.',
            path: '$.billing_address'
        },
        {
            _type: 'flash',
            type: 'ShippingAddressRequired',
            message: 'No shipping address was specified. Please provide a valid shipping address.',
            path: '$.shipments[0].shipping_address',
            details: {shipmentId: 'me'}
        }
    ],
    adjusted_merchandize_total_tax: 30.0,
    adjusted_shipping_total_tax: 0.0,
    agent_basket: false,
    basket_id: '9303c9065ccc5fa2c7fca1d4b4',
    channel_type: 'storefront',
    creation_date: '2021-06-23T13:14:17.615Z',
    currency: 'USD',
    customer_info: {
        _type: 'customer_info',
        customer_id: 'customerid',
        email: ''
    },
    last_modified: '2021-06-23T17:46:51.237Z',
    merchandize_total_tax: 30.0,
    notes: {
        _type: 'simple_link',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v21_3/baskets/9303c9065ccc5fa2c7fca1d4b4/notes'
    },
    order_total: 629.98,
    product_items: [
        {
            _type: 'product_item',
            adjusted_tax: 30.0,
            base_price: 299.99,
            bonus_product_line_item: false,
            gift: false,
            item_id: '6c7041afcb69544a0554d53f0d',
            item_text: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
            price: 599.98,
            price_after_item_discount: 599.98,
            price_after_order_discount: 599.98,
            product_id: '750518699578M',
            product_name: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
            quantity: 2,
            shipment_id: 'me',
            tax: 30.0,
            tax_basis: 599.98,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    product_sub_total: 599.98,
    product_total: 599.98,
    shipments: [
        {
            _type: 'shipment',
            adjusted_merchandize_total_tax: 30.0,
            adjusted_shipping_total_tax: 0.0,
            gift: false,
            merchandize_total_tax: 30.0,
            product_sub_total: 599.98,
            product_total: 599.98,
            shipment_id: 'me',
            shipment_total: 629.98,
            shipping_method: {
                _type: 'shipping_method',
                description: 'The default shipping method.',
                id: 'DefaultShippingMethod',
                name: 'Default Shipping Method',
                price: 15.99,
                shipping_promotions: [
                    {
                        _type: 'shipping_promotion',
                        callout_msg: 'Free Shipping Amount Above 150',
                        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v21_3/promotions/3184d71eea54c9d27e88dc41ca',
                        promotion_id: 'FreeShippingAmountAbove150',
                        promotion_name: 'Free Shipping Amount Above 150'
                    }
                ],
                c_estimatedArrivalTime: '7-10 Business Days'
            },
            shipping_status: 'not_shipped',
            shipping_total: 0.0,
            shipping_total_tax: 0.8,
            tax_total: 30.0
        }
    ],
    shipping_items: [
        {
            _type: 'shipping_item',
            adjusted_tax: 0.0,
            base_price: 15.99,
            item_id: '1b84703bc2040ed99836b03ca1',
            item_text: 'Shipping',
            price: 15.99,
            price_adjustments: [
                {
                    _type: 'price_adjustment',
                    applied_discount: {_type: 'discount', amount: 1, type: 'free'},
                    creation_date: '2021-06-23T17:25:05.495Z',
                    custom: false,
                    item_text: 'Free Shipping Amount Above 150',
                    last_modified: '2021-06-23T17:46:51.237Z',
                    manual: false,
                    price: -15.99,
                    price_adjustment_id: '2a520873159147eb9759d2cc6f',
                    promotion_id: 'FreeShippingAmountAbove150',
                    promotion_link:
                        'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v21_3/promotions/FreeShippingAmountAbove150'
                }
            ],
            price_after_item_discount: 0.0,
            shipment_id: 'me',
            tax: 0.8,
            tax_basis: 15.99,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    shipping_total: 0.0,
    shipping_total_tax: 0.8,
    taxation: 'net',
    tax_total: 30.0
}
