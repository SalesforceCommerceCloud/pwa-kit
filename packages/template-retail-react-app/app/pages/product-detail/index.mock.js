/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const basketWithProductSet = {
    _v: '21.3',
    _type: 'basket',
    _resource_state: '9fdc9a8aeaea84a84a9dfed115ad37a0a32c86df4693cc7a9f62afc3395527c7',
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
            type: 'OrderTotalNotSet',
            message: 'Order total missing, calculation failed.',
            path: '$.order_total'
        },
        {
            _type: 'flash',
            type: 'ShippingAddressRequired',
            message: 'No shipping address was specified. Please provide a valid shipping address.',
            path: '$.shipments[0].shipping_address',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingMethodRequired',
            message:
                'No shipping method ID was specified. Please provide a valid shipping method ID.',
            path: '$.shipments[0].shipping_method',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingItemAdjustedPriceNotSet',
            message: "Price missing for shipping item ''5fb887a2999303b33676e0d3a5''.",
            path: '$.shipping_items[0].adjusted_price'
        }
    ],
    adjusted_merchandize_total_tax: 17.01,
    adjusted_shipping_total_tax: null,
    agent_basket: false,
    basket_id: '437113007d685eab389f1cd229',
    channel_type: 'storefront',
    creation_date: '2023-02-22T21:47:29.585Z',
    currency: 'GBP',
    customer_info: {
        _type: 'customer_info',
        customer_id: 'abkHtKmulJkKgRmrkVwqYYkHBI',
        email: ''
    },
    last_modified: '2023-02-22T22:15:41.482Z',
    merchandize_total_tax: 17.01,
    notes: {
        _type: 'simple_link',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/dw/shop/v21_3/baskets/437113007d685eab389f1cd229/notes'
    },
    order_total: null,
    product_items: [
        {
            _type: 'product_item',
            adjusted_tax: 6.76,
            base_price: 71.03,
            bonus_product_line_item: false,
            gift: false,
            item_id: '5060f31486572338f05d04fc56',
            item_text: 'Quilted Jacket',
            price: 142.06,
            price_after_item_discount: 142.06,
            price_after_order_discount: 142.06,
            product_id: '701642853695M',
            product_name: 'Quilted Jacket',
            quantity: 2,
            shipment_id: 'me',
            tax: 6.76,
            tax_basis: 142.06,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 4.21,
            base_price: 44.16,
            bonus_product_line_item: false,
            gift: false,
            item_id: '9a8003bebeea153d112083f2bd',
            item_text: 'Pull On Pant',
            price: 88.32,
            price_after_item_discount: 88.32,
            price_after_order_discount: 88.32,
            product_id: '701642867104M',
            product_name: 'Pull On Pant',
            quantity: 2,
            shipment_id: 'me',
            tax: 4.21,
            tax_basis: 88.32,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1cda01244dc449d9b245577378',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358101M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1007d8db121aa4331836f8f934',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358095M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    product_sub_total: 357.1,
    product_total: 357.1,
    shipments: [
        {
            _type: 'shipment',
            adjusted_merchandize_total_tax: 17.01,
            adjusted_shipping_total_tax: null,
            gift: false,
            merchandize_total_tax: 17.01,
            product_sub_total: 357.1,
            product_total: 357.1,
            shipment_id: 'me',
            shipment_total: null,
            shipping_status: 'not_shipped',
            shipping_total: null,
            shipping_total_tax: null,
            tax_total: null
        }
    ],
    shipping_items: [
        {
            _type: 'shipping_item',
            adjusted_tax: null,
            base_price: null,
            item_id: '5fb887a2999303b33676e0d3a5',
            item_text: 'Shipping',
            price: null,
            price_after_item_discount: null,
            shipment_id: 'me',
            tax: null,
            tax_basis: null,
            tax_class_id: null,
            tax_rate: 0.05
        }
    ],
    shipping_total: null,
    shipping_total_tax: null,
    taxation: 'gross',
    tax_total: null
}

export const einsteinRecommendation = {
    recs: [
        {
            id: '11736753M',
            product_name: 'Summer Bomber Jacket',
            image_url:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZCU_007/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5e894c3a/images/large/B0574182_001_L1.jpg',
            product_url:
                'https://zzcu-007.sandbox.us01.dx.commercecloud.salesforce.com/mens-summer-bomber-jacket/11736753M.html?lang=en_US'
        }
    ],
    recoUUID: '79e9f44e-c4d3-405a-ae4c-eba7b4bfdd4a'
}
